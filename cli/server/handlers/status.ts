import http from "http";

export const handleStatusRequest = (
    req: http.IncomingMessage,
    res: http.ServerResponse
): boolean => {
    if (req.method !== "GET") {
        return false;
    }

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ status: "running" }));
    return true;
};