# Stuck?

First, ask your Claude: paste the error and say what you were trying to do. Then raise
your hand; someone will come round.

Find your symptom below. Most of them have a way round, so being stuck on one part
doesn't have to stop you.

## I can't run a tunnel

Locked-down laptop, a firewall that blocks `trycloudflare.com`, or no rights to install
`cloudflared`. Your options, best first:

- **Do the Claude Code side.** It runs on `localhost` and needs no tunnel. The whole mod
  track in [CHALLENGES.md](CHALLENGES.md) works without claude.ai.
- **See the App locally with MCP Inspector.** It hosts MCP Apps in your browser, so you
  can work on the App track without claude.ai. With the server running:

  ```sh
  npx @modelcontextprotocol/inspector --web --transport http --server-url http://localhost:3001/mcp
  ```

  Open the address it prints, connect, and call `show_board`. The Inspector needs Node
  22.19 or later.
- **Install `cloudflared` without an installer.** It's a single binary: download it from
  the [cloudflared releases](https://github.com/cloudflare/cloudflared/releases) page and
  run it from wherever you saved it.
- **Use another tunnel.** VS Code's port forwarding (Ports tab, forward 3001, set its
  visibility to Public), ngrok or Tailscale Funnel all work the same way. Set
  `PUBLIC_HOST` to whatever hostname they give you.
- **Share a neighbour's board.** If someone near you has a tunnel running, add their
  `https://…/mcp` URL as your connector. You'll both see one board, which is the point of
  the demo anyway. It's unauthenticated, so only do this with people in the room, and
  remove the connector afterwards.
- **Use your own server.** If you have a VPS or another host, deploy there and point the
  connector at it.

## claude.ai

**I can't add a custom connector.** Some plans and organisations don't allow custom
connectors, or only let an owner or admin add them. If that's you, use MCP Inspector
(above) for the App, or do the mod track. Claude Desktop uses the same connectors as
claude.ai, so it won't get you round this.

**The connector won't connect.** Check, in order:

1. The tunnel is still running, and its URL hasn't changed. A quick tunnel gets a new
   address every run, so edit the connector to match.
2. The URL ends in `/mcp`.
3. You restarted the server with `PUBLIC_HOST=<tunnel host>`. Without it, every request
   through the tunnel gets a 403.

**Claude doesn't use the board.** Enable the connector for this chat in the tools menu,
start a new chat, and ask for the board by name: "Show me my board."

**The App shows but doesn't change.** It polls every 3 seconds; the "Synced" time at the
bottom tells you it's alive. If you restarted the server, the board was reset (it's in
memory), so ask Claude to show the board again.

**My change to the App doesn't show.** `npm start` rebuilds it, but claude.ai keeps the
copy it already loaded. Ask Claude to show the board again.

## Claude Code

**`/board` isn't a command.** Start Claude Code from the repo root with
`claude --plugin-dir mod`.

**The pane says the server is down.** Claude Code connects once, when the session starts.
Start the server, then open `/mcp` and reconnect `plugin:board:board`.

**Port 3001 is taken.** `PORT=3002 npm start`, then
`BOARD_URL=http://localhost:3002/mcp claude --plugin-dir mod`.

**Mods don't seem to work at all.** Check `claude --version`; this was tested on 2.1.306.
Run `claude update` if you're far behind. If your organisation's managed settings block
plugins, `--plugin-dir` may be blocked too: switch to the App track with MCP Inspector.

**My editor shows type errors in `mod/`.** The mod's types appear in
`mod/.claude-plugin/types/` the first time Claude Code loads it.

## Install and run

**`npm install` fails.** A company registry or proxy may not have the 2.x MCP packages:
check `npm config get registry`. A phone hotspot is the quickest way to rule out the
network.

**Wrong Node version.** You need Node 20 or later (22.19 or later for MCP Inspector).
`node --version` tells you; nvm, fnm or Volta switch versions without admin rights.

**Windows.** Both native Windows and WSL work. In PowerShell, set environment variables
with `$env:PUBLIC_HOST="…"; npm start`. In WSL, a browser on Windows reaches
`localhost` servers in WSL.

## None of this fits

Bring your own project instead: see the end of [CHALLENGES.md](CHALLENGES.md). Or pair
with someone whose setup works.
