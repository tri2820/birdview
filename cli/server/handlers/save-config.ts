import http from "http";
import { saveConfig } from "../../utils/config";

export const handleSaveConfigRequest = (
  req: http.IncomingMessage,
  res: http.ServerResponse
): Promise<boolean> => {
  return new Promise((resolve) => {
    if (req.method !== "POST") {
      res.writeHead(405, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Method Not Allowed" }));
      return resolve(true);
    }

    let body = "";
    req.on("data", (chunk) => {
      body += chunk.toString();
    });

    req.on("end", () => {
      try {
        const bodyObject = JSON.parse(body);
        if (!bodyObject.config) {
            res.writeHead(400, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: "Invalid request format: 'config' key missing" }));
            return;
        }
        const newConfig = bodyObject.config;
        const result = saveConfig(newConfig);

        if (result.success) {
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ message: "Configuration saved successfully" }));
        } else {
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "Invalid configuration", details: result.error }));
        }
      } catch (error) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Invalid JSON" }));
      }
      resolve(true);
    });
  });
};
