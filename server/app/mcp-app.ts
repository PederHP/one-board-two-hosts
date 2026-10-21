import { App } from "@modelcontextprotocol/ext-apps";
import { STATUSES, type Board } from "../board.ts";

const POLL_MS = 3000;

const columnsEl = document.getElementById("columns")!;
const statusEl = document.getElementById("status")!;
const form = document.getElementById("add") as HTMLFormElement;
const titleInput = document.getElementById("title") as HTMLInputElement;

const app = new App({ name: "Board", version: "0.1.0" });
let shownVersion = -1;

function render(board: Board) {
  if (board.version === shownVersion) return;
  shownVersion = board.version;
  columnsEl.replaceChildren(
    ...STATUSES.map((status) => {
      const col = document.createElement("div");
      col.className = "column";
      const h = document.createElement("h3");
      h.textContent = status;
      col.append(h);
      for (const card of board.cards.filter((c) => c.status === status)) {
        const el = document.createElement("div");
        el.className = "card";
        el.textContent = card.title;
        const moves = document.createElement("div");
        moves.className = "moves";
        for (const to of STATUSES.filter((s) => s !== status)) {
          const b = document.createElement("button");
          b.textContent = `→ ${to}`;
          b.onclick = () => call("move_card", { id: card.id, status: to });
          moves.append(b);
        }
        el.append(moves);
        col.append(el);
      }
      return col;
    }),
  );
}

async function call(name: string, args: Record<string, unknown> = {}) {
  try {
    const result = await app.callServerTool({ name, arguments: args });
    if (result.structuredContent) render(result.structuredContent as Board);
    statusEl.textContent = `Synced ${new Date().toLocaleTimeString()}`;
  } catch (e) {
    statusEl.textContent = `Error: ${e instanceof Error ? e.message : String(e)}`;
  }
}

// Set before connect() so the initial tool result isn't missed.
app.ontoolresult = (result) => {
  if (result.structuredContent) render(result.structuredContent as Board);
};

form.addEventListener("submit", (ev) => {
  ev.preventDefault();
  const title = titleInput.value.trim();
  if (!title) return;
  titleInput.value = "";
  void call("add_card", { title });
});

void app.connect().then(() => {
  statusEl.textContent = "Connected";
  // The server cannot push to the App, so the App polls. The mod polls too.
  setInterval(() => void call("get_board"), POLL_MS);
});
