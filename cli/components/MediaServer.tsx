import { Box, Text } from "ink";
import React, { useEffect, useState } from "react";
import { AV_LOG_WARNING, Log } from "node-av";
import { WebSocket, WebSocketServer } from "ws";
import { mediaConfig } from "../../config";
import { WsHeader } from "../../definitions";
import { saveFrame } from "../utils/indexing";
import { logger } from "../utils/logger";
import { ForwardMessage, forwardStream } from "../utils/startForward";
import { WsClient, WsClientWrapper } from "../../ws_utils";
import { createMessage, parseMessage } from "../../message";
import {
  addFrame,
  connection,
  searchFramesByDescription,
  updateFrame,
} from "../utils/database";
import fs from "fs/promises";

export default function MediaServer() {
  const [output, setOutput] = useState<string[]>([]);
  let backendClient: WsClientWrapper | null = null;
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
          // Reduce frequency to 10% for clients viewing home
          const subscription = client.viewing_streams[opts.header.stream_id] ?? { priority: 0 };
          if (Math.random() < subscription.priority) {
            client.ws.send(finalMessage);
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

  let backendState: {
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

    if (!backendState[stream_id]) {
      backendState[stream_id] = {
        lastSentTime: -1,
      };
    }

    // TODO: Selectively send messages based on some criteria
    // e.g. motion, object detected, scene change, etc.
    // Here, send every X seconds as a placeholder
    if (Date.now() - backendState[stream_id].lastSentTime > 5000) {
      backendState[stream_id].lastSentTime = Date.now();
      backendClient?.send(message);
      const result = await saveFrame(id, msg.buffer);

      // Add to database
      await addFrame(connection, {
        id,
        at_time: new Date().toISOString(),
        // Empty description for now, will be updated by backend result
        description: "",
        path: result.filepath,
        stream_id,
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
      log("New client connected.");

      // You can get the client's IP address from the request object
      const ip = req.socket.remoteAddress;
      log(`Client IP: ${ip}`);

      const id = crypto.randomUUID();

      clients[id] = {
        id,
        ip,
        ws,
        viewing_streams: {},
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

        if (msg.header.type === "search") {
          const query = msg.header.query;
          console.log(`Received search query from client: ${query}`);
          const result = await searchFramesByDescription(connection, query);
          console.log(`Search returned ${result.getRowObjectsJson().length} results`);
          const items = result.getRowObjectsJson();
          broadcast({
            header: {
              type: "search_result",
              query,
              result: {
                items,
              },
            },
            clients: [clients[id]],
          });
        }

        if (msg.header.type === "viewing") {
          const streams = msg.header.streams;
          console.log("Client is viewing home", id);
          clients[id].viewing_streams = streams;
        }


        if (msg.header.type === "get_image") {
          const path = msg.header.path;
          log(`Client requested image: ${path}`);
          try {
            const buffer = await fs.readFile(path);
            const arrayBuffer: ArrayBufferLike = buffer.slice().buffer;

            broadcast({
              header: {
                type: "get_image_result",
                path,
              },
              buffer: arrayBuffer,
              clients: [clients[id]],
            });
          } catch (e) {
            log("Error reading image file: " + e);
          }
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

  useEffect(() => {
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
        backendClient = new WsClientWrapper(backendWs);
      };

      backendWs.onclose = () => {
        console.log("Backend WebSocket closed. Retrying in 5 seconds...");
        setTimeout(connectToBackend, 5000);
      };

      backendWs.onmessage = async (event) => {
        const data: {
          type: "index_result";
          id: string;
          description: string;
        } = parseMessage(event.data as any).header as any;

        // TODO: update database
        try {
          await updateFrame(connection, {
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
        }
      };

      backendWs.onerror = (err) => {
        log(
          "Backend WebSocket error:",
          err.message,
          "Retrying in 5 seconds..."
        );
        // The 'onclose' event will usually fire after an 'onerror',
        // so we don't strictly need to retry here as well to avoid double retries.
      };
    };

    connectToBackend();
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
