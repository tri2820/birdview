import { createMessage, parseMessage } from "../../message";
import { appConfig } from "./config";
import { WsClientWrapper } from "./ws_utils";

import { WebSocket } from "ws";

export const backendClient: {
    conn?: WsClientWrapper,
    results: {
        [id: string]: any
    }
} = {
    results: {}
}


export const connectToBackend = () => {
    console.log("Connecting to backend WebSocket for stream monitoring...");
    const backendWs = new WebSocket("wss://backend.zapdoslabs.com");

    backendWs.onopen = () => {
        console.log("Connected to backend.");
        const header = appConfig.get('auth_token') ? {
            type: "i_am_tenant",
            auth_token: appConfig.get('auth_token'),
        } : {
            type: "i_am_tenant",
            create_new: true,
        }

        const msg = createMessage(header);
        backendWs.send(msg);
        backendClient.conn = new WsClientWrapper(backendWs);
    };

    backendWs.onclose = () => {
        console.log("Backend WebSocket closed. Retrying in 5 seconds...");
        setTimeout(connectToBackend, 5000);
    };


    backendWs.onmessage = async (event) => {
        const parsed = parseMessage(event.data as any)
        console.log("Received message from backend:", parsed);
        if (parsed.header.type === 'authenticated') {
            if (parsed.header.auth_token) {
                console.log("Received auth token from backend:", parsed.header.auth_token);
                appConfig.set('auth_token', parsed.header.auth_token);
            }
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

