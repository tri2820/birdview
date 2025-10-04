import { spawn, ChildProcess } from "child_process";
import fs from "fs";
import http from "http";
import httpProxy from "http-proxy";
import mime from "mime-types";
import path from "path";
import { useEffect, useState } from "react";
import { fileURLToPath } from "url";
import { getArgv, mediaConfig } from "../utils/config";
import { logger } from "../utils/logger";
import { handleApiRequest } from "../server/handler";


export default function useAppServer() {
  const argv = getArgv();
  const [status, setStatus] = useState("Initializing...");
  const [output, setOutput] = useState<string[]>([]);
  const log = logger(setOutput);

  useEffect(() => {
    let viteProcess: ChildProcess | null = null;
    let server: http.Server | null = null;
    let apiServer: http.Server | null = null;
    let proxy: httpProxy | null = null;

    const startServer = async () => {
      const __filename = fileURLToPath(import.meta.url);
      const __dirname = path.dirname(__filename);
      const root = path.resolve(__dirname, "..", "..");

      if (argv.dev) {
        // DEVELOPMENT: Spawn Vite as separate process and run a separate API server
        setStatus("Starting Vite Dev Server and API Server...");

        const apiPort = mediaConfig.port + 1;
        const apiServerUrl = `http://localhost:${apiPort}`;

        // Create a simple API server
        apiServer = http.createServer(handleApiRequest);

        apiServer.listen(apiPort, () => {
          log(`✓ API Server listening on ${apiServerUrl}`);
        });


        viteProcess = spawn("npx", ["vite"], {
          stdio: ["inherit", "pipe", "pipe"],
          env: {
            ...process.env,
            BV_CONFIG_PATH: mediaConfig.__path,
            FORCE_COLOR: "1",
            VITE_API_PROXY_TARGET: apiServerUrl,
            VITE_PORT: mediaConfig.port.toString(),
            VITE_MEDIA_SERVER_PORT: mediaConfig.media_server.port.toString(),
          },
          cwd: root,
        });

        viteProcess.stdout?.on("data", (data) => {
          log(data.toString());
        });

        viteProcess.stderr?.on("data", (data) => {
          log(data.toString());
        });

        viteProcess.on("close", (code) => {
          setStatus(`Vite exited with code ${code}`);
        });

        viteProcess.on("spawn", () => {
          setStatus("Development Server Running");
          log(`✓ Vite Dev Server: http://localhost:${mediaConfig.port}`);
          log(`✓ WebSocket: ws://localhost:${mediaConfig.port}/ws (proxied via vite.config.ts)`);
        });

      } else {
        // PRODUCTION: Simple HTTP server with WebSocket proxy and REST endpoints
        setStatus("Starting Production Server...");

        proxy = httpProxy.createProxyServer({
          target: `http://localhost:${mediaConfig.media_server.port}`,
          ws: true,
        });

        proxy.on('error', (err) => {
          log(`[Proxy Error] ${err.message}`);
        });

        server = http.createServer(async (req, res) => {
          // Await the promise to get the actual boolean result
          const isApiRequestHandled = await handleApiRequest(req, res);
          if (isApiRequestHandled) {
            return;
          }


          const distPath = path.join(root, "dist");
          const filePath = path.join(distPath, req.url === "/" ? "index.html" : req.url!);

          fs.readFile(filePath, (err, content) => {
            if (err) {
              if (err.code === "ENOENT") {
                // Fallback to index.html for SPA routing
                fs.readFile(path.join(distPath, "index.html"), (e2, c2) => {
                  if (e2) {
                    res.writeHead(500);
                    res.end("Server Error");
                  } else {
                    res.writeHead(200, { "Content-Type": "text/html" });
                    res.end(c2, "utf-8");
                  }
                });
              } else {
                res.writeHead(500);
                res.end(`Server Error: ${err.code}`);
              }
            } else {
              const contentType = mime.lookup(filePath) || "application/octet-stream";
              res.writeHead(200, { "Content-Type": contentType });
              res.end(content, "utf-8");
            }
          });
        });

        server.on('upgrade', (req, socket, head) => {
          if (req.url?.startsWith('/ws')) {
            log(`[WebSocket] Proxying to media server`);
            proxy!.ws(req, socket, head);
          } else {
            socket.destroy();
          }
        });

        server.listen(mediaConfig.port, () => {
          const url = `http://localhost:${mediaConfig.port}`;
          setStatus("Production Server Running");
          log(`✓ Production Server: ${url}`);
          log(`✓ WebSocket: ${url}/ws -> :${mediaConfig.media_server.port}`);
        });
      }
    };

    startServer().catch((err) => {
      setStatus("Error");
      log(`Failed to start server: ${err.message}`);
      console.error(err);
    });

    return () => {
      log('Cleaning up...');
      if (viteProcess) {
        viteProcess.kill();
      }
      if (server) {
        server.close();
      }
      if (apiServer) {
        apiServer.close();
      }
      if (proxy) {
        proxy.close();
      }
    };
  }, []);

  return { status, output: output.join("\n") };
}