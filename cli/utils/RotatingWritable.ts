import { createWriteStream } from "fs";
import { Writable } from "stream";

export default class RotatingWritable extends Writable {
    // @ts-ignore
    currentWriteStream: WriteStream;
    lastTimestamp: number;


    constructor(public baseName = 'out', public extension = 'mp4', public rotationIntervalMs = 20000, options = {}) {
        // The Writable stream's constructor is called first
        super(options);
        this.lastTimestamp = -1; // Initialize to -1 to ensure the first write triggers a rotation
    }

    _maybeCloseAndOpenNewStream() {
        if (this.currentWriteStream) this.currentWriteStream.end();
        const newPath = `${this.baseName}_${this.lastTimestamp}.${this.extension}`;
        this.currentWriteStream = createWriteStream(newPath, { flags: 'a' });
    }

    maybeRotate() {
        const now = Date.now();
        const elapsed = now - this.lastTimestamp;
        const needRotate = elapsed > this.rotationIntervalMs;
        if (needRotate) {
            this.lastTimestamp = now;
            this._maybeCloseAndOpenNewStream();
        }

        return needRotate;
    }

    /**
 * The essential method for a Writable stream. It's called for every chunk of data.
 * @param chunk - The data chunk to write.
 * @param encoding - The encoding of the chunk (ignored for buffers).
 * @param callback - Function to call when the write is complete.
     */
    _write(chunk: Buffer, encoding: string, callback: (error?: Error | null) => void) {
        const writeSuccessful = this.currentWriteStream.write(chunk);

        if (writeSuccessful) {
            // If write was successful, call the callback immediately
            setImmediate(() => callback(null));
        } else {
            // Handle backpressure from the underlying file stream
            this.currentWriteStream.once('drain', () => {
                callback(null);
            });
        }
    }

    /**
     * Optional: Method called when .end() is called on the stream.
     * Ensure the final file stream is closed.
     */
    _final(callback: (error?: Error | null) => void) {
        if (this.currentWriteStream) {
            this.currentWriteStream.end(callback);
        } else {
            callback();
        }
    }
}