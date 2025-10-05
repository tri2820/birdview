import http from "http";
import fs from "fs/promises";
import mime from "mime-types";
import { URL } from "url";
import { searchMediaUnitsByDescription } from "../utils/database";
import { connection } from "../utils/conn";
import { backendClient } from "../utils/backendClient";
import { createMessage } from "../../message";
import { format, set } from "date-fns";

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

            console.log('handling search for query:', query);
            const result = await searchMediaUnitsByDescription(connection, query);
            if (!result) {
                res.writeHead(500, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ error: "Search failed" }));
                return true;
            }
            const items = result.getRowObjectsJson();

            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ items }));
            console.log('wrote search response');
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
            if (!searchResult) {
                res.writeHead(500, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ error: "Search failed" }));
                return true;
            }
            const allItems = searchResult.getRowObjectsJson();

            // 2. Get the top 10 rows
            const top10Items = allItems.slice(0, 10);

            const id = crypto.randomUUID();
            const passages = top10Items
                .toSorted((a, b) => (b.at_time as any) - (a.at_time as any))
                .map((item: any) => {
                    return `${format(item.at_time, "eeee, MMMM do, yyyy 'at' h:mm a")}: ${item.description}`;
                })
            const message = createMessage(
                {
                    type: "summarize",
                    id,
                    query,
                    passages,
                }
            );
            backendClient.conn?.send(message);

            const start = Date.now();
            while (!backendClient.results[id]) {
                if (Date.now() - start > 20000) { // 20 second timeout
                    res.writeHead(500, { "Content-Type": "application/json" });
                    res.end(JSON.stringify({ error: "Summarization timed out" }));
                    return true;
                }
                // Wait for the result to be populated by the WebSocket message handler
                await new Promise(resolve => setTimeout(resolve, 100));
            }

            const result = backendClient.results[id];

            // 3. TODO: Implement actual model summarization logic
            // For now, we'll return a placeholder summary.
            // const summaryText = `Placeholder summary for: "${query}". Based on the top ${top10Items.length} most relevant results.`;

            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(
                JSON.stringify({
                    answer: result.answer,
                    sources: top10Items, // Return the top 10 items as sources
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