import httpProxy from "http-proxy";
import { ServerResponse } from "http";
import { appConfig } from "../../utils/config";

export interface ProxyOptions {
  target: string;
  changeOrigin?: boolean;
  headers?: Record<string, string>;
  includeAuthToken?: boolean;
}

export const createProxy = (options: ProxyOptions) => {
  const proxy = httpProxy.createProxyServer({
    target: options.target,
    changeOrigin: options.changeOrigin ?? true,
    proxyTimeout: 30000, // 30 seconds timeout
    timeout: 30000, // 30 seconds timeout
  });

  // Handle proxy errors
  proxy.on("error", (err, req, res) => {
    console.error("Proxy error:", err);
    if (res && typeof res === 'object' && 'headersSent' in res && !(res as ServerResponse).headersSent) {
      (res as ServerResponse).writeHead(500, { "Content-Type": "application/json" });
      (res as ServerResponse).end(JSON.stringify({ error: "Proxy error occurred" }));
    } else {
      console.error("Response headers already sent or response is undefined");
    }
  });

  return (req: any, res: any) => {
    // Get the current config to access the auth token
    const config = appConfig.store;

    // Modify headers to include auth token if available and requested
    if (options.includeAuthToken && config.auth_token) {
      req.headers["authorization"] = `Bearer ${config.auth_token}`;
    }

    // Add any additional headers from options
    if (options.headers) {
      Object.assign(req.headers, options.headers);
    }

    // Proxy the request
    proxy.web(req, res);
  };
};