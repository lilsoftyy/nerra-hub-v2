# Nerra Hub — Execution Design

**Date:** 2026-04-08
**Author:** Claude Code (Opus 4.6) + Magnus Skarpaas Andersen
**Source spec:** `teknisk-spesifikasjon-nerra-hub-v1_7-FROZEN.md`
**Status:** Approved

---

## 1. What this document is

The technical specification (v1.7 FROZEN) defines _what_ to build. This document defines _how_ we execute it using Claude Code with superpowers.

The spec is comprehensive: 25 database tables, 6 build phases, agent auth system, proposal execution framework, 5+ external integrations, and a monorepo with 4 packages. This document turns that into a repeatable build process.

---

## 2. Key decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Development tool | Claude Code (not Modal dev agent) | Already available, more capable than Slack-based agent. Fase 0a skipped. |
| Build approach | Phase-by-phase, sequential (Approach A) | Matches spec decomposition. Each phase = deployable system. Parallelism within phases, not across. |
| Domain | Free Vercel domain initially | Custom domain later |
| Supabase | Existing account, new project in EU-Frankfurt | MCP connection available |
| GitHub | Magnus's personal account | No org needed yet |
| Modal | Starter Plan (Modus B, no IP allowlist) | Upgrade when needed |
| API billing | NOT set up yet | Blocks Modal agents. Hub building proceeds without it. |
| Slack integration | Deferred | Martin needs it later to direct agents. Not needed for initial build. |

---

## 3. Phase execution model

Each phase follows this cycle:

```
Spec section → Implementation plan → Parallel agents (worktrees) → Code review → Merge → Verify → Next phase
```

### 3.1 Per-phase workflow

1. **New Claude Code session** — fresh context, no carryover from previous phase
2. **Read spec + this doc + CLAUDE.md** — agents pick up all conventions automatically
3. **Create implementation plan** — `writing-plans` skill breaks the phase into independent tasks
4. **Dispatch parallel agents** — `dispatching-parallel-agents` skill, each in its own worktree
5. **Code review** — `code-reviewer` agent checks against spec and plan
6. **Verification** — `verification-before-completion` skill, plus Magnus tests manually
7. **Merge to main** — deployable system after each phase

### 3.2 Context hygiene

- Each phase is a new conversation. Plans and spec carry context, not chat history.
- CLAUDE.md in the repo root captures project conventions for all future sessions.
- Design docs live in `docs/` and are read by agents as needed.
- Memory files (in `.claude/projects/`) persist learnings across sessions.

### 3.3 Parallelism within phases

Tasks within a phase are categorized:
- **Independent** — can run in parallel worktrees (e.g., DB migrations + UI scaffolding)
- **Sequential** — depend on prior task output (e.g., API routes depend on DB schema)

The implementation plan for each phase explicitly marks dependencies.

---

## 4. Phase plan (adapted from spec section 12)

### Phase 0b — Hub Foundation (first)

**Goal:** Empty Hub shell deployed to Vercel. Magnus and Martin can log in and see a blank page.

**Deliverables:**
- Git repo initialized with pnpm workspace + Turbo
- `apps/hub` — Next.js 15 App Router + shadcn/ui + Tailwind 4
- `apps/qualification-form` — empty placeholder
- `packages/db` — empty, Supabase types placeholder
- `packages/agents-sdk` — empty placeholder
- `packages/ui` — shared UI components placeholder
- `packages/config` — shared ESLint, TypeScript, Tailwind config
- Supabase project created (EU-Frankfurt) with Google OAuth + email whitelist
- Auth working: only @nerra.com emails can log in
- `/api/health` endpoint
- Vercel deployment from `main`
- Sentry connected (eu.sentry.io)
- CLAUDE.md with project conventions
- CI pipeline: lint + typecheck (GitHub Actions)

**Parallel tasks:** ~3 agents
- Agent 1: Monorepo scaffold (pnpm, turbo, packages, config)
- Agent 2: Next.js app + auth + Supabase setup
- Agent 3: Vercel deploy + Sentry + CI

### Phase 1 — Customers without agents

**Goal:** Manual CRM. Create customers, change phases, track activity.

**Deliverables:**
- DB migrations: companies, contacts, customer_dwa_details, customer_economy, phase_checklist_items, activity_log, security tables
- Customer list page with search and filter
- Customer profile with all fields, manual phase change, per-phase checklist
- Manual customer creation
- Activity log showing who changed what
- Triggers: closed_at, soft delete helpers
- RLS policies (Mal A for customer tables, Mal C for security tables)

### Phase 2 — Tasks, dashboard, agent foundation

**Goal:** Daily operations + first agent-to-Hub loop.

**Deliverables:**
- Tasks table + full task module
- Dashboard: my tasks, today, customer pipeline, activity feed
- Proposals table + approval queue UI
- Proposal execution framework (section 6.5)
- Phase transition handler with optimistic locking
- Agent API: auth endpoints + core CRUD endpoints
- `packages/agents-sdk` with Zod schemas, NerraHubClient, token handling
- Rate limiting (Postgres-based for auth, in-memory for API)
- Contract tests: Zod schemas match actual database

### Phase 3 — Integrations

**Goal:** Hub connects to the outside world.

**Deliverables:**
- Slack bot + customer creation via command + approval buttons
- Gmail OAuth + Pub/Sub + emails table + Inbox page
- Tripletex polling + customer economy sync + dashboard numbers
- Google Calendar event creation (two-phase pattern)
- Fireflies webhook + meetings table
- Agent runs + agent queue with job locking + agent status page
- System alerts with red banners
- Realtime channels for live updates

### Phase 4 — Customer journey and documents

**Goal:** Full customer flow from lead to signed contract.

**Deliverables:**
- Qualification form (separate Next.js app with HMAC-signed URLs)
- Research agent document generation
- Customer reports (3 levels)
- Welcome Package generation
- Contract generation (PDF)
- Public contract view via signed URL
- GDPR: export per customer, delete per customer, purge cron job

### Phase 5 — Self-improving system

**Goal:** Hub extends itself.

**Deliverables:**
- Bug investigation agent
- DWA bug handling flow
- Security agent in QA flow
- Search agent (natural language via Slack)
- Course mentor agent (Agent 9)
- Modal Proxies evaluation (if upgrading to Team Plan)

---

## 5. Conventions (to be mirrored in CLAUDE.md)

From spec section 7.2:
- **Files:** kebab-case (`customer-card.tsx`)
- **Components:** PascalCase (`CustomerCard`)
- **Hooks:** camelCase with `use` prefix (`useCompany`)
- **Server actions:** camelCase with verb prefix (`updateCompanyPhase`)
- **Database tables:** snake_case
- **API routes:** kebab-case
- **UI language:** Norwegian
- **Code language:** English
- **TypeScript:** strict mode, no `any` without comment
- **Database IDs:** UUID v7, generated app-side
- **Soft delete:** via `deleted_at`, always use helper functions

From spec section 2:
- **Two DB clients:** Supabase JS for CRUD/Realtime/Auth, `postgres` (porsager) for transactions/locking
- **Service role:** only in `lib/supabase/service.ts`, only imported from api/agent/**, api/webhooks/**, api/cron/**, api/agent-auth/**
- **ESLint rule:** blocks service.ts import from other locations

---

## 6. What Magnus does

Magnus is non-technical. His role during build:
1. **Approve plans** before each phase starts
2. **Test the result** after each phase (log in, click around, verify it works)
3. **Flag problems** if something looks wrong
4. **Set up external accounts** that require manual action (Supabase project, Vercel linking, API keys)

Claude Code handles all code, architecture, testing, and deployment.
