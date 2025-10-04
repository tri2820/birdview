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
    constructor(public ws: WebSocket) {
        this.ws.on("open", () => {
            this.flush();
        });
    }

    send(message: Buffer | string) {
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
                this.ws.send(message);
            }
        }
    }
}