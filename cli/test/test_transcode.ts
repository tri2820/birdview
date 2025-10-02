/**
 * Transcode Example - Low Level API
 *
 * This is a direct port showing how the FFmpeg C API maps to our TypeScript bindings.
 * It demonstrates demuxing, decoding, filtering, encoding and muxing.
 *
 * Usage: tsx examples/transcode.ts <input> <output>
 * Example: tsx examples/transcode.ts testdata/video.mp4 examples/.tmp/transcode.mp4
 */

import { AVERROR_EAGAIN, AVERROR_EOF, IOContext, Packet } from "node-av";
import { cleanup, filter_encode_write_frame, flush_encoder, init_filters, open_input_file, open_output_file, TranscodeContext } from "../utils/transcode";
import fsPromises from 'fs/promises';
import { createWriteStream, WriteStream } from 'fs';
import { Writable } from "stream";
import RotatingWritable from "../utils/RotatingWritable";


async function transcode(input_file: string): Promise<number> {
    let ret: number;
    let transcodeCtx: TranscodeContext | null = null;
    const packet = new Packet();
    packet.alloc();

    try {
        const state: any = {};
        // Create the rotating writable stream with 10-second rotation interval
        const rotatingStream = new RotatingWritable('output', 'mp4');

        // Create IO context
        const io_ctx = new IOContext();
        let receivedBigChunk = false;
        let header: Buffer[] = []
        // Write callback must be synchronous and return bytes written
        io_ctx.allocContextWithCallbacks(
            4096,  // Buffer size
            1,     // Write mode
            null,
            (buffer) => {
                // console.log('Write callback', buffer.byteLength);

                // HACK: to capture header
                if (buffer.byteLength < 4096) {
                    if (!receivedBigChunk) {
                        header.push(buffer);
                        // Header will be written on first maybeRotate call
                        // Which is triggered on first non-header chunk
                        return buffer.byteLength;
                    }
                } else {
                    receivedBigChunk = true;
                }

                // First non-header chunk
                // Check if we need to rotate (this will also create the first file)
                const rotated = rotatingStream.maybeRotate();
                if (rotated) {
                    // Replicate header on every rotation
                    const headerChunk = Buffer.from(header.reduce((a, b) => Buffer.concat([a, b]), Buffer.alloc(0)));
                    rotatingStream.write(headerChunk);
                }

                const chunk = Buffer.from(buffer.buffer, buffer.byteOffset, buffer.byteLength);
                rotatingStream.write(chunk);
                return buffer.byteLength;
            },
            null
        );


        // Open input file
        const inputResult = await open_input_file(input_file);
        ret = inputResult.ret;
        if (ret < 0) {
            return ret;
        }

        const ifmt_ctx = inputResult.ctx;
        const stream_ctx = inputResult.streamCtx;

        // Open output file
        const outputResult = await open_output_file(ifmt_ctx, stream_ctx, io_ctx);
        ret = outputResult.ret;
        if (ret < 0) {
            return ret;
        }

        const ofmt_ctx = outputResult.ctx;
        state.ofmt_ctx = ofmt_ctx;

        // Initialize filters
        const filterResult = await init_filters(ifmt_ctx, stream_ctx);
        ret = filterResult.ret;
        if (ret < 0) {
            return ret;
        }

        const filter_ctx = filterResult.filterCtx;

        // Store the context for use in the function
        transcodeCtx = { ifmt_ctx, ofmt_ctx, stream_ctx, filter_ctx };

        // Read all packets
        while (true) {
            if ((ret = await ifmt_ctx.readFrame(packet)) < 0) {
                break;
            }
            const stream_index = packet.streamIndex;
            // console.log(`Demuxer gave frame of stream_index ${stream_index}`);

            if (filter_ctx[stream_index].filter_graph) {
                const stream = stream_ctx[stream_index];

                // console.log('Going to reencode&filter the frame');

                ret = await stream.dec_ctx!.sendPacket(packet);
                if (ret < 0) {
                    console.error('Decoding failed');
                    break;
                }

                while (ret >= 0) {
                    ret = await stream.dec_ctx!.receiveFrame(stream.dec_frame!);
                    if (ret === AVERROR_EOF || ret === AVERROR_EAGAIN) {
                        break;
                    } else if (ret < 0) {
                        return ret;
                    }

                    stream.dec_frame!.pts = stream.dec_frame!.bestEffortTimestamp;

                    // ADD ERROR HANDLING HERE:
                    // Check if frame has valid data before processing
                    if (stream.dec_frame!.bestEffortTimestamp === undefined ||
                        stream.dec_frame!.bestEffortTimestamp < 0) {
                        console.warn(`Skipping frame with invalid timestamp`);
                        stream.dec_frame!.unref();
                        continue;
                    }

                    ret = await filter_encode_write_frame(stream.dec_frame, stream_index, stream_ctx, filter_ctx, ofmt_ctx);
                    if (ret < 0) {
                        return ret;
                    }
                }
            } else {
                // Remux this frame without reencoding
                packet.rescaleTs(ifmt_ctx.streams![stream_index].timeBase, ofmt_ctx.streams![stream_index].timeBase);

                ret = await ofmt_ctx.interleavedWriteFrame(packet);
                if (ret < 0) {
                    return ret;
                }
            }
            packet.unref();
        }

        // Flush decoders, filters and encoders
        for (let i = 0; i < ifmt_ctx.nbStreams; i++) {
            if (!filter_ctx[i].filter_graph) {
                continue;
            }

            const stream = stream_ctx[i];

            // console.log(`Flushing stream ${i} decoder`);

            // Flush decoder
            ret = await stream.dec_ctx!.sendPacket(null);
            if (ret < 0) {
                console.error('Flushing decoding failed');
                return ret;
            }

            while (ret >= 0) {
                ret = await stream.dec_ctx!.receiveFrame(stream.dec_frame!);
                if (ret === AVERROR_EOF) {
                    break;
                } else if (ret < 0) {
                    return ret;
                }

                stream.dec_frame!.pts = stream.dec_frame!.bestEffortTimestamp;
                ret = await filter_encode_write_frame(stream.dec_frame, i, stream_ctx, filter_ctx, ofmt_ctx);
                if (ret < 0) {
                    return ret;
                }
            }

            // Flush filter
            ret = await filter_encode_write_frame(null, i, stream_ctx, filter_ctx, ofmt_ctx);
            if (ret < 0) {
                console.error('Flushing filter failed');
                return ret;
            }

            // Flush encoder
            ret = await flush_encoder(i, stream_ctx, filter_ctx, ofmt_ctx);
            if (ret < 0) {
                console.error('Flushing encoder failed');
                return ret;
            }
        }

        await ofmt_ctx.writeTrailer();

        // Properly end the rotating stream
        rotatingStream.end();

        return 0;
    } finally {
        // Cleanup resources
        if (transcodeCtx) {
            await cleanup(transcodeCtx);
        }
        packet.free();
    }
}

// Update the main function to use the transcode function
async function main(): Promise<void> {
    const args = process.argv.slice(2);

    if (args.length !== 1) {
        console.error(`Usage: ${process.argv[0]} ${process.argv[1]} <input file>`);
        process.exit(1);
    }

    const [input_file] = args;

    const ret = await transcode(input_file);

    if (ret < 0 && ret !== AVERROR_EOF) {
        console.error(`Error occurred: ${ret}`);
        process.exit(1);
    }
}

// Run main
main();