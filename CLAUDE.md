# Jira-clone

## Overview
A Jira-like project management app. Design was locked in 2026-07-14; **backend is scaffolded and verified working** (auth, projects/roles, issues incl. hierarchy + optimistic locking, sprints, comments, attachments, audit trail, real-time sockets). Frontend is still just planned. See PROGRESS.md for exact status.

**Stack:** React + Tailwind + shadcn/ui (frontend, Vite) · Node.js/Express (backend) · MongoDB/Mongoose · JWT auth · Socket.io real-time.

## Locked design decisions
- **Multi-tenant**: every collection carries `organizationId`; a `tenantScope` middleware injects it into every query via `req.scope(filter)` so it can't be forgotten route-by-route.
- **Per-project roles** (not global): a user's role (`admin` / `manager` / `developer` / `tester`) is stored per `ProjectMember` row and can differ across projects. Enforced via `requireProjectRole([...])` middleware, keyed off `req.params.projectId`/`req.body.projectId`. Routes keyed by a *sprint* id instead need `requireSprintProjectRole` (looks up the sprint's `projectId` first, then checks membership) — a plain `requireProjectRole` doesn't work there since the id in the URL isn't a project id.
- **Hierarchical issues**: Epic → Story/Task/Bug → Subtask, via `Issue.parentId`. A subtask cannot be nested under another subtask (enforced in a pre-save hook).
- **Local disk file storage behind a swappable interface**: `FileStorageInterface` (`save`/`getUrl`/`delete`) with `LocalDiskStorage` as the only implementation so far. Swapping to S3 later means writing `S3Storage.js` against the same interface, not touching controllers.
- **Optimistic locking for concurrency**: `Issue.version` (int, starts at 0). Every mutating issue endpoint (`move`, `update`) requires the client to send `expectedVersion`; the update only applies if it still matches (`findOneAndUpdate({ _id, version: expectedVersion }, { $inc: { version: 1 }, ... })`). Mismatch → `409`, client refetches and retries. The frontend always carries `issue.version` forward from whatever it last fetched.
- **Audit trail**: `IssueActivity` logs every field change (`field`, `fromValue`, `toValue`, `actorId`) via `services/activityLogger.js`. Skips no-op changes (`fromValue === toValue`).
- **Soft deletes**: `deletedAt` on `Organization`, `User`, `Project`, `Issue`, `Comment`. Never hard-delete; `req.scope()` filters `deletedAt: null` automatically. Deleting an issue soft-deletes its subtasks too.
- **Real-time**: Socket.io, JWT-authenticated on connect, one room per project board (`project:<id>`). Issue create/update/move/comment/attachment all broadcast `issue:updated` to that room via `services/notificationService.js`, which also queues an async notification email for the assignee (never blocks the request thread).

## Project structure
```
jira-clone/
├── backend/                      # scaffolded, working
│   ├── src/
│   │   ├── config/                {env.js, db.js}
│   │   ├── models/                Organization, User, Project, ProjectMember, Issue, Sprint, Comment, Attachment, IssueActivity
│   │   ├── middleware/            auth, tenantScope, requireProjectRole, requireSprintProjectRole, validate, rateLimiters, errorHandler
│   │   ├── controllers/           auth, project, issue, sprint, comment, attachment
│   │   ├── routes/                auth, project, issue, sprint, comment, attachment
│   │   ├── validation/            Zod schemas per resource
│   │   ├── services/              fileStorage/{FileStorageInterface,LocalDiskStorage}, notificationService, emailService, activityLogger
│   │   ├── sockets/index.js       Socket.io, JWT-authed, room-per-project-board
│   │   ├── jobs/emailQueue.js     in-memory async queue (swap for BullMQ/Redis later)
│   │   ├── utils/ApiError.js
│   │   └── app.js
│   ├── scripts/dev-mongo.sh       starts the project-local replica-set MongoDB (see gotcha below)
│   ├── uploads/                   local disk storage root, gitignored (.gitkeep tracked)
│   ├── server.js
│   ├── package.json
│   └── .env.example
└── frontend/                      # not started yet — planned layout below
    └── src/{api,context,components/{board,issues,projects,analytics,ui},pages,hooks}/
```
Full file-by-file spec for the frontend (every component with code, matching the backend routes above) was worked out in a planning session on 2026-07-14 — see PROGRESS.md decisions log for a pointer back to it when frontend work starts.

## Build, test, run, lint
**Backend** (from `backend/`):
- `npm install`
- `./scripts/dev-mongo.sh` — starts the project-local MongoDB replica set (see gotcha below); only needs to be run once per machine reboot
- `cp .env.example .env` and fill in `MONGO_URI=mongodb://localhost:27018/jira-clone-dev?replicaSet=rs0` (see gotcha), `JWT_SECRET`
- `npm run dev` — nodemon, or `npm start` for a plain run
- `npm test` — Jest (no tests written yet)
- Health check: `GET /health` → `{"success":true}`

**Frontend**: not scaffolded yet.

## Known gotchas
- **MongoDB must be a replica set, not standalone.** `issueController.createIssue` uses a multi-document transaction (to atomically bump `Project.issueCounter` and create the `Issue`), and standalone MongoDB rejects transactions with `Transaction numbers are only allowed on a replica set member or mongos`. Don't reach for a plain `mongod` — use `backend/scripts/dev-mongo.sh`, which runs an isolated single-node replica set on port **27018** with its own data dir (`backend/.mongodb-data/`, gitignored), so it doesn't touch any other MongoDB instance on the machine. Point `.env`'s `MONGO_URI` at it with `?replicaSet=rs0` in the query string.
- **Port 5000 is often taken on macOS** by the AirPlay Receiver (ControlCenter). The default `.env.example` still says `PORT=5000`; if boot fails with `EADDRINUSE`, either disable AirPlay Receiver (System Settings → General → AirDrop & Handoff) or just use a different `PORT` in `.env`.
- `Organization.ownerId` is **not** `required` in the schema (unlike a first-draft version of this design) — `authController.signup` creates the org before the user exists, then backfills `ownerId` after. Keep it optional or signup breaks.

## Coding conventions
- Controllers: every handler is `async (req, res, next) => { try {...} catch (err) { next(err) } }`; errors are thrown as `new ApiError(statusCode, message)` and handled centrally by `middleware/errorHandler.js`.
- Tenant scoping: controllers use `req.scope(filter)` (from `tenantScope` middleware) instead of raw Mongoose filters, so `organizationId` + `deletedAt: null` are never hand-rolled per query.
- Validation: Zod schemas per resource in `validation/*Schemas.js`, applied via a reusable `middleware/validate.js` in the route chain — not inline in controllers. Manual `if (!field) throw ...` checks are redundant once a route has `validate(schema)` and should not be added back.
- Route files mount `auth` + `tenantScope` once via `router.use(...)` at the top, then list endpoints.
- Sprint mutation routes keyed by sprint `id` (`start`/`complete`/`update`/`delete`) use `requireSprintProjectRole`, which stashes the looked-up sprint on `req.sprint` — controllers should read `req.sprint` instead of re-fetching it.
- Comment/attachment deletion is currently author/uploader-only (no project-admin override), because those routes don't run `requireProjectRole`/`requireSprintProjectRole` and so have no `req.projectRole` to check. Adding an admin override would mean resolving the project role via the issue's `projectId` first.
- Frontend (planned): API calls centralized in `api/*Api.js` modules (thin wrappers over an `axiosClient` with a request interceptor for the JWT and a response interceptor that redirects to `/login` on 401) — components never call `axios` directly. Board drag-and-drop updates local state immediately, then reconciles with the server response; a `409` from stale `version` triggers a full refetch with a user-facing notice rather than a silent overwrite.

## Session protocol
- At the start of every session, read PROGRESS.md before doing anything else.
- Before ending a session, or when asked to wrap up, update PROGRESS.md:
  move finished items from "Next up" to "Done," add new "Next up" items,
  and log any durable decisions.
- If you learn something about this project that would help a future
  session — a gotcha, a convention, a constraint — add it to CLAUDE.md
  rather than only mentioning it in chat.
- If the session isn't named yet, suggest a short descriptive name so
  it's easy to resume later.
