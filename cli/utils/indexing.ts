import fs from "fs/promises";
import { jsonBigIntReplacer } from "../utils/json";
const tempdir = "/home/tri/birdview_frames/";
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
