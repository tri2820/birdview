import { MediaInput, MediaOutput, Packet } from 'node-av';
import fs from 'fs/promises';
import RotatingWritable from '../utils/RotatingWritable';

// Here, we just skip negative or non-monotonic timestamps
// TODO: provide a fallback re-timestamping mechanism (assume 25fps for example) if needed, after waiting for a long time and still does not receive a valid packet 
function shouldSkipPacket(packet: Packet, prev?: Packet) {
    if (packet.pts < 0 || packet.dts < 0) return true
    if (prev && (packet.dts <= prev.dts || packet.pts <= prev.pts)) return true
    return false
}

/**
 * Remuxes a highly problematic RTSP stream to a fragmented MP4 file.
 * This version forces a complete re-timestamping of the video stream
 * to fix non-monotonic timestamp errors from an unreliable source.
 * @param {string} inputUrl The URL of the input RTSP stream.
 * @param {string} outputUrl The path where the fMP4 file will be saved.
 */
export async function remuxRtspToFmp4(inputUrl: string, outputUrl: string) {
    const inputOptions = {
        options: {
            fflags: '+genpts'
        }
    };

    console.log(`Connecting to ${inputUrl}...`);
    await using input = await MediaInput.open(inputUrl, inputOptions);

    const videoStream = input.video();
    const audioStream = input.audio();

    if (!videoStream) throw new Error("No video stream found in the input");

    // --- OUTPUT SETUP ---
    const rotatingStream = new RotatingWritable('output', 'mp4');
    let receivedBigChunk = false;
    let header: Buffer[] = []
    await using output = await MediaOutput.open({
        write(buffer) {
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
        }
    }, {
        format: 'mp4',
    });

    console.log('video codec:', videoStream.codecpar.codecId);

    output.getFormatContext().setOption('movflags', 'frag_keyframe+empty_moov+default_base_moof+frag_every_frame+omit_tfhd_offset');

    console.log("Setting up streams for copying (remuxing)...");
    const videoIdx = output.addStream(videoStream);
    const audioIdx = audioStream ? output.addStream(audioStream) : -1;

    let prevVideoPacket: Packet | undefined = undefined;
    let prevAudioPacket: Packet | undefined = undefined;

    for await (const packet of input.packets()) {
        if (packet.streamIndex === videoStream.index) {
            const shouldSkip = shouldSkipPacket(packet, prevVideoPacket);

            if (shouldSkip) {
                console.warn(`Skipping video packet with invalid timestamps PTS:${packet.pts} DTS:${packet.dts}`);
                continue;
            }

            prevVideoPacket?.free();
            prevVideoPacket = packet;

            try {
                await output.writePacket(packet, videoIdx);
            } catch (err) {
                console.error("Error writing video packet:", err);
            }
        } else if (audioStream && packet.streamIndex === audioStream.index) {
            const shouldSkip = shouldSkipPacket(packet, prevAudioPacket);

            if (shouldSkip) {
                console.warn(`Skipping audio packet with invalid timestamps PTS:${packet.pts} DTS:${packet.dts}`);
                continue;
            }
            prevAudioPacket?.free();
            prevAudioPacket = packet;

            try {
                await output.writePacket(packet, audioIdx);
            } catch (err) {
                console.error("Error writing audio packet:", err);
            }
        }
    }

    console.log(`Finished writing to ${outputUrl}`);
}

// Run the remuxing function
await remuxRtspToFmp4(
    'rtsp://www.cactus.tv:1554/cam58',
    // 'http://200.46.196.243/axis-cgi/media.cgi?camera=1&videoframeskipmode=empty&videozprofile=classic&resolution=1280x720&audiodeviceid=0&audioinputid=0&audiocodec=aac&audiosamplerate=16000&audiobitrate=32000&timestamp=0&videocodec=h264&container=mp4',
    'output.mp4'
);