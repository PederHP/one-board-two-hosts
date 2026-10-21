# Challenges

Pick a side, change it, and watch the other side react. Warm-ups take 10–15 minutes;
the rest are open-ended. Your own Claude is a good pair: point it at this repo and the
file you're changing.

## App track (claude.ai)

The App is `server/mcp-app.html` and `server/app/mcp-app.ts`. It talks to the server
through `app.callServerTool` and gets results in `app.ontoolresult`.

1. **Warm-up: counts and colour.** Show a card count in each column header, and give the
   "doing" column its own colour.
2. **Drag and drop.** Drag cards between columns with the HTML drag-and-drop API, calling
   `move_card` on drop.
3. **Delete a card.** Add a `delete_card` tool to `server/server.ts` and `board.ts`, and a
   button in the App. Then make the mod's pane show the change (it already redraws when
   `version` changes).
4. **Follow claude.ai's theme.** The App receives the host's context: theme, fonts, style
   variables, display mode. Look at `app.getHostContext()`,
   `app.onhostcontextchanged`, `applyDocumentTheme` and `applyHostStyleVariables` in
   `@modelcontextprotocol/ext-apps`.

## Mod track (Claude Code)

The mod is `mod/hooks/register.tsx`. Claude Code reloads it when you start
`claude --plugin-dir mod`. Ask Claude Code to load its `plugin-authoring` skill: it
writes the full mod API types for your build, with examples.

1. **Warm-up: `/board add <title>`.** Handle `add` in the `command.run` hook and call
   `add_card`.
2. **A nudge above the prompt.** When a card has been in "doing" for more than N
   minutes, show a band above the prompt (a `ui.render` hook on
   `{ component: 'AbovePrompt' }`) with buttons to finish it or put it back.
3. **Let your work move the board.** A `tool.call` hook that reacts to what Claude does:
   move the card in progress to done when a Bash `npm test` succeeds, or add a card when
   Claude writes a `TODO` comment. `await next(e)` gives you the tool's result.
4. **Notice other people.** Show a toast (`$.ui.toast`) when a card moves and the move
   didn't come from this session.

Run `npm run check` after each change. Add a test to `mod/tests/` for what you built.

## Both sides

- **Owners.** Give cards an owner. claude.ai shows initials on each card; the terminal's
  status line shows only *your* card in progress.
- **Mission control, lite.** The mod reports each turn's tool count to the server (a
  `turn.complete` hook calling a new tool), and the App shows a sparkline.

## Advanced: authorization

Turn the server into an OAuth resource server, so the tunnel no longer exposes an open
board:

- Put `requireBearerAuth` from `@modelcontextprotocol/express` in front of `/mcp`.
- Publish protected-resource metadata (RFC 9728) that points to a hosted identity
  provider, and verify each token's audience in `verifyAccessToken`.
- claude.ai's connector runs the sign-in. Claude Code does too, for a server in a mod's
  manifest.

Things to discover on the way: what the mod's manifest should point at now, and why
leaving an unauthenticated localhost route open undoes the work. Start from
`docs/serving/authorization.md` and `examples/oauth/` in the
[MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk).

## Your own project

Does it have an MCP server? Give one of its tools a `ui://` App. Do you have a workflow
you run in Claude Code? Give it a pane, a status line or a band. The
[ext-apps repo](https://github.com/modelcontextprotocol/ext-apps) has more App examples.
