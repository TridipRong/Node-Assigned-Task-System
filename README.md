# Node-Assigned Distributed Task System

A secure task processing system where only the explicitly assigned worker node can execute and update a task. Uses JWT for node/admin auth, optimistic locking for consistency, and timeout-based recovery.

---

## Architecture Overview
<img width="816" height="783" alt="Screenshot 2026-02-08 123706" src="https://github.com/user-attachments/assets/770a0f44-454e-4f08-9bfc-ccc5fe42bbff" />


- **Main Server:** REST API, JWT auth (node + admin), task CRUD, cron for timed-out tasks. Only the node with `assigned_node_id` can fetch/update that task.
- **Workers:** One process per node. Login with `node_id` + `node_secret`, poll GET /tasks/assigned, run handler by `task_type`, PATCH status (completed/failed).
- **Security:** Server verifies requesting node ID = task’s `assigned_node_id`; no cross-node access.
- **Failover:** Tasks stuck `in_progress` past `timeout_at` are reset to `pending` by cron; admin can reassign via PATCH reassign.

---

## API Definitions

Base URL: `http://localhost:8080` (or your `PORT`).

### Auth

| Method | Endpoint | Auth | Body | Response |
|--------|----------|------|------|----------|
| POST | `/auth/node/login` | — | `{ "node_id": "string", "node_secret": "string" }` | `{ "token": "JWT" }` |
| POST | `/auth/admin/login` | — | `{ "username": "string", "password": "string" }` | `{ "token": "JWT" }` |

Use token in header: `Authorization: Bearer <token>`.

### Tasks

| Method | Endpoint | Auth | Body | Response |
|--------|----------|------|------|----------|
| POST | `/tasks` | Admin | `{ "task_type", "task_details", "assigned_node_id" }` | `{ "task_id": "uuid" }` |
| GET | `/tasks/assigned` | Node | — | `[ { task_id, task_type, task_details, status, version, ... } ]` |
| PATCH | `/tasks/:id/status` | Node | `{ "status": "completed" \| "failed", "version": number }` | `{ "success": true }` |
| PATCH | `/tasks/:id/reassign` | Admin | `{ "new_node_id": "string" }` | `{ "success": true }` |

- **Create task:** `task_type` (e.g. `email_send`, `notification_send`, `report_generate`), `task_details` (object), `assigned_node_id` (required).
- **Get assigned:** Returns only tasks where `assigned_node_id` = authenticated node; locks them to `in_progress` with a 5‑minute timeout.
- **Update status:** Send current `version` from the task; only `completed` or `failed` for finished work.
- **Reassign:** Sets task to `pending` and new `assigned_node_id`; used after timeout or failover.

### Error responses

- `400` — Validation (e.g. Joi); body may include `details`.
- `401` — Missing or invalid token.
- `403` — Forbidden (wrong token type).
- `404` — Task not found (e.g. reassign).
- `409` — Conflict / idempotent (e.g. version mismatch on status update).
- `500` — Internal server error.

---

## Data Schema

### PostgreSQL

**Table: `nodes`**

| Column | Type | Description |
|--------|------|-------------|
| node_id | UUID PRIMARY KEY | |
| node_secret | VARCHAR / TEXT NOT NULL | Secret for node login (never exposed in API) |
| is_active | BOOLEAN DEFAULT true | If false, node cannot login |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |

**Table: `tasks`**

| Column | Type | Description |
|--------|------|-------------|
| task_id | UUID PRIMARY KEY | |
| task_type | VARCHAR / TEXT NOT NULL | e.g. email_send, notification_send, report_generate |
| task_details | JSONB | Payload for the worker handler |
| assigned_node_id | VARCHAR / TEXT NOT NULL | Only this node can fetch/update |
| status | VARCHAR NOT NULL | pending, in_progress, completed, failed |
| version | INTEGER DEFAULT 1 | Optimistic lock; incremented on update |
| locked_at | TIMESTAMPTZ | Set when node fetches task |
| timeout_at | TIMESTAMPTZ | Lock expiry; cron resets if past |
| retry_count | INTEGER DEFAULT 0 | Bumped when cron resets timeout |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |

**Example SQL (run once):**

```sql
CREATE TABLE nodes (
  node_id     TEXT PRIMARY KEY,
  node_secret TEXT NOT NULL,
  is_active   BOOLEAN DEFAULT true,
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE tasks (
  task_id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_type         TEXT NOT NULL,
  task_details      JSONB DEFAULT '{}',
  assigned_node_id  TEXT NOT NULL,
  status            TEXT NOT NULL DEFAULT 'pending',
  version           INTEGER NOT NULL DEFAULT 1,
  locked_at         TIMESTAMPTZ,
  timeout_at        TIMESTAMPTZ,
  retry_count       INTEGER NOT NULL DEFAULT 0,
  created_at        TIMESTAMPTZ DEFAULT now(),
  updated_at        TIMESTAMPTZ DEFAULT now()
);

-- Example nodes (replace secrets in production)
INSERT INTO nodes (node_id, node_secret) VALUES
  ('nodeA', 'secret-for-node-a'),
  ('nodeB', 'secret-for-node-b');
```

---

## Implementation

### Repository layout

```
Node-Assigned Distributed Task System/
├── README.md                 # This file
├── main-server/
│   ├── .env                  # PORT, DB_*, JWT_SECRET, ADMIN_*
│   ├── package.json
│   ├── src/
│   │   ├── app.js            # Express, routes, error handler, DB check
│   │   ├── db.js             # pg Pool
│   │   ├── middleware/       # auth (verifyNode, verifyAdmin), errorHandler
│   │   ├── routes/           # auth.routes, task.routes (thin)
│   │   ├── handlers/         # auth.handler, task.handler
│   │   ├── services/         # auth.service, task.service (business logic)
│   │   ├── repositories/    # task.repository, node.repository (all SQL, shared pool)
│   │   ├── dtos/             # request (Joi), response (shaping)
│   │   ├── models/           # Node, Task (table defs, toResponse)
│   │   └── cron/
│   │       └── timeout.js   # Every minute: reset in_progress past timeout_at
│   └── postman/              # Postman collection (optional)
└── worker/
    ├── .env / .env.nodeA / .env.nodeB
    ├── package.json
    └── src/
        ├── app.js            # Config validate, login, start poller, shutdown
        ├── config.js         # MAIN_SERVER_URL, NODE_ID, NODE_SECRET, POLL_INTERVAL_MS
        ├── api.js            # login(), getAssignedTasks(), updateStatus()
        ├── poller.js         # setInterval → getAssignedTasks → executor.run
        ├── executor.js       # getHandler(task_type), run task, PATCH status
        └── handlers/         # email_send, notification_send, report_generate, index
```

### Main server flow

- **Request:** Route → middleware (auth if needed) → handler → DTO validate → service → repository → pool → response DTO.
- **Data access:** All SQL lives in `repositories/` (task.repository, node.repository). Services call repository methods; a single shared `pg` Pool is used for all queries.
- **Task create:** Admin only; inserts row with `assigned_node_id`, status `pending`.
- **Task fetch (GET /tasks/assigned):** Node only; UPDATE pending tasks for that `assigned_node_id` to `in_progress` with `timeout_at`, RETURNING rows.
- **Task status (PATCH):** Node only; UPDATE where `task_id`, `assigned_node_id`, and current `version` match; then set new status and `version = version + 1`.
- **Cron:** Every minute, set `status = pending` and clear lock for rows where `status = 'in_progress'` and `timeout_at < now()`.

### Worker flow

- **Start:** Load config, login (POST /auth/node/login), store JWT, start poller.
- **Poll:** GET /tasks/assigned with Bearer token; for each task, run handler by `task_type`, then PATCH status `completed` or `failed` with same `version`.
- **Handlers:** Registered in `handlers/index.js`; unknown `task_type` → mark task `failed`.

---

## Quick Start

### Prerequisites

- Node.js (e.g. 18+)
- pnpm (`npm install -g pnpm` if needed)
- PostgreSQL (create DB and run the schema SQL above)

### 1. Main server

```bash
cd main-server
cp .env.example .env   # or create .env with PORT, DB_*, JWT_SECRET, ADMIN_USERNAME, ADMIN_PASSWORD
pnpm install
pnpm start             # or pnpm run dev for nodemon
```

Server runs on `PORT` (default 8080). Ensure `nodes` table has entries for each worker (e.g. nodeA, nodeB).

### 2. Workers (e.g. two nodes)

```bash
cd worker
pnpm install
```

**Terminal 1 (node A):**

```bash
# .env.nodeA: MAIN_SERVER_URL, NODE_ID=nodeA, NODE_SECRET=..., POLL_INTERVAL_MS=5000
pnpm run nodeA
```

**Terminal 2 (node B):**

```bash
# .env.nodeB: NODE_ID=nodeB, same MAIN_SERVER_URL, etc.
pnpm run nodeB
```

Or with a single `.env`: `pnpm start` for one node.

### 3. Create tasks (admin)

1. Get admin token: `POST /auth/admin/login` with `username` / `password` from server `.env`.
2. Create task: `POST /tasks` with `task_type`, `task_details`, `assigned_node_id` (e.g. nodeA or nodeB).

Only the worker whose `NODE_ID` matches `assigned_node_id` will receive and execute that task.

---

## Environment summary

| Component | Key variables |
|-----------|----------------|
| Main server | PORT, DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME, JWT_SECRET, ADMIN_USERNAME, ADMIN_PASSWORD |
| Worker | MAIN_SERVER_URL, NODE_ID, NODE_SECRET, POLL_INTERVAL_MS; optional ENV_FILE for .env.nodeA / .env.nodeB |

---

## Consistency & security

- **Idempotency:** Task updates use `version`; duplicate PATCH with same version may return 409 (no double commit).
- **No status regression:** Workers only set `completed` or `failed` after execution.
- **Node isolation:** Server enforces `assigned_node_id` in queries; only that node’s JWT can fetch/update the task.
- **Timeout:** Cron releases stuck tasks so they can be picked again or reassigned by admin.
