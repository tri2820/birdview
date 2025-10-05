import { WebSocket } from "ws";
export type WsClient = {
    id: string;
    ip: string | undefined;
    ws: WebSocket;
    viewing_streams: {
        [stream_id: string]: {
            priority: number;
        }
    }
    state: {
        [stream_id: string]: {
            lastSentTime: number;
        }
    }
};
// So that we can queue messages if the client is not ready
export class WsClientWrapper {
    queue: (Buffer | string)[] = [];
    private bytesSent = 0;
    private lastMeasurementTime = Date.now();
    private measurementInterval: NodeJS.Timeout;

    // The measured send speed in KB/s
    public sendSpeed = 0;

    constructor(public ws: WebSocket) {
        this.ws.on("open", () => {
            this.flush();
        });

        // Start measuring send speed every second
        this.measurementInterval = setInterval(() => {
            this.measureSendSpeed();
        }, 1000);

        this.ws.on("close", () => {
            clearInterval(this.measurementInterval);
        });
    }

    send(message: Buffer | string) {
        const messageSize = typeof message === 'string' ? new TextEncoder().encode(message).length : message.length;
        this.bytesSent += messageSize;

        if (this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(message);
        } else {
            this.queue.push(message);
        }
    }

    flush() {
        while (this.queue.length > 0) {
            const message = this.queue.shift();
            if (message) {
                const messageSize = typeof message === 'string' ? new TextEncoder().encode(message).length : message.length;
                this.bytesSent += messageSize;
                this.ws.send(message);
            }
        }
    }

    private measureSendSpeed() {
        const currentTime = Date.now();
        const elapsedTime = (currentTime - this.lastMeasurementTime) / 1000; // in seconds

        if (elapsedTime > 0) {
            this.sendSpeed = (this.bytesSent / 1024) / elapsedTime; // KB/s
        }

        // Reset for the next interval
        this.bytesSent = 0;
        this.lastMeasurementTime = currentTime;
    }
}