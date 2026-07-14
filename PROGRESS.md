# Progress Log

## Current status
Backend is scaffolded and verified working end-to-end (2026-07-14): signup/login, project + role creation, issue creation (incl. the transaction-based key generation), board move with optimistic locking (incl. a real 409 on stale version), sprint creation, comments, and the audit trail were all smoke-tested live against a real MongoDB and passed. Frontend has not been started.

## Done
- Initial commit with `.gitignore`.
- Full backend + frontend architecture designed: models, middleware, controllers, routes, services, sockets, and matching React components/pages for every module (auth, orgs, projects, project members/roles, issues incl. hierarchy, sprints, comments, attachments, activity/audit trail, analytics).
- Two known gaps identified during design and already resolved on paper: `requireSprintProjectRole` middleware (sprint routes need to resolve projectId via the sprint, not the URL) and Zod validation + rate limiting on auth routes.
- **Backend fully scaffolded**: all 9 models, all middleware (incl. `requireSprintProjectRole`, `validate`, `rateLimiters`), all Zod validation schemas, all services (`FileStorageInterface`/`LocalDiskStorage`, `notificationService`, `emailService` stub, `activityLogger`, `emailQueue`), all 6 controllers, all 6 route files, Socket.io wiring, `app.js`/`server.js`. `npm install` succeeds (489 packages; one unresolved high-severity transitive audit warning from `bcrypt`'s `node-pre-gyp` → `tar` dependency chain, install-time only, not on the request path — left as-is, revisit if `npm audit fix --force` has a safe path later).
- Backend smoke-tested live: `POST /api/auth/signup`, `/login`, `POST /api/projects` (+ Zod 400 on bad input), `POST /api/issues` (transaction-backed key generation → `ENG-1`), `PATCH /api/issues/:id/move` (version 0→1, then a stale-version retry correctly returned `409`), `POST /api/sprints`, `POST /api/issues/:id/comments`, `GET /api/issues/:id/activity`.
- Set up a project-local MongoDB dev instance (`backend/scripts/dev-mongo.sh`, single-node replica set on port 27018, isolated data dir) since transactions require a replica set and the user's global mongod is standalone — chosen over reconfiguring the global mongod so other local projects aren't affected. See CLAUDE.md "Known gotchas".

## Next up
- Frontend: scaffold Vite + Tailwind + shadcn/ui.
- Frontend: `AuthContext`/`SocketContext`, `axiosClient`, routing shell (`App.jsx`, `LoginPage`, `DashboardPage`).
- Frontend: Kanban `Board`/`BoardColumn`/`IssueCard` with `@hello-pangea/dnd` drag-and-drop, `IssueModal`/`IssueForm`/`CommentThread`/attachment panel.
- Frontend: `ProjectMembers` (role management UI), `BacklogPanel` (sprint start/complete, backlog-to-sprint assignment), `FilterBar`, `BurndownChart`/`WorkloadChart` (recharts).
- Backend polish (not blocking frontend work): automated tests (Jest + Supertest), pagination on `GET /api/issues`, project-admin override for comment/attachment deletion (see CLAUDE.md coding conventions note), Redis-backed rate limiting/job queue before multi-instance deployment.

## Decisions & notes
- Stack and every architectural decision below came out of a single planning conversation on 2026-07-14; the full file-by-file spec (every model/controller/route/component, with code) lives in that conversation's history, not in this repo yet. If a future session needs the exact frontend code rather than the summary in CLAUDE.md, ask the user to re-share or re-derive from the plan described here.
- **MongoDB must be a replica set** for the backend to fully work (transactions in issue creation) — see CLAUDE.md "Known gotchas" for the `dev-mongo.sh` setup. Don't assume a plain local `mongod` is sufficient.
- **Multi-tenant**: `organizationId` on every collection, auto-scoped via `req.scope()`. Never query a tenant-owned collection without it.
- **Per-project roles**: `admin`/`manager`/`developer`/`tester`, stored on `ProjectMember`, differ per project for the same user. Sprint-id-keyed routes need a project lookup via the sprint first (`requireSprintProjectRole`), not the plain `requireProjectRole`.
- **Issue hierarchy**: Epic → Story/Task/Bug → Subtask via `parentId`; subtasks can't nest further.
- **File storage**: local disk now, behind `FileStorageInterface` so S3 (or similar) is a drop-in swap later, not a rewrite.
- **Concurrency**: optimistic locking via `Issue.version` + `expectedVersion` on every mutating call; `409` on mismatch, client refetches.
- **Audit trail**: `IssueActivity` per field change, skips no-op changes.
- **Soft deletes** everywhere via `deletedAt`; `req.scope()` filters it out automatically. Deleting an issue cascades soft-delete to its subtasks.
- **Real-time**: Socket.io room per project board; broadcasts + async email queue on issue/comment/attachment changes.
