import http from "http";
import fs from "fs/promises";
import mime from "mime-types";
import { URL } from "url";

export const handleImageRequest = async (
    req: http.IncomingMessage,
    res: http.ServerResponse
): Promise<boolean> => {
    if (req.method !== "GET") {
        return false;
    }

    if (!req.url) {
        return false;
    }

    // Use URL constructor for robust parsing of path and query params
    const requestUrl = new URL(req.url, `http://${req.headers.host}`);
    const imagePath = requestUrl.searchParams.get("path");
    if (!imagePath) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Missing image path 'path'" }));
        return true;
    }

    // SECURITY WARNING: In production, you must validate this path
    // to prevent directory traversal attacks.
    try {
        const buffer = await fs.readFile(imagePath);
        const contentType = mime.lookup(imagePath) || "application/octet-stream";
        res.writeHead(200, { "Content-Type": contentType });
        res.end(buffer);
    } catch (e) {
        res.writeHead(404, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Image not found" }));
    }
    return true;
};