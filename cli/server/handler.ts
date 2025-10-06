import http from "http";
import { URL } from "url";
import { handleStatusRequest } from "./handlers/status";
import { handleSearchRequest } from "./handlers/search";
import { handleImageRequest } from "./handlers/image";
import { handleSummarizeRequest } from "./handlers/summarize";
import { handleMediaUnitRequest } from "./handlers/media-unit";
import { appConfig, maskedConfig } from "../utils/config";
import { handleSaveConfigRequest } from "./handlers/save-config";

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

        // Proxy these specific API routes to cloud
        if (pathname === "/api/v1/search") {
            return await handleSearchRequest(req, res);
        }

        if (pathname === "/api/v1/image") {
            return await handleImageRequest(req, res);
        }

        if (pathname === "/api/v1/summarize") {
            return await handleSummarizeRequest(req, res);
        }

        if (pathname === "/api/v1/media-unit") {
            return await handleMediaUnitRequest(req, res);
        }

        // If no API route matches, return 404
        res.writeHead(404, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "API Endpoint Not Found" }));
        return true;
    }

    // If not an API request, indicate it was not handled
    return false;
};