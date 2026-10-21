import { expect, test } from 'claude-code/testing'
import type { On } from 'claude-code'

import type { Board, Status } from '../types'

const SURFACES = ['terminal', 'desktop'] as const

const PANE_PROPS = {
  title: 'Board',
  isFocused: true,
  bodyColumns: 60,
  placement: 'dock',
  scroll: { offset: 0, bodyRows: 20 },
  view: {},
} as const

// Stands in for the engine beneath the mod, and for the board MCP server. A
// result is shaped as Claude Code delivers it: structuredContent as JSON text.
function fakeEngine(on: On, { reachable = true } = {}) {
  const calls: string[] = []
  const status: (string | undefined)[] = []
  on('session.start', (_$, e) => ({ cwd: e.cwd }))
  on('command.register', (_$, e) => ({ value: { command: e.name } }))
  on('clock.every', () => ({ value: undefined }))
  on('ui.status', (_$, e) => {
    status.push(e.text)
    return { value: undefined }
  })
  on('mcp.connect', () => ({
    value: reachable
      ? { isConnected: true as const, server: 'plugin:board:board' }
      : { isConnected: false as const, reason: 'failed' as const, message: 'ECONNREFUSED' },
  }))

  let board: Board = {
    version: 1,
    cards: [
      { id: '1', title: 'Open /board in Claude Code', status: 'doing' },
      { id: '2', title: 'Pick a challenge', status: 'todo' },
    ],
  }
  on('mcp.call', (_$, e) => {
    calls.push(e.tool)
    if (e.tool === 'move_card') {
      const { id, status } = e.args as { id: string; status: Status }
      board = {
        version: board.version + 1,
        cards: board.cards.map(c => (c.id === id ? { ...c, status } : c)),
      }
    }
    return { value: { content: [{ type: 'text', text: JSON.stringify(board) }], isError: false } }
  })
  return { calls, status }
}

for (const surface of SURFACES) {
  test(`draws the board and moves a card on ${surface}`, async ($, on) => {
    const { calls, status } = fakeEngine(on)
    await $.session.start({ cwd: '/tmp', surface, isInteractive: true })

    expect(calls[0]).toBe('show_board')
    expect(status).toContain('▶ Open /board in Claude Code')

    const pane = await $.ui.mount({ plugin: 'board', surface, component: 'Pane', requestId: 'board', props: PANE_PROPS })
    expect(await pane.find({ text: 'Open /board in Claude Code' })).toBeDefined()
    expect(await pane.find({ text: /plugin:board:board, every 3 s/ })).toBeDefined()

    await pane.press({ key: '1-done' })
    expect(calls).toContain('move_card')
    expect(status).toContain(undefined)
  })

  test(`says why when the server is down on ${surface}`, async ($, on) => {
    const { calls } = fakeEngine(on, { reachable: false })
    await $.session.start({ cwd: '/tmp', surface, isInteractive: true })

    expect(calls).toEqual([])
    const pane = await $.ui.mount({ plugin: 'board', surface, component: 'Pane', requestId: 'board', props: PANE_PROPS })
    expect(await pane.find({ text: /Waiting for the board server/ })).toBeDefined()
    expect(await pane.find({ text: /Can't reach the board server: ECONNREFUSED/ })).toBeDefined()
    expect(await pane.find({ text: /reconnect plugin:board:board from \/mcp/ })).toBeDefined()
  })
}

test('/board done finishes the card in progress', async ($, on) => {
  const { calls } = fakeEngine(on)
  await $.session.start({ cwd: '/tmp', surface: 'terminal', isInteractive: true })

  const result = await $.command.run({
    command: 'board',
    args: 'done',
    origin: { kind: 'composer' },
    presentation: { isFullscreen: true, columns: 120 },
  })

  expect(calls).toContain('move_card')
  expect(result).toEqual(expect.objectContaining({ text: 'Done: Open /board in Claude Code' }))
})
