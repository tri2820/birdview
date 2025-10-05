import { createMessage, parseMessage } from "../../message";
import { mediaConfig } from "./config";
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


const connectToBackend = () => {
    console.log("Connecting to backend WebSocket for stream monitoring...");
    const backendWs = new WebSocket("wss://backend.zapdoslabs.com");

    backendWs.onopen = () => {
        console.log("Connected to backend.");
        const header = mediaConfig.auth_token ? {
            type: "i_am_tenant",
            auth_token: mediaConfig.auth_token,
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
        // const data = parseMessage(event.data as any).header as any;
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