import { Box, Text } from "ink";
import React, { useEffect, useState } from "react";
import { AV_LOG_WARNING, Log } from "node-av";
import { WebSocketServer } from "ws";

import { WsHeader } from "../../definitions";
import { createMessage, parseMessage } from "../../message";
import { backendClient } from "../utils/backendClient";
import { mediaConfig } from "../utils/config";
import { connection } from "../utils/conn";
import {
  addMediaUnit
} from "../utils/database";
import { saveFrame } from "../utils/indexing";
import { logger } from "../utils/logger";
import { ForwardMessage, forwardStream } from "../utils/startForward";
import { WsClient } from "../utils/ws_utils";

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
    const message = createMessage(
      {
        type: "index",
        stream_id,
        id,
      },
      msg.buffer
    );

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
      backendClient.conn?.send(message);
      const result = await saveFrame(id, msg.buffer);

      // Add to database
      await addMediaUnit(connection, {
        id,
        at_time: new Date().toISOString(),
        path: result.filepath,
        media_id: stream_id,
      });
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
    // Placeholder for WebSocket server logic
    // This function would set up a WebSocket server to stream media frames to connected clients
    log("Starting Media WebSocket Server...");

    // Create a new WebSocket server on configurable port
    const wss = new WebSocketServer({ port: mediaConfig.media_server.port });

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
          data: mediaConfig,
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
      mediaConfig.media_server.port
    );
  }

  useEffect(() => {
    Object.entries(mediaConfig.streams).forEach(([id, stream]) => {
      loopStream(id, stream.uri);
    });
    startMediaServer();
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
        <Text bold>Media Source:</Text> Streaming at :
        {mediaConfig.media_server.port}
      </Text>
      <Text color="gray">{output.join("\n")}</Text>
    </Box>
  );
}
