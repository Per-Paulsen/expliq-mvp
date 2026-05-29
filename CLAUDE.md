# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

> **Live:** Portfolio-deploy at https://expliq-mvp.vercel.app — pre-seeded demo (`demo@example.com` / `demo`) with daily 03:00 UTC reset. **Read `DEPLOY-PORTFOLIO.md` before changes that affect login / landing / middleware / cron / seed.** The demo pattern is mirrored in apiq-mvp.

## Deploy & Branch Discipline

**`main` IS production.** Vercel auto-deploys production from `main` via the
GitHub integration: every push/merge to `main` goes live at
`https://expliq-mvp.vercel.app` immediately. Only git-tracked files on `main`
ship. Feature branches auto-deploy to isolated **preview** URLs only.

- **Never push work-in-progress to `main`.** Build features (e.g. Epics 18-20)
  on a feature branch, validate on its Vercel preview, merge to `main` only when
  demo-mode-safe. Follow the **pre-merge checklist** in `DEPLOY-PORTFOLIO.md`
  (preview verified, prod env vars set first, DB migration planned, demo-mode
  preserved, CI green).
- **Never `git add .`.** Local dev artifacts (`screenshots/`, `.playwright-mcp/`,
  `.claude/projects/`, `.claude/settings.local.json`) are gitignored; stage
  feature files by path only.
- The live demo must not change except by an intentional, checklist-cleared
  merge to `main`.

## Commands

```bash
npm run dev          # Start dev server (Turbopack)
npm run build        # Production build
npm run lint         # ESLint (flat config)
npm run test         # Vitest (single run)
npm run test:watch   # Vitest (watch mode)
npx prisma migrate dev --name <name>  # Run database migration
npx prisma generate  # Regenerate Prisma client
```

Run a single test file: `npx vitest run src/__tests__/home.test.tsx`

## Architecture

**Next.js App Router** with `src/` directory. Route groups split layout concerns:
- `src/app/(app)/` — protected pages with sidebar (`SidebarProvider` + `AppSidebar` + `SidebarInset`)
- `src/app/(auth)/` — login/signup pages, centered layout, no sidebar
- `src/app/api/` — API route handlers

**R2 Routes (being built):** `/` (Dashboard), `/processes` (Process Map), `/opportunities` (Opportunities), `/automations/[id]` (Detail), `/settings`, `/login`, `/signup`

**R1 Routes (being replaced):** `/` was Workspace Snapshot, `/automations` was Portfolio — these are replaced by Epics 12-16.

**Auth:** Auth.js v5 (next-auth) with Credentials provider and JWT sessions. Config split:
- `src/lib/auth.config.ts` — lightweight, Edge-safe (route protection only, no DB imports)
- `src/lib/auth.ts` — full config with PrismaAdapter, Credentials provider, bcrypt
- `src/middleware.ts` — imports only `auth.config.ts` (Edge Runtime)
- `src/lib/session.ts` — `getRequiredSession()` returns session with `user.id` and `user.workspaceId`

**Database:** Prisma 7 with Supabase PostgreSQL. Schema at `prisma/schema.prisma`, datasource at `prisma.config.ts`. Generated client at `src/generated/prisma/`. **Import from `@/generated/prisma/client`** (not `@/generated/prisma`). Runtime client requires driver adapter: `new PrismaClient({ adapter: new PrismaPg({ connectionString }) })`. Singleton at `src/lib/prisma.ts`.

**Models:**
- Core: Workspace, User (passwordHash), ConnectorConfig (n8n credentials, selectedTags, discoveryData)
- R2 analysis: Automation (LLM fields + execution stats), BusinessProcess (steps, maturity, valueAtStake), Recommendation (tiers, deploy), ProcessSuggestion, CompanyProfile (landscape, nextMove, delta)
- Auth.js: Account, Session, VerificationToken
- All application models scoped by `workspaceId`

**Key modules:**
- `src/lib/llm-pipeline.ts` — v8 two-call LLM architecture: `analyzeAutomation()` (parallel) + `analyzeWorkspace()` (single). OpenRouter via OpenAI SDK, lazy-initialized client.
- `src/lib/risk-engine.ts` — `computeGovernanceDot()` pure function: healthy/attention/critical from errorRate, impact, detectability, active status. R1 stubs preserved until R1 pages replaced.
- `src/lib/connected-automations.ts` — deterministic (errorWorkflow, callerIds) + LLM connection merge
- `src/lib/delta-generation.ts` — `captureSnapshot()` + `generateDeltaSummary()` for re-sync banners
- `src/lib/actions/analysis.ts` — `runAnalysisPipeline(workspaceId)` orchestration (20-step flow)
- `src/lib/actions/connector.ts` — two-phase sync: verifyAndDiscover (Phase 1) + syncAndAnalyze (Phase 2, calls analysis pipeline)
- `src/lib/execution-stats.ts` — `computeExecutionStats()` for runsPerWeek, errorRate, etc.
- `src/lib/n8n-client.ts` — n8n API client (10 methods including deploy)
- `src/lib/encryption.ts` — AES-256-GCM for API key storage

**Components:** shadcn/ui primitives in `src/components/ui/`, custom components in `src/components/`. Use `cn()` from `src/lib/utils.ts` for className merging.

## Key Conventions

- **Dynamic route params are async** (Next.js 15+): `{ params }: { params: Promise<{ id: string }> }` — must `await params`
- **shadcn/ui sidebar** uses `render` prop pattern (not `asChild`), `SidebarProvider` in `(app)/layout.tsx`
- **Tailwind v4**: CSS-first config via `src/app/globals.css`, not `tailwind.config.ts`
- **Path alias**: `@/*` maps to `src/*`
- **Prisma 7**: Datasource in `prisma.config.ts` with `dotenv`. Import from `@/generated/prisma/client`.
- **Prisma client**: Always use singleton from `@/lib/prisma` — never instantiate directly
- **Auth in server components**: Use `getRequiredSession()` from `@/lib/session`
- **New protected pages** go in `src/app/(app)/`, auth pages in `src/app/(auth)/`
- **Vitest**: jsdom environment, globals enabled, `@/generated/prisma/client` alias in `vitest.config.ts`
- **OpenRouter**: Lazy-init client (not module scope). Model via `OPENROUTER_MODEL` env (default: `anthropic/claude-sonnet-4`). JSON fence stripping on all responses.
- **Server actions**: `"use server"`, call `getRequiredSession()` first, return `{ success } | { error }` — never throw to client
- **LLM prompts**: Simple prompts + full data. No rubrics, no methods. Output schema IS the instruction (v8 architecture).
- **Json fields**: Write with `as Prisma.InputJsonValue`, read with type narrowing

## Specs & Epics

**PRD:** [`prd-2.0.md`](prd-2.0.md) — Automation Intelligence platform (4 screens: Dashboard, Process Map, Opportunities, Detail).

**Detailed decisions:** [`prd-2.0-decisions.md`](prd-2.0-decisions.md) — 16 sections + Amendments A-T covering screens, schema, LLM architecture, design system, navigation map, recommendation framework.

**Design system:** [`specs/design-guidelines.md`](specs/design-guidelines.md) — authoritative for ALL visual decisions. Light theme, Plus Jakarta Sans font, card component system, page layouts, sidebar, auth pages. Overrides PRD §15 dark theme per Amendment T. Read this file before implementing any UI.

**Research spike:** [`specs/research-spike.md`](specs/research-spike.md) — v1-v8 prompt testing results. v8 is canonical.

**n8n API reference:** [`n8n-api-examples/README.md`](n8n-api-examples/README.md) — API schemas and real response examples.

**Epic specs:** `specs/[0-9][0-9]-*.md` — see [Map of Content](_MOC.md) for full index.
- Epics 01-08: R1 MVP (completed)
- Epic 09: Production hardening (deferred — absorbed by R2 page epics + Epic 17)
- Epic 10: Schema + extended sync (completed)
- Epic 11: LLM Pipeline V2 (completed)
- Epics 12-17: R2 screens + polish (pending)
- **Epics 18-20: n8n Agentic Support Stack (done + live)** — portfolio artifact for an n8n Product Builder application. Self-hosted n8n on Hetzner (Docker + Caddy + sslip.io TLS) serves the Expliq support widget via **two front doors** to one shared "support brain":
  - **Door 1 (widget webhook):** the Expliq help widget calls a private n8n webhook via a Next.js Server Action (URL + secret server-side only, never in the client bundle). Started in Epic 18 as RAG-only; became an AI Agent in Epic 19.
  - **Door 2 (MCP Server, Epic 20):** native n8n MCP Server Trigger with bearer auth, exposed to AI clients (Claude Desktop / Claude Code).
  - **Two reusable sub-workflows behind both doors:** `answer_expliq_question` (READ, RAG-grounded answer over `n8n/knowledge/*.md` → Supabase pgvector with Ollama `nomic-embed-text` embeddings on the n8n box) and `file_support_request` (WRITE, AI Agent on Claude Sonnet via OpenRouter that classifies + acts: `bug` → GitHub sandbox issue, `feature-request` → Linear ticket, `urgent` → Slack alert, `question` → RAG-only; always a Slack audit summary). WRITE response contract: `{ category, reply, actionsTaken[], slackSummary }`.
  - **Spec files:** `specs/18-n8n-ai-support-triage*.md` (M1) + `specs/19-agentic-triage-actions*.md` (M2) + `specs/20-n8n-mcp-server-door*.md` (M3) — each with spec, brainstorming, results, and runbook where applicable.
  - **App-side env keys:** `N8N_SUPPORT_WEBHOOK_URL`, `N8N_SUPPORT_WEBHOOK_SECRET` (`.env` + Vercel prod). Operational URLs / workflow IDs / sandbox targets live outside the repo (not committed).

**Results files:** `specs/*-results.md` — decisions, deviations, risks from completed epics. Read these before implementing dependent specs.

**Review files:** `specs/ind-epic-review.md` (within-epic), `specs/cross-epic-review.md` (cross-epic consistency).

## Workflow Rules

- **Do not modify spec files.** If unclear, ask.
- **Do not go beyond the spec.** Only build what the spec defines.
- **All discussions happen in markdown files**, not chat. Chat is for status updates only.
- **Commit format**: `feat: implement epic {number} — {name}`
