# One board, two hosts

A task board that lives on one MCP server and shows up in two places:

- in **claude.ai**, as an **MCP App**: HTML the server ships, which claude.ai renders in
  a sandboxed iframe;
- in **Claude Code**, as a **mod**: a pane and a status-line entry, drawn by a plugin you
  install.

Move a card on one side and the other follows within a few seconds.

```
claude.ai ── custom connector ──┐
  the MCP App (iframe)          │
                                ▼
                   board MCP server (Streamable HTTP)
                                ▲
Claude Code ── mod's manifest ──┘
  pane + status line
```

## You need

- **Node 20+**
- **Claude Code** with mods (tested on 2.1.306)
- Optional, for the claude.ai half: a claude.ai plan that can add custom connectors, and
  [`cloudflared`](docs/tunnel.md)

## Quickstart (5 minutes)

1. Clone this repo and start the server. It builds the App, then watches both:

   ```sh
   git clone https://github.com/PederHP/one-board-two-hosts
   cd one-board-two-hosts
   npm install
   npm start
   ```

2. In a second terminal, from this folder, start Claude Code with the mod loaded:

   ```sh
   claude --plugin-dir mod
   ```

   Start the server first: Claude Code connects to it once, when the session starts.
   Type `/board`. The board opens in a pane, and the card in progress shows in the status
   line. Press a `→ done` button, or type `/board done`.

3. Ask Claude "What's on my board?" It sees the same server's tools.

4. Optional: bring in claude.ai with a tunnel. See [docs/tunnel.md](docs/tunnel.md). Then
   ask claude.ai "Show me my board", move a card there, and watch the terminal.

Port 3001 taken? `PORT=3002 npm start`, then
`BOARD_URL=http://localhost:3002/mcp claude --plugin-dir mod`.

## What's where

| Path | What it is |
|---|---|
| `server/board.ts` | The board itself, in memory. Restarting the server resets it. |
| `server/server.ts` | The MCP tools and the `ui://` resource that holds the App |
| `server/main.ts` | Express and Streamable HTTP, bound to `127.0.0.1` |
| `server/mcp-app.html`, `server/app/` | The MCP App: plain TypeScript, bundled into one HTML file |
| `mod/.claude-plugin/plugin.json` | The mod's manifest. It lists the server, so Claude Code connects to it. |
| `mod/hooks/register.tsx` | The mod: the `/board` command, the pane, the status line, polling |
| `mod/tests/` | Tests for the mod, run by `claude plugin test` |
| `docs/` | [Making it public](docs/tunnel.md) and [gotchas](docs/gotchas.md) |
| `STUCK.md` | What to do when something doesn't work |

Your editor's types for the mod appear in `mod/.claude-plugin/types/` the first time
Claude Code loads it.

## Check your work

```sh
npm run check
```

This type-checks and builds the server and the App, then validates and tests the mod.

Stuck at any point? See [STUCK.md](STUCK.md).

## Let your Claude do the typing

You don't need to know how to write an MCP server, an MCP App or a mod by hand. You need
to know what to ask. Some starting points:

- "Explain how `server/server.ts` and `mod/hooks/register.tsx` talk to each other."
- "Load the `plugin-authoring` skill, then add `/board add <title>` to the mod."
- "Add a `delete_card` tool and a delete button in the App, then run `npm run check`."

Skills that help:

- **Mods:** Claude Code's built-in `plugin-authoring` skill. It writes the full mod API
  types for your Claude Code version, with examples.
- **MCP Apps:** the `mcp-apps` plugin from the MCP Apps repo, with skills such as
  `create-mcp-app` and `add-app-to-server`:

  ```
  /plugin marketplace add modelcontextprotocol/ext-apps
  /plugin install mcp-apps@mcp-apps
  ```

## Then what

[CHALLENGES.md](CHALLENGES.md) has challenges for each side, from warm-ups to stretch
goals. Each one changes one side and lets you watch the other react.

Or bring your own project. Does it have an MCP server? Give it a `ui://` App. Do you have
a workflow you run in Claude Code? Give it a pane.

## Safety

- The server binds to `127.0.0.1` and has **no authentication**. Nothing outside your
  machine can reach it until you open a tunnel.
- A quick tunnel is **public**: anyone with the URL can use the board. Open it to try
  claude.ai, and **stop it when you're done**.
- Proper authorization (OAuth) is one of the advanced challenges.
- Use Streamable HTTP, as here, rather than stdio unless a server truly has to run
  locally as a subprocess.
