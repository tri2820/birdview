import http from "http";
import { URL } from "url";
import { handleStatusRequest } from "./handlers/status";
import { handleSaveConfigRequest } from "./handlers/save-config";
import { createProxy } from "./utils/proxy";

// Create a single proxy instance for Zapdos Labs backend with auth token inclusion
const zapdosProxy = createProxy({
    target: "https://backend.zapdoslabs.com",
    changeOrigin: true,
    includeAuthToken: true,
});

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
        if (pathname === "/api/v1/status") {
            return handleStatusRequest(req, res);
        }

        if (pathname === "/api/v1/save-config") {
            return handleSaveConfigRequest(req, res);
        }

        // Proxy these specific API routes to Zapdos Labs backend
        if (
            pathname === "/api/v1/search" ||
            pathname === "/api/v1/storage" ||
            pathname === "/api/v1/summarize" ||
            pathname === "/api/v1/autocomplete" ||
            pathname === "/api/v1/media-unit"
        ) {
            zapdosProxy(req, res);
            return true;
        }

        // If no API route matches, return 404
        res.writeHead(404, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "API Endpoint Not Found" }));
        return true;
    }

    // If not an API request, indicate it was not handled
    return false;
};