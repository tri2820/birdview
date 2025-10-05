import http from "http";
import { URL } from "url";
import { connection } from "../../utils/conn";
import { searchMediaUnitsByEmbedding } from "../../utils/database";

export const handleSearchRequest = async (
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
    const query = requestUrl.searchParams.get("q");
    if (!query) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Missing search query 'q'" }));
        return true;
    }

    console.log('handling search for query:', query);

    const embedding = [1, 2, 3];
    const result = await searchMediaUnitsByEmbedding(connection, embedding);
    if (!result) {
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Search failed" }));
        return true;
    }
    const items = result;

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ items }));
    console.log('wrote search response');
    return true;
};