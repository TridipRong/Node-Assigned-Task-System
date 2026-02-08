# Main Server (Node-Assigned Task System)

Central API for task creation, assignment, and status. Authenticates nodes and admins via JWT; only the assigned node can fetch and update a task.

## Setup

```bash
pnpm install
```

(Create a `.env` from `.env.example`; see Env vars below. Ensure PostgreSQL is running and the `nodes` + `tasks` tables exist — see project root README for schema.)

## Run

```bash
pnpm start
```

Or with auto-restart on file change:

```bash
pnpm run dev
```

Server listens on `PORT` (default 8080). On startup you should see PostgreSQL connected and the server URL.

## Env vars

| Variable           | Description                      | Example                |
|--------------------|----------------------------------|------------------------|
| PORT               | HTTP server port                 | 8080                   |
| DB_HOST            | PostgreSQL host                  | localhost               |
| DB_PORT            | PostgreSQL port                  | 5432                   |
| DB_USER            | DB user                          | postgres               |
| DB_PASSWORD        | DB password                      | (your password)        |
| DB_NAME            | Database name                    | task_system            |
| JWT_SECRET         | Secret for signing JWTs          | (strong secret)        |
| ADMIN_USERNAME     | Admin login username             | admin                  |
| ADMIN_PASSWORD     | Admin login password             | (strong password)      |
| TASK_TIMEOUT_MINUTES | Lock timeout (cron reset)     | 5                      |

## APIs

| Method | Endpoint                 | Auth  | Description                    |
|--------|--------------------------|-------|--------------------------------|
| POST   | `/auth/node/login`       | —     | Node login → JWT               |
| POST   | `/auth/admin/login`       | —     | Admin login → JWT              |
| POST   | `/tasks`                  | Admin | Create task (assigned_node_id) |
| GET    | `/tasks/assigned`         | Node  | Fetch and lock assigned tasks  |
| PATCH  | `/tasks/:id/status`       | Node  | Update status (completed/failed) |
| PATCH  | `/tasks/:id/reassign`     | Admin | Reassign task to another node  |

Use `Authorization: Bearer <token>` for protected routes. A Postman collection is in `postman/` (optional).

## Project structure

```
src/
  app.js           # Express, routes, DB check, listen
  db.js            # pg Pool (single shared pool)
  middleware/      # auth (verifyNode, verifyAdmin), errorHandler
  routes/          # auth.routes, task.routes
  handlers/        # auth.handler, task.handler
  services/        # auth.service, task.service (business logic)
  repositories/    # task.repository, node.repository (all SQL, use pool)
  dtos/            # request (Joi), response
  models/          # Node, Task
  cron/            # timeout.js (uses taskRepository to reset stuck tasks)
```

Services call repositories for DB access; repositories use the shared pool. No raw SQL in services.
