# Worker (Node-Assigned Task System)

One process = one node. Run multiple processes with different env for multiple nodes.

## Setup

```bash
pnpm install
```

## Two nodes (local)

1. Copy env examples and set real secrets (must match `nodes` table on main server):

   - `cp .env.nodeA.example .env.nodeA` — set `NODE_ID`, `NODE_SECRET` for nodeA
   - `cp .env.nodeB.example .env.nodeB` — set `NODE_ID`, `NODE_SECRET` for nodeB

2. Run two terminals:

   **Terminal 1 (node A):**
   ```bash
   pnpm run nodeA
   ```
   or: `set ENV_FILE=.env.nodeA && node src/app.js` (Windows) / `ENV_FILE=.env.nodeA node src/app.js` (Linux/Mac)

   **Terminal 2 (node B):**
   ```bash
   pnpm run nodeB
   ```
   or: `set ENV_FILE=.env.nodeB && node src/app.js` (Windows) / `ENV_FILE=.env.nodeB node src/app.js` (Linux/Mac)

3. Or use a single `.env` and run one worker with `pnpm start` (e.g. for one node).

## Env vars

| Variable           | Description                    | Example                |
|--------------------|--------------------------------|------------------------|
| MAIN_SERVER_URL    | Main server base URL           | http://localhost:8080  |
| NODE_ID            | This node’s id (in `nodes`)   | node-1                 |
| NODE_SECRET        | Secret for node login         | (from DB)               |
| POLL_INTERVAL_MS   | Poll interval (ms)             | 5000                   |
| ENV_FILE           | Optional .env path per process| .env.node1             |

## Adding task types

1. Add a handler in `src/handlers/` (e.g. `myTask.js` exporting an async function).
2. Register it in `src/handlers/index.js` in the `registry` object (key = `task_type`).
