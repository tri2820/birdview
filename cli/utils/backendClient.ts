import { parseMessage } from "../../message";
import { connection } from "./conn";
import { updateMediaUnit } from "./database";
import { WsClientWrapper } from "./ws_utils";

import { WebSocket, WebSocketServer } from "ws";

export const backendClient: {
    conn?: WsClientWrapper,
    results: {
        [id: string]: any
    }
} = {
    results: {}
}


const connectToBackend = () => {
    console.log("Connecting to backend WebSocket for stream monitoring...");
    const backendWs = new WebSocket("wss://stagingbackend.zapdoslabs.com");

    backendWs.onopen = () => {
        console.log("Connected to backend.");
        backendWs.send(
            JSON.stringify({
                type: "I_am_a_media_server",
            })
        );
        backendClient.conn = new WsClientWrapper(backendWs);
    };

    backendWs.onclose = () => {
        console.log("Backend WebSocket closed. Retrying in 5 seconds...");
        setTimeout(connectToBackend, 5000);
    };

    backendWs.onmessage = async (event) => {
        const data = parseMessage(event.data as any).header as any;

        if (data.type === 'image_description_result') {
            try {
                await updateMediaUnit(connection, {
                    id: data.id,
                    description: data.description,
                });
            } catch (e) {
                console.error(
                    "Failed to update frame with backend result:",
                    e,
                    event,
                    event.data
                );
                console.error('Retrying once...');
                await new Promise(resolve => setTimeout(resolve, 1000));
                try {
                    await updateMediaUnit(connection, {
                        id: data.id,
                        description: data.description,
                    });
                    console.log("Retry succeeded.");
                } catch (e) {
                    console.error("Retry failed:", e);
                }
            }
        }

        if (data.type === 'summarize_result') {
            // Handle the summarize result
            console.log("Received summarize result:", data);
            const id = data.id;
            backendClient.results[id] = data;
        }
    };

    backendWs.onerror = (err) => {
        console.error(
            "Backend WebSocket error:",
            err.message,
            "Retrying in 5 seconds..."
        );
        // The 'onclose' event will usually fire after an 'onerror',
        // so we don't strictly need to retry here as well to avoid double retries.
    };
};

connectToBackend();