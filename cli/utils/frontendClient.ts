
import { createMessage } from "../../message";
import type { WsHeader } from "../../types";
import { WsClient } from "../utils/ws_utils";

export const frontend: {
    clients: {
        [key: string]: WsClient;
    }
} = {
    clients: {}
}

export function broadcast(opts: {
    header: WsHeader;
    buffer?: ArrayBufferLike;
    clients: WsClient[];
}) {
    let finalMessage: Buffer | string = createMessage(opts.header, opts.buffer);
    opts.clients.forEach((client) => {
        try {
            if (opts.header.type === "frame") {
                const subscription = client.viewing_streams[opts.header.stream_id] ?? { priority: 0 };
                if (client.state[opts.header.stream_id] === undefined) {
                    client.state[opts.header.stream_id] = { lastSentTime: -1 };
                }
                const lastSentTime = client.state[opts.header.stream_id].lastSentTime;

                if (subscription.priority == 0) return;

                // Reduced FPS (1 fps)
                if (subscription.priority == 1) {
                    // Limit to 1 fps per stream per client
                    if (Date.now() - lastSentTime < 1000) return;
                    client.state[opts.header.stream_id].lastSentTime = Date.now();
                    client.ws.send(finalMessage);
                }

                if (subscription.priority >= 2) {
                    // 2 is FULL FPS
                    client.ws.send(finalMessage);
                    client.state[opts.header.stream_id].lastSentTime = Date.now();
                }
            } else {
                client.ws.send(finalMessage);
            }
        } catch (e) {
            frontend.clients = Object.fromEntries(
                Object.entries(frontend.clients).filter(([, c]) => c.id !== client.id)
            ); // Remove client on error
        }
    });
}