# Gotchas

Things we ran into building this, as of Claude Code 2.1.296 and ext-apps 2.0.3.

## Claude Code shows `structuredContent`, not `content`

When a tool returns `structuredContent`, Claude Code replaces the result's `content`
with that object serialised as one JSON text block. The model sees that, and so does a
mod's `$.mcp.call`; `structuredContent` itself is absent there. claude.ai's model reads
your `content` text instead.

So keep your structured result readable by a model, and in a mod, read the JSON text
(see `boardOf` in `mod/hooks/register.tsx`).

## App-only tools are hidden from mods too

`_meta.ui.visibility: ["app"]` hides a tool from the model, so only the App can call it.
Claude Code also hides it from mods: `$.mcp.call` answers "no connected MCP tool". The
mod polls `show_board` instead of the App's `get_board`.

## A mod's MCP calls don't ask permission

`$.mcp.call` runs without a prompt: installing the mod was the grant. Treat mods like any
code you install.

## Nothing pushes; both sides poll

The server can't push to the App, and the mod has no subscription either. The App and
the mod each poll every 3 seconds, and redraw only when the board's `version` changes.

## 403 through the tunnel

The server answers requests through the tunnel with a 403 until you set `PUBLIC_HOST`.
See [tunnel.md](tunnel.md).

## Start the server first

Claude Code connects to the mod's server when the session starts, and doesn't try again
if that fails. If you started Claude Code before the server, start the server, then open
`/mcp` and reconnect `plugin:board:board`. The mod notices within a poll.

## The App is a built file

The server serves `server/dist/mcp-app.html`, which Vite builds from `mcp-app.html` and
`app/`. `npm start` rebuilds it on every change. Reload the App in claude.ai (ask to show
the board again) to see your change.

## The mod has no DOM and no Node

A mod draws an element tree (`Box`, `Text`, `Button`, …) that each Claude Code surface
draws its own way: terminal, desktop, VS Code, mobile. There's no webview, so a mod can't
render an MCP App's HTML. Everything outside the mod goes through `$`.

## The mod's types appear on first load

`mod/tsconfig.json` extends `mod/.claude-plugin/types/tsconfig.json`, which Claude Code
writes when it first loads the mod. Until then your editor shows errors in the mod.
