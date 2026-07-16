# Jira-clone

## Overview
A Jira-like project management app. Design was locked in 2026-07-14; **backend and frontend are scaffolded, redesigned, and extended with Phase 1 ("make the board real") features — all verified working end-to-end in a real browser**: signup → create project → customize workflow statuses → create/link issues → drag/status-change → time-track → bulk-edit backlog → save/apply filters → sprint burndown, all confirmed live. See PROGRESS.md for exact status.

**Stack:** React + Tailwind + shadcn/ui (frontend, Vite) · Node.js/Express (backend) · MongoDB/Mongoose · JWT auth · Socket.io real-time.

## Locked design decisions
- **Multi-tenant**: every collection carries `organizationId`; a `tenantScope` middleware injects it into every query via `req.scope(filter)` so it can't be forgotten route-by-route.
- **Per-project roles** (not global): a user's role (`admin` / `manager` / `developer` / `tester`) is stored per `ProjectMember` row and can differ across projects. Enforced via `requireProjectRole([...])` middleware, keyed off `req.params.projectId`/`req.body.projectId`. Routes keyed by a *sprint* id instead need `requireSprintProjectRole` (looks up the sprint's `projectId` first, then checks membership) — a plain `requireProjectRole` doesn't work there since the id in the URL isn't a project id.
- **Hierarchical issues**: Epic → Story/Task/Bug → Subtask, via `Issue.parentId`. A subtask cannot be nested under another subtask (enforced in a pre-save hook).
- **Customizable per-project workflows**: `Issue.statusId` references a `WorkflowStatus` document (not a fixed enum). Every `WorkflowStatus` belongs to one of 3 fixed **categories** (`todo`/`in_progress`/`done`) that drive board-column grouping and "is this issue done?" logic (e.g. sprint completion), while the status *name*, *color*, and *order* are freely editable per project via Project Settings → Workflow Statuses. `projectController.createProject` seeds 3 defaults (To Do/In Progress/Done) on every new project. Deleting a status in use is blocked (`409`) until issues are reassigned off it.
- **Issue linking**: `IssueLink` stores one directional row per link (`blocks`/`relates_to`/`duplicates`); the *inverse* phrasing (`blocks` → "is blocked by") is computed at read time based on whether the viewed issue is the link's source or target — no duplicate inverse rows.
- **Local disk file storage behind a swappable interface**: `FileStorageInterface` (`save`/`getUrl`/`delete`) with `LocalDiskStorage` as the only implementation so far. Swapping to S3 later means writing `S3Storage.js` against the same interface, not touching controllers.
- **Optimistic locking for concurrency**: `Issue.version` (int, starts at 0). Every mutating issue endpoint (`move`, `update`, `bulk`) requires the client to send `expectedVersion`; the update only applies if it still matches (`findOneAndUpdate({ _id, version: expectedVersion }, { $inc: { version: 1 }, ... })`). Mismatch → `409` (or, for `/issues/bulk`, that item lands in the response's `failed` array with `reason: 'version_conflict'` while the rest of the batch still applies). The frontend always carries `issue.version` forward from whatever it last fetched.
- **Audit trail**: `IssueActivity` logs every field change (`field`, `fromValue`, `toValue`, `actorId`) via `services/activityLogger.js`. Skips no-op changes (`fromValue === toValue`). Status changes log the resolved `WorkflowStatus.name`, not the raw id, so the trail stays human-readable.
- **Soft deletes**: `deletedAt` on `Organization`, `User`, `Project`, `Issue`, `Comment`, `WorkflowStatus`. Never hard-delete; `req.scope()` filters `deletedAt: null` automatically. Deleting an issue soft-deletes its subtasks too (single or bulk delete).
- **Real-time**: Socket.io, JWT-authenticated on connect, one room per project board (`project:<id>`). Issue create/update/move/comment/attachment/worklog all broadcast `issue:updated` to that room via `services/notificationService.js`, which also queues an async notification email for the assignee (never blocks the request thread).
- **Time tracking**: `Issue.originalEstimateSeconds`/`remainingEstimateSeconds`/`loggedSeconds` + a separate `Worklog` model (one row per "log work" entry). Setting the original estimate for the first time also seeds `remainingEstimateSeconds`; logging work decrements it (floored at 0) and increments `loggedSeconds`; deleting a worklog reverses both. Sprint burndown (`GET /api/sprints/:id/burndown`) derives its "actual" line entirely from `IssueActivity`'s existing status-change audit trail (first time an issue's status activity lands on a `done`-category status name) — no separate burndown tracking needed.

## Project structure
```
jira-clone/
├── backend/                      # scaffolded, working
│   ├── src/
│   │   ├── config/                {env.js, db.js}
│   │   ├── models/                Organization, User, Project, ProjectMember, Issue, Sprint, Comment, Attachment, IssueActivity, WorkflowStatus, IssueLink, Worklog, SavedFilter
│   │   ├── middleware/            auth, tenantScope, requireProjectRole, requireSprintProjectRole, validate, rateLimiters, errorHandler
│   │   ├── controllers/           auth, project, issue, sprint, comment, attachment, workflowStatus, worklog, savedFilter
│   │   ├── routes/                auth, project, issue, sprint, comment, attachment, worklog, savedFilter
│   │   │                          (workflow-status routes live inside projectRoutes.js, nested under /:projectId — see gotchas for the /bulk route-ordering issue)
│   │   ├── validation/            Zod schemas per resource (incl. issueBulkSchemas.js, workflowStatusSchemas.js, issueLinkSchemas.js, worklogSchemas.js, savedFilterSchemas.js)
│   │   ├── services/              fileStorage/{FileStorageInterface,LocalDiskStorage}, notificationService, emailService, activityLogger
│   │   ├── sockets/index.js       Socket.io, JWT-authed, room-per-project-board
│   │   ├── jobs/emailQueue.js     in-memory async queue (swap for BullMQ/Redis later)
│   │   ├── utils/ApiError.js
│   │   └── app.js
│   ├── scripts/
│   │   ├── dev-mongo.sh                    starts the project-local replica-set MongoDB (see gotcha below)
│   │   └── migrate-workflow-statuses.js    one-time migration for pre-Phase-1 databases (Issue.status string → statusId) — not needed for fresh installs, createProject already seeds defaults
│   ├── uploads/                   local disk storage root, gitignored (.gitkeep tracked)
│   ├── server.js
│   ├── package.json
│   └── .env.example
└── frontend/                      # scaffolded, working (Vite + React 19 + Tailwind v4)
    └── src/
        ├── api/                    axiosClient (JWT interceptor) + authApi, projectApi, issueApi, sprintApi, commentApi, attachmentApi, workflowStatusApi, worklogApi, savedFilterApi
        ├── context/                AuthContext (session in localStorage), SocketContext (JWT-authed socket.io-client)
        ├── lib/utils.js            cn() helper, fieldClass (shared input styling), getInitials(), STATUS_DOT_CLASS/STATUS_BADGE_CLASS (WorkflowStatus.color → Tailwind classes, static map so the JIT scanner picks them up)
        ├── components/
        │   ├── ui/{badge,button}.jsx   Button has variant/size/loading props — use it instead of raw <button> for anything primary/secondary/ghost/danger
        │   ├── board/              Board, BoardColumn, IssueCard (drag via @hello-pangea/dnd, dynamic status columns), FilterBar (+ saved filters), BacklogPanel (+ bulk actions)
        │   ├── issues/             IssueModal (+ linked issues, time tracking), IssueForm, CommentThread, CreateIssueModal
        │   ├── projects/           ProjectList, ProjectMembers, WorkflowSettings
        │   └── analytics/          BurndownChart + BurndownPanel (sprint picker), WorkloadChart
        ├── hooks/useIssueFilters.js   filter state now keyed statusId (not status); has applyFilters() for saved-filter apply
        └── pages/                  LoginPage, DashboardPage, ProjectBoardPage, ProjectSettingsPage
```

## Build, test, run, lint
**Backend** (from `backend/`):
- `npm install`
- `./scripts/dev-mongo.sh` — starts the project-local MongoDB replica set (see gotcha below); only needs to be run once per machine reboot
- `cp .env.example .env` and fill in `MONGO_URI=mongodb://localhost:27018/jira-clone-dev?replicaSet=rs0` (see gotcha), `JWT_SECRET`
- `npm run dev` — nodemon, or `npm start` for a plain run
- `npm test` — Jest (no tests written yet)
- Health check: `GET /health` → `{"success":true}`

**Frontend** (from `frontend/`):
- `npm install`
- `cp .env.example .env` and point `VITE_API_URL`/`VITE_SOCKET_URL` at wherever the backend is actually running (see the port-5000 gotcha below — this repo's own dev setup uses 5050)
- `npm run dev` — Vite, default port 5173 (also usable via the `frontend` config in `.claude/launch.json` for the browser-preview tool)
- `npm run build` / `npm run lint` (lint is `oxlint`, not eslint)

## Known gotchas
- **MongoDB must be a replica set, not standalone.** `issueController.createIssue` uses a multi-document transaction (to atomically bump `Project.issueCounter` and create the `Issue`), and standalone MongoDB rejects transactions with `Transaction numbers are only allowed on a replica set member or mongos`. Don't reach for a plain `mongod` — use `backend/scripts/dev-mongo.sh`, which runs an isolated single-node replica set on port **27018** with its own data dir (`backend/.mongodb-data/`, gitignored), so it doesn't touch any other MongoDB instance on the machine. Point `.env`'s `MONGO_URI` at it with `?replicaSet=rs0` in the query string.
- **Port 5000 is often taken on macOS** by the AirPlay Receiver (ControlCenter). The default `.env.example` still says `PORT=5000`; if boot fails with `EADDRINUSE`, either disable AirPlay Receiver (System Settings → General → AirDrop & Handoff) or just use a different `PORT` in `.env`.
- `Organization.ownerId` is **not** `required` in the schema (unlike a first-draft version of this design) — `authController.signup` creates the org before the user exists, then backfills `ownerId` after. Keep it optional or signup breaks.
- **Issue status changes must go through `PATCH /api/issues/:id/move`, not the general `PATCH /api/issues/:id` update endpoint.** `issueController.updateIssue`'s allowed-fields list is `title/description/priority/assigneeId/dueDate/labels/sprintId/storyPoints/originalEstimateSeconds` — `statusId` is deliberately excluded, because status changes need `toPosition`/`fromStatusId` for board ordering and activity logging, which only the move endpoint handles. Move's body is `{ toStatusId, toPosition, fromStatusId, expectedVersion }` — these used to be `toStatus`/`fromStatus` enum strings before Phase 1's custom-workflow change; if you find old references to that shape anywhere, they're stale. `IssueForm`'s status `<select>` calls a separate `onStatusChange` prop (wired to `issueApi.move` in `IssueModal`), not the general `onSave` prop. If you add another status-changing UI control, wire it the same way.
- **Sprint dates must be full ISO datetime strings**, not bare `YYYY-MM-DD`. The backend's `createSprintSchema`/`updateSprintSchema` use Zod's `.datetime()`, which rejects a plain date. `BacklogPanel`'s `<input type="date">` values are converted with `new Date(x).toISOString()` before being sent — don't remove that conversion.
- **Attachment downloads/opens must go through `attachmentApi.openFile()`, not a plain `<a href>`.** `GET /api/attachments/file/:storageKey` requires a JWT (via the `auth` middleware, same as every other route), so a bare anchor tag navigation won't carry the Authorization header and will 401. `openFile()` fetches the URL through `axiosClient` (which does attach the token) as a blob and hands back a local `URL.createObjectURL()` link to open instead.
- **No user-lookup-by-email endpoint exists.** `ProjectMembers`' "add member" form takes a raw Mongo user id, not an email, despite Jira-like tools normally taking an email — there's nowhere to type a coworker's email and have it resolved. Adding that lookup (`GET /api/users?email=`) is a real gap if this app needs to be usable by non-technical users.
- The original design spec never included a way to create an Issue from the UI at all (only Projects and Sprints had create forms). `CreateIssueModal` + the "New Issue" button in `ProjectBoardPage` were added during scaffolding to close that gap — it's not in the original planning-conversation spec, so don't be surprised not to find it there.
- **`ProjectMember.userId` can be `null` after `.populate()`** if the referenced `User` document is gone (dangling reference — e.g. stale data, or a future hard-delete path). This isn't hypothetical: it crashed the whole board (blank white screen, uncaught `TypeError`) during redesign testing. `FilterBar`, `IssueCard`, `ProjectMembers`, and `WorkloadChart` all filter/guard on `m.userId` before touching `m.userId.name`/`._id` — keep that guard if you touch `members` data anywhere else.
- **`Issue.status` (fixed enum string) was replaced by `Issue.statusId` (ref to `WorkflowStatus`) in Phase 1.** This is a breaking schema change — a pre-Phase-1 database needs `backend/scripts/migrate-workflow-statuses.js` run once (or just drop the dev DB, since it's disposable per the dev-mongo.sh setup). Anywhere you see `issue.status` as a bare string in old code/notes, it's stale.
- **Express route ordering matters for `/api/issues/bulk`.** `issueRoutes.js` registers `PATCH/DELETE /bulk` *before* the `/:id` routes — if bulk routes were added after `/:id`, Express would match the literal segment `"bulk"` as `:id` and route bulk requests into the single-issue handlers instead. Keep that ordering if you touch this file.
- **`WorkflowStatus.color` is a fixed enum** (`slate`/`blue`/`emerald`/`amber`/`violet`/`rose`), not a free string, specifically so `lib/utils.js`'s `STATUS_DOT_CLASS`/`STATUS_BADGE_CLASS` maps can use static Tailwind class literals (dynamic `bg-${color}-500` template strings don't get picked up by Tailwind's build-time class scanner). Adding a new color means adding it to the enum in `WorkflowStatus.js` *and* both class maps in `lib/utils.js`.

## Coding conventions
- Controllers: every handler is `async (req, res, next) => { try {...} catch (err) { next(err) } }`; errors are thrown as `new ApiError(statusCode, message)` and handled centrally by `middleware/errorHandler.js`.
- Tenant scoping: controllers use `req.scope(filter)` (from `tenantScope` middleware) instead of raw Mongoose filters, so `organizationId` + `deletedAt: null` are never hand-rolled per query.
- Validation: Zod schemas per resource in `validation/*Schemas.js`, applied via a reusable `middleware/validate.js` in the route chain — not inline in controllers. Manual `if (!field) throw ...` checks are redundant once a route has `validate(schema)` and should not be added back.
- Route files mount `auth` + `tenantScope` once via `router.use(...)` at the top, then list endpoints.
- Sprint mutation routes keyed by sprint `id` (`start`/`complete`/`update`/`delete`) use `requireSprintProjectRole`, which stashes the looked-up sprint on `req.sprint` — controllers should read `req.sprint` instead of re-fetching it.
- Comment/attachment/worklog deletion is currently author/uploader-only (no project-admin override), because those routes don't run `requireProjectRole`/`requireSprintProjectRole` and so have no `req.projectRole` to check. Adding an admin override would mean resolving the project role via the issue's `projectId` first.
- Bulk mutation endpoints (`PATCH`/`DELETE /api/issues/bulk`) apply per-item, not as a single all-or-nothing operation — each item still gets its own optimistic-lock check, and the response's `{ succeeded, failed }` shape lets the frontend report partial failures rather than assuming success. Follow this pattern for any future bulk endpoint rather than wrapping the whole batch in one transaction.
- Frontend: API calls centralized in `api/*Api.js` modules (thin wrappers over an `axiosClient` with a request interceptor for the JWT and a response interceptor that redirects to `/login` on 401 — guarded to skip that redirect when already on `/login`, so a failed login attempt shows its error instead of bouncing) — components never call `axios` directly. Board drag-and-drop updates local state immediately, then reconciles with the server response; a `409` from stale `version` triggers a full refetch with a user-facing notice rather than a silent overwrite.
- Frontend uses Tailwind v4 via the `@tailwindcss/vite` plugin (`@import "tailwindcss";` in `index.css`), not a `tailwind.config.js` + PostCSS setup. `components/ui/` holds hand-written shadcn-style primitives (`badge.jsx`, `button.jsx`) rather than ones generated by the shadcn CLI — add more the same way (small component + `cn()` from `lib/utils.js`) rather than running `npx shadcn init`.
- Frontend design system: `lucide-react` for all icons (no other icon set). `fieldClass` from `lib/utils.js` on every text input/select/textarea for consistent focus rings/borders. `Button` from `components/ui/button.jsx` for anything clickable that isn't a plain text link — has `variant` (`primary`/`secondary`/`ghost`/`danger`) and `size` (`sm`/`md`) props plus a built-in `loading` spinner state. Modals/overlays use the `animate-fade-in` (backdrop) + `animate-scale-in` (panel) CSS classes from `index.css`; lists that populate async use `animate-slide-up` (optionally staggered via inline `animationDelay`). Loading states are skeleton blocks (`bg-slate-100 animate-pulse`), not spinners, for board/project grids.

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
