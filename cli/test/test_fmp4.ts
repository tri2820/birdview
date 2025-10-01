import { MediaInput, MediaOutput, Packet } from 'node-av';
import fs from 'fs/promises';

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
export async function remuxRtspToFmp4(inputUrl: string, outputUrl:string) {
    const inputOptions = {
        options: {
            fflags: '+genpts+nobuffer'
        }
    };

    console.log(`Connecting to ${inputUrl}...`);
    await using input = await MediaInput.open(inputUrl, inputOptions);

    const videoStream = input.video();
    const audioStream = input.audio();

    if (!videoStream) throw new Error("No video stream found in the input");

    // --- OUTPUT SETUP ---
    const fd = await fs.open(outputUrl, 'w');
    await using output = await MediaOutput.open({
        write(buffer){
            console.log(`Writing ${buffer.byteLength} bytes to ${outputUrl}`);
            fd.write(buffer);
            return buffer.byteLength;
        }
    }, {
        format: 'mp4',
    });
    output.getFormatContext().setOption('movflags', 'frag_keyframe+empty_moov+default_base_moof+faststart+dash');

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
                console.log(`Writing video packet PTS:${packet.pts} DTS:${packet.dts}`);
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
                console.log(`Writing audio packet PTS:${packet.pts} DTS:${packet.dts}`);
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
    // 'rtsp://rtspstream:UIw_5_upePzZtQxZayncA@zephyr.rtsp.stream/movie',
    'http://200.46.196.243/axis-cgi/media.cgi?camera=1&videoframeskipmode=empty&videozprofile=classic&resolution=1280x720&audiodeviceid=0&audioinputid=0&audiocodec=aac&audiosamplerate=16000&audiobitrate=32000&timestamp=0&videocodec=h264&container=mp4',
    'output.mp4'
);