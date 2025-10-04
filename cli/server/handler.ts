import http from "http";
import fs from "fs/promises";
import mime from "mime-types";
import { URL } from "url";
import { searchMediaUnitsByDescription } from "../utils/database";
import { connection } from "../utils/conn";

export const handleApiRequest = async (
    req: http.IncomingMessage,
    res: http.ServerResponse
): Promise<boolean> => {
    if (!req.url) {
        return false;
    }

    // Use URL constructor for robust parsing of path and query params
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
        }

        // --- NEW: Summarize Endpoint Implementation ---
        if (pathname === "/api/v1/summarize" && req.method === "GET") {
            const query = requestUrl.searchParams.get("q");
            if (!query) {
                res.writeHead(400, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ error: "Missing search query 'q'" }));
                return true;
            }

            // 1. Get search results
            const searchResult = await searchMediaUnitsByDescription(connection, query);
            const allItems = searchResult.getRowObjectsJson();

            // 2. Get the top 10 rows
            const top10Items = allItems.slice(0, 10);

            // 3. TODO: Implement actual model summarization logic
            // For now, we'll return a placeholder summary.
            const summaryText = `Placeholder summary for: "${query}". Based on the top ${top10Items.length} most relevant results.`;

            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(
                JSON.stringify({
                    summary: summaryText,
                    source_items: top10Items, // Return the top 10 items as sources
                })
            );
            return true;
        }
        // --- End of New Endpoint ---

        // If no API route matches, return 404
        res.writeHead(404, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "API Endpoint Not Found" }));
        return true;
    }

    // If not an API request, indicate it was not handled
    return false;
};