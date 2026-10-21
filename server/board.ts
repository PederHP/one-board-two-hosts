// The board, in memory and shared by every client: the App in claude.ai, the
// mod in Claude Code, and the model in both. Restarting the server resets it.

export const STATUSES = ["todo", "doing", "done"] as const;
export type Status = (typeof STATUSES)[number];

export type Card = { id: string; title: string; status: Status };

export type Board = { cards: Card[]; version: number };

let nextId = 5;
const board: Board = {
  // Bumped on every change, so pollers can tell when to redraw.
  version: 1,
  cards: [
    { id: "1", title: "Clone the starter", status: "done" },
    { id: "2", title: "Open /board in Claude Code", status: "doing" },
    { id: "3", title: "Show the board in claude.ai", status: "todo" },
    { id: "4", title: "Pick a challenge", status: "todo" },
  ],
};

export function getBoard(): Board {
  return structuredClone(board);
}

export function addCard(title: string): Card {
  const card: Card = { id: String(nextId++), title, status: "todo" };
  board.cards.push(card);
  board.version++;
  return card;
}

export function moveCard(id: string, status: Status): Card {
  const card = board.cards.find((c) => c.id === id);
  if (!card) throw new Error(`No card with id ${id}`);
  card.status = status;
  board.version++;
  return card;
}

export function describe(b: Board): string {
  return STATUSES.map((s) => {
    const cards = b.cards.filter((c) => c.status === s);
    const lines = cards.map((c) => `  - [${c.id}] ${c.title}`);
    return [`${s} (${cards.length})`, ...lines].join("\n");
  }).join("\n");
}
