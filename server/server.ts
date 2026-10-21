import {
  registerAppResource,
  registerAppTool,
  RESOURCE_MIME_TYPE,
} from "@modelcontextprotocol/ext-apps/server";
import { McpServer } from "@modelcontextprotocol/server";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";
import { addCard, describe, getBoard, moveCard, STATUSES } from "./board.js";

const DIST_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), "dist");
const resourceUri = "ui://board/mcp-app.html";

// The shape of every tool's structuredContent. Keep it readable by a model:
// Claude Code shows the model (and mods) structuredContent as JSON text in
// place of `content`. claude.ai's model reads the `content` text.
const boardSchema = z.object({
  version: z.number(),
  cards: z.array(z.object({ id: z.string(), title: z.string(), status: z.enum(STATUSES) })),
});

function boardResult(prefix?: string) {
  const board = getBoard();
  const text = prefix ? `${prefix}\n\n${describe(board)}` : describe(board);
  return {
    content: [{ type: "text" as const, text }],
    structuredContent: board,
  };
}

export function createServer(): McpServer {
  const server = new McpServer({ name: "Board", version: "0.1.0" });

  // The App's entry point: hosts that support MCP Apps render the result as the
  // App; others show the text.
  registerAppTool(
    server,
    "show_board",
    {
      title: "Show board",
      description: "Show the task board with all cards by status.",
      inputSchema: z.object({}),
      outputSchema: boardSchema,
      _meta: { ui: { resourceUri } },
    },
    async () => boardResult(),
  );

  registerAppTool(
    server,
    "add_card",
    {
      title: "Add card",
      description: "Add a card to the board's todo column.",
      inputSchema: z.object({ title: z.string().min(1) }),
      outputSchema: boardSchema,
      _meta: { ui: { resourceUri } },
    },
    async ({ title }) => boardResult(`Added [${addCard(title).id}] ${title}.`),
  );

  registerAppTool(
    server,
    "move_card",
    {
      title: "Move card",
      description: "Move a card to another column: todo, doing or done.",
      inputSchema: z.object({ id: z.string(), status: z.enum(STATUSES) }),
      outputSchema: boardSchema,
      _meta: { ui: { resourceUri } },
    },
    async ({ id, status }) => boardResult(`Moved [${moveCard(id, status).id}] to ${status}.`),
  );

  // App only: the App polls this, and hosts hide it from the model. Claude Code
  // hides it from mods too, so the mod polls show_board instead.
  registerAppTool(
    server,
    "get_board",
    {
      description: "Current board state, for the App's polling.",
      inputSchema: z.object({}),
      outputSchema: boardSchema,
      _meta: { ui: { resourceUri, visibility: ["app"] } },
    },
    async () => boardResult(),
  );

  registerAppResource(
    server,
    resourceUri,
    resourceUri,
    { mimeType: RESOURCE_MIME_TYPE },
    async () => {
      const html = await fs.readFile(path.join(DIST_DIR, "mcp-app.html"), "utf-8");
      return { contents: [{ uri: resourceUri, mimeType: RESOURCE_MIME_TYPE, text: html }] };
    },
  );

  return server;
}
