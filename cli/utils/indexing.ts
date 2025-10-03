import fs from "fs/promises";
import { jsonBigIntReplacer } from "../utils/json";
const tempdir = "/tmp/birdview_frames/";
export async function saveFrame(id: string, buffer: ArrayBufferLike) {
    // Make sure the directory exists
    await fs.mkdir(tempdir, { recursive: true });
    const filepath = `${tempdir}${id}.jpg`;
    await fs.writeFile(filepath, Buffer.from(buffer));
    return {
        filepath,
        id,
    };
}

export function createMessage(header: Record<string, any>, buffer?: ArrayBufferLike) {
    if (buffer) {
        const headerString = JSON.stringify(header, jsonBigIntReplacer);
        const headerBuffer = Buffer.from(headerString, "utf-8");
        const headerLength = headerBuffer.length;
        const lengthBuffer = Buffer.alloc(4);
        lengthBuffer.writeUInt32BE(headerLength, 0);
        const imageBuffer = Buffer.from(buffer as ArrayBuffer);
        return Buffer.concat([lengthBuffer, headerBuffer, imageBuffer]);
    }

    return JSON.stringify(header, jsonBigIntReplacer);
}
