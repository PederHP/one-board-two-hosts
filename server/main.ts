import { createMcpExpressApp } from "@modelcontextprotocol/express";
import { NodeStreamableHTTPServerTransport } from "@modelcontextprotocol/node";
import type { Request, Response } from "express";
import { createServer } from "./server.js";

const port = parseInt(process.env.PORT ?? "3001", 10);

// Bind to localhost only: a tunnel (cloudflared) or reverse proxy on the same
// machine is what makes it public. The SDK's DNS rebinding protection checks
// the Host header, so the public hostname has to be allowed explicitly.
const publicHost = process.env.PUBLIC_HOST;
const app = createMcpExpressApp({
  host: "127.0.0.1",
  ...(publicHost && { allowedHosts: ["localhost", "127.0.0.1", publicHost] }),
});

// Stateless: a fresh server and transport per request. Board state lives in
// board.ts, so every request sees the same board.
app.all("/mcp", async (req: Request, res: Response) => {
  const server = createServer();
  const transport = new NodeStreamableHTTPServerTransport({ sessionIdGenerator: undefined });

  res.on("close", () => {
    transport.close().catch(() => {});
    server.close().catch(() => {});
  });

  try {
    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
  } catch (error) {
    console.error("MCP error:", error);
    if (!res.headersSent) {
      res.status(500).json({
        jsonrpc: "2.0",
        error: { code: -32603, message: "Internal server error" },
        id: null,
      });
    }
  }
});

app.listen(port, "127.0.0.1", (err) => {
  if (err) {
    console.error("Failed to start server:", err);
    process.exit(1);
  }
  console.log(`Board MCP server on http://localhost:${port}/mcp`);
  if (publicHost) {
    console.log(`Also accepting https://${publicHost}/mcp. Stop the tunnel when you're done.`);
  } else {
    console.log("For claude.ai, see docs/tunnel.md.");
  }
});
