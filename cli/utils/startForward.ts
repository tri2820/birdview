import { AV_PIX_FMT_RGB24, Decoder, FFmpegError, Frame, MediaInput, SoftwareScaleContext, SWS_FAST_BILINEAR } from "node-av";
import sharp, { Channels } from "sharp";
import { AsyncQueue } from "./AsyncQueue";



export type ForwardMessage = { type: 'frame'; buffer: ArrayBufferLike } | {
    type: 'codecpar';
    data: { width: number; height: number; }
}
export async function* forwardStream(inputUrl: string) {
    const queue = new AsyncQueue<ForwardMessage>();
    using input = await MediaInput.open(inputUrl);
    const videoStream = input.video();

    if (!videoStream) throw new Error("No video stream found");
    using decoder = await Decoder.create(videoStream);
    const codecpar = videoStream.codecpar.toJSON();

    queue.push({ type: 'codecpar', data: codecpar as any });

    const scaler = new SoftwareScaleContext();
    scaler.getContext(
        codecpar.width, codecpar.height, codecpar.format,
        codecpar.width, codecpar.height,
        AV_PIX_FMT_RGB24,
        SWS_FAST_BILINEAR
    );
    FFmpegError.throwIfError(scaler.initContext(), "initContext");
    const raw = { width: codecpar.width, height: codecpar.height, channels: 3 as Channels };

    (async () => {
        let frameCount = 0;
        for await (using packet of input.packets(videoStream.index)) {
            // console.log(`Decoding frame ${frameCount}`);
            frameCount++;
            using frame = await decoder.decode(packet);
            if (!frame) {
                console.warn("Warning: No frame decoded");
                continue;
            }

            const dstFrame = new Frame();
            dstFrame.alloc();
            dstFrame.width = raw.width;
            dstFrame.height = raw.height;
            dstFrame.format = AV_PIX_FMT_RGB24;
            let ret = dstFrame.allocBuffer();
            if (FFmpegError.isFFmpegError(ret)) {
                console.warn("Warning: allocBuffer failed", ret);
                continue;
            }

            ret = await scaler.scaleFrame(dstFrame, frame)
            if (FFmpegError.isFFmpegError(ret)) {
                console.warn("Warning: scaleFrame failed", ret);
                continue;
            }

            if (!dstFrame.data?.[0]) {
                console.warn('Warning: No RGB24 data available after conversion');
                dstFrame.free();
                continue;
            }

            const sourceBuffer = dstFrame.data[0];
            const linesize = dstFrame.linesize[0]; // The actual number of bytes per row in the source buffer
            const width = dstFrame.width;
            const height = dstFrame.height;
            const channels = 3; // For RGB24

            const rowWidthInBytes = width * channels; // The number of bytes of actual pixel data per row

            // Create a new, tightly-packed buffer with no padding
            const packedBuffer: Uint8Array<ArrayBufferLike> = new Uint8Array(rowWidthInBytes * height);

            // Copy each row from the source buffer to the new buffer, skipping the padding
            for (let y = 0; y < height; y++) {
                const sourceOffset = y * linesize;
                const destOffset = y * rowWidthInBytes;
                sourceBuffer.copy(packedBuffer, destOffset, sourceOffset, sourceOffset + rowWidthInBytes);
            }

            dstFrame.free(); // Free the original frame as soon as we're done with it

            // Async write the JPEG file
            (async () => {
                const buffer = await sharp(packedBuffer, { raw: { width, height, channels } })
                    .jpeg({ quality: 75 })
                    .toBuffer();
                queue.push({ type: 'frame', buffer: buffer.buffer });
            })();
        }

        queue.end()
    })();

    for await (const item of queue) {
        yield item;
    }




}