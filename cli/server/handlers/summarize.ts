import http from "http";
import { URL } from "url";
import { backendClient } from "../../utils/backendClient";
import { createMessage } from "../../../message";
import { format } from "date-fns";
import { randomUUID } from "crypto";


export const handleSummarizeRequest = async (
    req: http.IncomingMessage,
    res: http.ServerResponse
): Promise<boolean> => {
    throw new Error('Summarization not implemented yet');
    // if (req.method !== "GET") {
    //     return false;
    // }

    // if (!req.url) {
    //     return false;
    // }

    // // Use URL constructor for robust parsing of path and query params
    // const requestUrl = new URL(req.url, `http://${req.headers.host}`);
    // const query = requestUrl.searchParams.get("q");
    // if (!query) {
    //     res.writeHead(400, { "Content-Type": "application/json" });
    //     res.end(JSON.stringify({ error: "Missing search query 'q'" }));
    //     return true;
    // }

    // // 1. Get search results
    // const embedding = [1, 2, 3];
    // const searchResult = await searchMediaUnitsByEmbedding(embedding);
    // if (!searchResult) {
    //     res.writeHead(500, { "Content-Type": "application/json" });
    //     res.end(JSON.stringify({ error: "Search failed" }));
    //     return true;
    // }
    // const allItems = searchResult;

    // // 2. Get the top 10 rows
    // const top10Items = allItems.slice(0, 10);

    // const id = randomUUID();
    // const passages = top10Items
    //     .toSorted((a, b) => (b.at_time as any) - (a.at_time as any))
    //     .map((item: any) => {
    //         return `${format(item.at_time, "eeee, MMMM do, yyyy 'at' h:mm a")}: ${item.description}`;
    //     });
    // const message = createMessage(
    //     {
    //         type: "summarize",
    //         id,
    //         query,
    //         passages,
    //     }
    // );
    // backendClient.conn?.send(message);

    // const start = Date.now();
    // while (!backendClient.results[id]) {
    //     if (Date.now() - start > 20000) { // 20 second timeout
    //         res.writeHead(500, { "Content-Type": "application/json" });
    //         res.end(JSON.stringify({ error: "Summarization timed out" }));
    //         return true;
    //     }
    //     // Wait for the result to be populated by the WebSocket message handler
    //     await new Promise(resolve => setTimeout(resolve, 100));
    // }

    // const result = backendClient.results[id];

    // res.writeHead(200, { "Content-Type": "application/json" });
    // res.end(
    //     JSON.stringify({
    //         answer: result.answer,
    //         sources: top10Items, // Return the top 10 items as sources
    //     })
    // );
    // return true;
};