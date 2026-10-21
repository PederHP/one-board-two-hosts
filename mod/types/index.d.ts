export type Status = 'todo' | 'doing' | 'done'
export type Card = { id: string; title: string; status: Status }
export type Board = { cards: Card[]; version: number }

export type Connection = {
  /** The name `$.mcp.call` takes, once connected: `plugin:board:board`. */
  server: string | null
  /** Why the last call failed, until one succeeds. */
  error: string | null
}

declare module 'claude-code' {
  interface PluginState {
    board: { board: Board | null; connection: Connection }
  }
}
