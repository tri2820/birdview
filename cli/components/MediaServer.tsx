import { Box, Newline, render, Text } from "ink";
import React, { useEffect, useState } from "react";
import { ForwardMessage, forwardStream } from "../utils/startForward";
import { WebSocketServer, WebSocket } from "ws";
import { WsHeader } from "../../definitions";
import { logger } from "../utils/logger";
import { jsonBigIntReplacer } from "../utils/json";
import { mediaConfig } from "../../config";
import { AV_LOG_WARNING, Log } from "node-av";
import fs from "fs/promises";

type WsClient = {
  id: string;
  ip: string | undefined;
  ws: WebSocket;
};

// So that we can queue messages if the client is not ready
class WsClientWrapper {
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

const tempdir = "/tmp/birdview_frames/";
async function saveFrame(id: string, buffer: ArrayBufferLike) {
  // Make sure the directory exists
  await fs.mkdir(tempdir, { recursive: true });
  const filepath = `${tempdir}${id}.jpg`;
  await fs.writeFile(filepath, Buffer.from(buffer));
  return {
    filepath,
    id,
  };
}

function createMessage(header: Record<string, any>, buffer?: ArrayBufferLike) {
  if (buffer) {
    const headerString = JSON.stringify(header, jsonBigIntReplacer);
    const headerBuffer = Buffer.from(headerString, "utf-8");
    const headerLength = headerBuffer.length;
    const lengthBuffer = Buffer.alloc(4);
    lengthBuffer.writeUInt32BE(headerLength, 0);
    const imageBuffer = Buffer.from(buffer as ArrayBuffer);
    return Buffer.concat([lengthBuffer, headerBuffer, imageBuffer]);
  }

  return JSON.stringify(header, jsonBigIntReplacer);
}

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
        client.ws.send(finalMessage);
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
      log("Sending frame to backend for indexing");
      backendState[stream_id].lastSentTime = Date.now();

      backendClient?.send(message);

      // Also save the frame to disk
      log("Saving frame to disk");
      await saveFrame(id, msg.buffer);
    }
  }

  async function loopStream(stream_id: string, url: string) {
    const messages = forwardStream(url);

    try {
      for await (const msg of messages) {
        // Forward all messages to backend for indexing
        // This id is used to identify frames
        const id = crypto.randomUUID();

        console.log(`Forwarding frame from stream ${stream_id}`);
        forwardToBackend(stream_id, id, msg);

        if (msg.type === "frame") {
          // Forward frame messages to clients
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
      ws.on("message", (message) => {
        log(`Received message => ${message}`);

        // Echo the received message back to the client
        ws.send(`Server received: ${message}`);
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
    console.log("Connecting to backend WebSocket for stream monitoring...");
    const backendWs = new WebSocket("wss://stagingbackend.zapdoslabs.com");
    backendWs.onopen = () => {
      backendWs.send(
        JSON.stringify({
          type: "I_am_a_media_server",
        })
      );
    };

    backendClient = new WsClientWrapper(backendWs);
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
