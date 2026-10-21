import { atom, read, update } from 'claude-code'
import type { EngineInterface, McpToolResult, Register } from 'claude-code'

import type { Board, Status } from '../types'

const PANE = 'board'
const POLL_MS = 3000
const STATUSES: Status[] = ['todo', 'doing', 'done']

// The server's key under mcpServers in .claude-plugin/plugin.json.
const SERVER_KEY = 'board'

const board = atom({ plugin: 'board', key: 'board' } as const, null)
const connection = atom({ plugin: 'board', key: 'connection' } as const, { server: null, error: null })

const message = (err: unknown) => (err instanceof Error ? err.message : String(err))

// Claude Code hands a tool's structuredContent to mods (and to the model) as
// a JSON text block in place of the server's own content, so read whichever
// arrived.
function boardOf(result: McpToolResult): Board {
  const text = result.content.find(b => b.type === 'text')?.text
  if (result.isError) throw new Error(text ?? 'the tool reported an error')
  if (result.structuredContent) return result.structuredContent as Board
  if (!text) throw new Error('no board in the result')
  return JSON.parse(text) as Board
}

// The name $.mcp.call takes for the manifest's server, connecting it if need be.
async function serverName($: EngineInterface) {
  const { server } = await read($, connection)
  if (server) return server
  const connected = await $.mcp.connect(SERVER_KEY)
  if (!connected.isConnected) throw new Error(connected.message)
  await update($, connection, c => ({ ...c, server: connected.server }))
  return connected.server
}

// Calls a board tool and shows the board it answers with. No permission
// prompt: installing the mod was the grant.
async function callBoard($: EngineInterface, tool: string, args?: Record<string, unknown>) {
  try {
    const fresh = boardOf(await $.mcp.call(await serverName($), tool, args))
    await update($, connection, c => ({ ...c, error: null }))
    if ((await read($, board))?.version !== fresh.version) {
      await update($, board, () => fresh)
      const doing = fresh.cards.find(c => c.status === 'doing')
      $.ui.status(doing ? `▶ ${doing.title}` : undefined)
    }
    return fresh
  } catch (err) {
    // Forget the server and ask again on the next poll. Claude Code doesn't
    // retry a server that failed by itself (2.1.296), but once the person
    // reconnects it from /mcp, the next poll picks it up.
    await update($, connection, () => ({ server: null, error: message(err) }))
    return null
  }
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    await $.command.register({
      name: 'board',
      description: 'Show the shared task board; `/board done` finishes the card in progress',
    })

    // The server can't push to us, so poll. Not get_board, the App's poll:
    // Claude Code hides app-only tools (visibility ["app"]) from mods too.
    await callBoard($, 'show_board')
    $.clock.every(POLL_MS, () => void callBoard($, 'show_board'))

    return next(e)
  })

  on('command.run', { command: 'board' }, async ($, e) => {
    if (e.args.trim() !== 'done') {
      await $.ui.open({ id: PANE, title: 'Board' })
      return { text: 'Board pane opened.' }
    }

    const doing = (await read($, board))?.cards.find(c => c.status === 'doing')
    if (!doing) return { text: 'No card in progress.' }

    const fresh = await callBoard($, 'move_card', { id: doing.id, status: 'done' })
    return { text: fresh ? `Done: ${doing.title}` : `Could not finish "${doing.title}".` }
  })

  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    const { Box, Text, Button } = $.ui.resolve(e)
    const current = await read($, board)
    const { server, error } = await read($, connection)

    return (
      <Box flexDirection="column">
        {current === null && <Text dimColor>Waiting for the board server…</Text>}
        {current !== null &&
          STATUSES.map(status => (
            <Box flexDirection="column" marginBottom={1}>
              <Text bold>{status.toUpperCase()}</Text>
              {current.cards
                .filter(c => c.status === status)
                .map(card => (
                  <Box>
                    <Text>{card.title} </Text>
                    {STATUSES.filter(s => s !== status).map(to => (
                      <Button
                        key={`${card.id}-${to}`}
                        label={`→ ${to}`}
                        onPress={() => void callBoard($, 'move_card', { id: card.id, status: to })}
                      />
                    ))}
                  </Box>
                ))}
            </Box>
          ))}
        {error ? (
          <Box flexDirection="column">
            <Text dimColor>Can't reach the board server: {error}</Text>
            <Text dimColor>Start it with `npm start`, then reconnect plugin:board:board from /mcp.</Text>
          </Box>
        ) : (
          <Text dimColor>
            {server}, every {POLL_MS / 1000} s
          </Text>
        )}
      </Box>
    )
  })
}
