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

export default function MediaServer() {
  const [output, setOutput] = useState<string[]>([]);

  let clients: {
    [key: string]: WsClient;
  } = {};

  const log = logger(setOutput);

  function broadcast(opts: {
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
        log("Error broadcasting to client: " + e);
        clients = Object.fromEntries(
          Object.entries(clients).filter(([, c]) => c.id !== client.id)
        ); // Remove client on error
      }
    });
  }

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
            clients: Object.values(clients),
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
            clients: Object.values(clients),
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



      clients[id] = {
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
        clients: [clients[id]],
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
            clients: [clients[id]],
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
          clients[id].viewing_streams = streams;
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
        clients: Object.values(clients),
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
