import { Box, Text } from "ink";
import { AV_LOG_WARNING, Log } from "node-av";
import { useEffect, useState } from "react";
import { WebSocketServer } from "ws";

import { createMessage, parseMessage } from "../../message";
import type { WsHeader } from "../../types";
import { backendClient } from "../utils/backendClient";
import { appConfig, maskedConfig } from "../utils/config";
import { logger } from "../utils/logger";
import { ForwardMessage, forwardStream } from "../utils/startForward";
import { WsClient } from "../utils/ws_utils";
import React from "react";
import { broadcast, frontend } from "../utils/frontendClient";

export default function MediaServer() {
  const [output, setOutput] = useState<string[]>([]);

  const log = logger(setOutput);
  const streams: {
    [key: string]: {
      codecpar?: { width: number; height: number };
    };
  } = {};

  let clientStates: {
    [stream_id: string]: {
      lastSentTime: number;
    };
  } = {};

  async function forwardToBackend(
    stream_id: string,
    id: string,
    msg: ForwardMessage
  ) {
    if (msg.type !== "frame") return;


    if (!clientStates[stream_id]) {
      clientStates[stream_id] = {
        lastSentTime: -1,
      };
    }

    // TODO: Use C-BOR and allow sending multiple frames in one message
    // Relevant for indexing multiple frames at once (clip)
    // TODO: Selectively send messages based on some criteria
    // e.g. motion, object detected, scene change, etc.
    // Here, send every X seconds as a placeholder
    if (Date.now() - clientStates[stream_id].lastSentTime > 5000) {
      clientStates[stream_id].lastSentTime = Date.now();
      const message = createMessage(
        {
          type: "index",
          id,
          row: {
            at_time: new Date().toISOString(),
            media_id: stream_id,
          }
        },
        msg.buffer
      );


      backendClient.conn?.send(message);
    }
  }

  async function loopStream(stream_id: string, url: string) {
    const messages = forwardStream(url);

    try {
      for await (const msg of messages) {
        // Forward all messages to backend for indexing
        // This id is used to identify frames
        const id = crypto.randomUUID();
        forwardToBackend(stream_id, id, msg);

        if (msg.type === "frame") {
          broadcast({
            header: { type: "frame", stream_id, id },
            buffer: msg.buffer,
            clients: Object.values(frontend.clients),
          });
        }

        // Forward codecpar messages to clients
        if (msg.type === "codecpar") {
          if (!streams[stream_id]) streams[stream_id] = {};
          streams[stream_id].codecpar = msg.data;

          broadcast({
            header: {
              type: "codecpar",
              stream_id,
              data: msg.data,
            },
            clients: Object.values(frontend.clients),
          });
        }
      }
    } catch (e) {
      log("Error in stream loop: " + e);
    }
  }

  async function startMediaServer() {
    const wss = new WebSocketServer({ port: appConfig.get('media_server.port') });

    // This event listener is fired when a new client connects to the server
    wss.on("connection", (ws, req) => {
      const id = crypto.randomUUID();
      log("New client connected.", id);

      // You can get the client's IP address from the request object
      const ip = req.socket.remoteAddress;
      log(`Client IP: ${ip}`);



      frontend.clients[id] = {
        id,
        ip,
        ws,
        viewing_streams: {},
        state: {},
      };

      // Send config to the new client
      broadcast({
        header: {
          type: "config",
          data: maskedConfig(),
        },
        clients: [frontend.clients[id]],
      });

      // Send codecpar of all streams to the new client
      Object.entries(streams).forEach(([stream_id, state]) => {
        if (!state.codecpar) return;
        try {
          broadcast({
            header: {
              type: "codecpar",
              stream_id,
              data: state.codecpar,
            },
            clients: [frontend.clients[id]],
          });
        } catch (e) {
          log("Error sending codecpar to new client: " + e);
        }
      });

      // This event listener is fired when the server receives a message from a client
      ws.on("message", async (message) => {
        const msg = parseMessage(message as any);
        if (msg.header.type === "viewing") {
          const streams = msg.header.streams;
          frontend.clients[id].viewing_streams = streams;
        }
      });

      // This event listener is fired when a client disconnects
      ws.on("close", () => {
        log("Client has disconnected.");
      });

      // Handle potential errors
      ws.on("error", (error) => {
        log(`WebSocket error: ${error}`);
      });
    });

    log(
      "WebSocket server is running on ws://localhost:" +
      appConfig.get('media_server.port')
    );
  }

  useEffect(() => {
    Object.entries(appConfig.get('streams')).forEach(([id, stream]) => {
      loopStream(id, stream.uri);
    });
    startMediaServer()
  }, []);

  useEffect(() => {
    const unsubscribe = appConfig.onDidAnyChange(() => {
      log("Config changed, broadcasting to clients...");
      broadcast({
        header: {
          type: "config",
          data: maskedConfig(),
        },
        clients: Object.values(frontend.clients),
      });
    });

    return () => {
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    Log.setCallback((level, message) => {
      if (level <= AV_LOG_WARNING) log("NODE-AV", message);
    });

    return () => {
      Log.setCallback(null);
    };
  }, []);


  return (
    <Box
      borderStyle="single"
      borderColor="gray"
      flexDirection="column"
      paddingX={1}
    >
      <Text color="green">
        <Text bold>Media Server:</Text> {appConfig.get('media_server.port')}
      </Text>
      <Text color="gray">{output.join("\n")}</Text>
    </Box>
  );
}
