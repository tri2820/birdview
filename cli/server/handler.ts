// src/server/utils/apiHandler.ts (or wherever you placed it)
import http from "http";
import { URL } from "url";

import fs from "fs/promises";
import path from "path";
import mime from "mime-types";
import { searchMediaUnitsByDescription } from "../utils/database";
import { connection } from "../utils/conn";

export const handleApiRequest = async (
    req: http.IncomingMessage,
    res: http.ServerResponse
) => {
    if (!req.url) {
        return false;
    }

    const requestUrl = new URL(req.url, `http://${req.headers.host}`);
    const pathname = requestUrl.pathname;

    if (pathname.startsWith("/api/")) {
        if (pathname === "/api/v1/status" && req.method === "GET") {
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ status: "running" }));
            return true;
        }

        if (pathname === "/api/v1/search" && req.method === "GET") {
            const query = requestUrl.searchParams.get("q");
            if (!query) {
                res.writeHead(400, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ error: "Missing search query 'q'" }));
                return true;
            }

            console.log(`Received search query: ${query}`);
            const result = await searchMediaUnitsByDescription(connection, query);
            const items = result.getRowObjectsJson();

            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ items }));
            return true;
        }

        if (pathname === "/api/v1/image" && req.method === "GET") {
            const imagePath = requestUrl.searchParams.get("path");
            if (!imagePath) {
                res.writeHead(400, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ error: "Missing image path 'path'" }));
                return true;
            }

            // WARNING: In a production environment, you MUST validate and sanitize this path
            // to prevent directory traversal attacks.
            // e.g., ensure it's within a specific allowed media directory.

            try {
                const buffer = await fs.readFile(imagePath);
                const contentType = mime.lookup(imagePath) || "application/octet-stream";
                res.writeHead(200, { "Content-Type": contentType });
                res.end(buffer);
            } catch (e) {
                console.error("Error reading image file:", e);
                res.writeHead(404, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ error: "Image not found" }));
            }
            return true;
        }

        res.writeHead(404, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Not Found" }));
        return true;
    }

    return false;
};