---
tags:
  - type/spec
  - status/draft
  - epic/18
  - exercise/19
---

# Epic 18 — n8n AI Support Widget + RAG Answer (M1)

> Upstream: [PRD 2.0](../prd-2.0.md) | [Design Guidelines](design-guidelines.md) | [DEPLOY-PORTFOLIO.md](../DEPLOY-PORTFOLIO.md) | [Brainstorming](18-n8n-ai-support-triage-brainstorming.md)
> Origin: reactivation of `dl-ai-expliq` Exercise 19. KB prompt + guardrail patterns reused from Exercise 22; agent-safety patterns from Exercise 20.
> Goal context: portfolio artifact for an n8n **Product Builder** application. M1 is the core vertical slice: a self-hosted n8n instance + a RAG workflow built via the n8n-MCP, answering questions in a live Expliq widget.
> This is **milestone 1 of a 3-epic split**: Epic 18 (this, core answer) -> [Epic 19 (agentic actions)](19-agentic-triage-actions.md) -> [Epic 20 (MCP server door)](20-n8n-mcp-server-door.md).
> Dependencies: no R2 data epics. Reuses Epic 12 design system + the `(app)` layout shell + the OpenRouter setup pattern from `src/lib/llm-pipeline.ts`.
> Branch: `feature/epic-18-n8n-support-triage`. Never commit to `main` until ready: `main` is Vercel auto-deploy production.

## Scope

A help/chat widget in Expliq's authenticated app lets a visitor ask a question. The message (plus short conversation history and page context) is sent server-side to a **self-hosted n8n workflow** that **answers the question for real**, grounded by **RAG** over a committed Expliq knowledge base (no hallucinated facts). The widget shows the grounded answer (synchronous round-trip, multi-turn).

M1 is **answer-only**: it classifies and answers, but takes **no external write actions** (those are Epic 19) and exposes **no MCP server door** (that is Epic 20).

Two tracks; Track 2 is a prerequisite for Track 1's end-to-end wiring (it produces the webhook URL + secret + the live RAG workflow).

### Safety model (the demo is public)

- The n8n workflow is **invisible to demo users**; they only see the widget.
- The client calls a same-origin **Server Action**; the **n8n webhook URL + shared secret live only server-side** (Server Action scope + Vercel env), never in the client bundle. Visitors cannot discover the n8n endpoint.
- A **best-effort rate limit** (per session/IP) + a length cap in the Server Action bound LLM cost. On Vercel serverless an in-memory counter does not persist across instances, so this is best-effort; a robust limit (Vercel KV / Upstash) is deferred. Acceptable for M1 because there are no external write actions yet, so the only exposure is LLM spend.

### Track 2 — n8n infrastructure + RAG answer workflow (prerequisite)

**Hosting (Hetzner VPS + Docker Compose + Caddy).** Publicly reachable n8n over HTTPS so Vercel prod can POST to its webhook. `WEBHOOK_URL` set to the public domain. Single instance. **Size for n8n + self-hosted Ollama embeddings: 4GB+ RAM recommended** (embedding models are light and run CPU-only, but need headroom alongside n8n; e.g. Hetzner CX22). The answer LLM stays on OpenRouter/Claude (not self-hosted on this box).

**n8n-MCP wiring (stdio transport).** Add `czlonkowski/n8n-mcp` to the committed `.mcp.json` (alongside `figma`) as a **stdio** server (`command` + `args` + `env` block). `N8N_API_URL` / `N8N_API_KEY` referenced as `${...}` in the `env` block (expansion works for stdio `env`, not HTTP headers), expanded from the shell env; real values in gitignored `.env`. No literal secret committed. Claude Code uses this MCP to build, validate, and export the workflows.

**The RAG answer workflow (built via MCP):**
```
Webhook (POST /expliq-support, header auth x-webhook-secret, respond: when last node finishes)
  -> AI step (Claude via OpenRouter, default anthropic/claude-sonnet-4) with a Vector Store retriever (RAG over the KB)
       • classifies into category (bug | feature-request | question | urgent)
       • composes a grounded, user-facing answer from retrieved context
  -> Respond to Webhook -> { category, reply }
```

**RAG layer:**
- **Vector store = Supabase PGVector** (reuse the project's existing Supabase Postgres; the pgvector table is created/managed by n8n's vector node, NOT via Prisma, so there is no Expliq schema migration). Setup notes: the `vector` extension must be enabled once on Supabase (`create extension vector`); the vectors live in the **same database as prod** (the dev+prod shared-DB gap), so keep them in their own table/namespace and never point n8n at Prisma-managed tables.
- **Embeddings = self-hosted Ollama on the Hetzner box** (e.g. `nomic-embed-text`, 768-dim, CPU-only), via n8n's Ollama embeddings node — keeps embeddings fully self-hosted (no third-party API), matching the n8n self-host story. **Fallback:** OpenAI `text-embedding-3-small` (a node swap, but it requires **re-indexing the KB** since vectors are not cross-model compatible). The vector-store column dimension must match the chosen model's output dimension.
- **Knowledge base = committed `n8n/knowledge/*.md`** (reuse the Exercise 22 structure: `expliq-features.md`, `faq.md`, `governance-signals.md`, `risk-levels.md`, plus n8n-support topics), split by heading.
- **Indexer = a small n8n workflow** (also built via MCP) that chunks + embeds the KB into the vector store; re-runnable.

**Prompt + guardrails (reuse Exercise 22 template, harden per Exercise 20):** system instruction states what the assistant can do; **answer ONLY from retrieved context + provided data**; explicit **"I don't have enough information"** fallback; **never invent** facts; concise answers. Category constrained to the enum.

**Reproducibility:** export `n8n/support-answer.workflow.json` + `n8n/support-indexer.workflow.json` (committed). A runbook `specs/18-n8n-ai-support-triage-runbook.md` documents host provisioning, n8n env, the build-time n8n-MCP (stdio) config, Supabase PGVector (`create extension vector`) + embeddings setup, and how to re-import + re-index.

### Track 1 — Expliq repo code

**Chat/support widget** (net-new client component `src/components/support-widget.tsx`, `"use client"`, mounted in the `(app)` layout so it appears on every authenticated page; styled per [design-guidelines.md](design-guidelines.md)):
- Floating launcher, bottom-right, >= 24x24px target, short text label, teal `#0d9488`, white icon.
- Opens a modal panel (prefer native `<dialog>` + `showModal()`, or `role="dialog"` + `aria-modal="true"` + `inert` background); white card, `rounded-xl shadow-sm`, Plus Jakarta Sans.
- **Multi-turn:** keeps message history in client state, includes it in each request.
- Message textarea + Send: Enter sends, Shift+Enter newline; Send is a focusable button with accessible name; **character counter near the 2000 limit**; Send disabled when empty/over-limit.
- **States:** idle -> sending (loading indicator) -> answered (renders grounded `reply` + optional `category` badge) -> error (plain-language + retry). Respect `prefers-reduced-motion`.
- **Focus:** moves to input on open, returns to launcher on close, trapped while open; Escape closes; focused control never obscured (WCAG 2.2).
- **Responsive:** full-screen panel under 768px.
- No webhook URL or secret in the client; the widget only calls the Server Action.

**Server Action** (`src/lib/actions/support.ts`, `"use server"`):
- `sendSupportMessage(input)` validates: trim, reject empty, **max 2000 chars**, enforces a **best-effort rate limit** (per session/IP).
- Fetches the user email via `prisma.user.findUnique({ where: { id: session.user.id }, select: { email: true } })` (email is not on the session).
- Attaches the hardcoded `x-webhook-secret` header with `N8N_SUPPORT_WEBHOOK_SECRET`, POSTs to `N8N_SUPPORT_WEBHOOK_URL`, **awaits**, parses JSON.
- Returns `{ success: true, category, reply }` or `{ error: string }`. Never throws. Graceful error when the env is unset or n8n is unreachable.

**Request payload (Expliq -> n8n):**
```json
{
  "message": "string (<=2000)",
  "history": [{ "role": "user | assistant", "content": "string" }],
  "context": { "pagePath": "/dashboard", "automationId": "string | null", "workspaceId": "string" },
  "user": { "email": "demo@example.com" },
  "timestamp": "ISO 8601"
}
```

**Response contract (n8n -> Expliq):** `{ "category": "bug | feature-request | question | urgent", "reply": "real, RAG-grounded answer" }`. (Epic 19 extends this with `actionsTaken[]` + `slackSummary`.)

**Config:**
- `.env.example` gains: `N8N_SUPPORT_WEBHOOK_URL`, `N8N_SUPPORT_WEBHOOK_SECRET` (header name hardcoded `x-webhook-secret`), and **local-only** MCP vars `N8N_API_URL`, `N8N_API_KEY`.
- Vercel prod env: `N8N_SUPPORT_WEBHOOK_URL` + `N8N_SUPPORT_WEBHOOK_SECRET` before merge.
- `DEPLOY-PORTFOLIO.md` updated: add the new app-level env vars; **correct** the doc's "N8N_* ... never at app-level" statement (the app-level support webhook is distinct from the per-user connector creds); add an outbound-integration touchpoint; correct the stale manual-deploy note.

### Phasing for delivery

- **Phase 0** (interactive ops): provision public n8n on Hetzner + wire the n8n-MCP (stdio) into `.mcp.json`.
- **Phase 1a** (RAG): author `n8n/knowledge/*.md`; build the indexer workflow via MCP; populate Supabase PGVector; build the answer workflow; verify retrieval + grounded answers.
- **Phase 2** (`/dev` slice): widget (multi-turn, a11y) + Server Action (validation, best-effort rate limit, email fetch) + `.env.example`; point at the live webhook.
- **Phase 3**: end-to-end test on a Vercel **preview** deploy.
- **Phase 4**: set Vercel prod env, merge to `main`, verify on production.

Phases 0 + 1a are interactive + MCP-driven (guided by the runbook), not autonomous `/dev` work. Phases 2 to 4 are a clean `/dev` slice. M1 done = a live "ask Expliq, get a grounded answer" widget.

## Acceptance Criteria

### A. Automated (Vitest, Track 1)
1. `sendSupportMessage` with valid input calls `fetch` once with the correct URL, the `x-webhook-secret` header, and the exact payload shape (message, history, context{pagePath, automationId|null, workspaceId}, user{email}, timestamp) — mocked global `fetch` (new `vi.stubGlobal` scaffold).
2. Empty/whitespace message -> `{ error }`, no fetch.
3. Message > 2000 chars -> `{ error }`, no fetch.
4. Exceeding the rate limit -> `{ error }`, no fetch.
5. Webhook env unset, or fetch rejects / non-OK -> `{ error }`, never throws.
6. Email is obtained via `prisma.user.findUnique` (mocked), not read off the session.
7. Widget render: launcher renders on `(app)`; opening shows the input panel; a mocked success renders `reply`; a mocked error renders the error state with retry.
8. Widget: Enter triggers send, Shift+Enter does not; Send disabled when empty or over 2000; character counter appears near the limit.

### B. Structural / inspection (Track 1)
9. Widget styled per design-guidelines (white card, `rounded-xl`, `shadow-sm`, Plus Jakarta Sans, teal accent).
10. Accessibility: native `<dialog>` or `role="dialog"`+`aria-modal`; focus moves to input on open and returns to launcher on close; focus trapped; Escape closes; Send has accessible name; launcher >= 24x24px.
11. Responsive: panel full-screen under 768px.
12. No secret in the client: `N8N_SUPPORT_WEBHOOK_URL` / `N8N_SUPPORT_WEBHOOK_SECRET` referenced only inside the `"use server"` action, never in any `"use client"` module (verifiable by grep).
13. The widget calls only the Server Action, never the n8n webhook directly.

### C. Manual / integration verification (Track 2 + end-to-end)
14. The self-hosted n8n instance is reachable over public HTTPS with a valid certificate; `WEBHOOK_URL` set to its domain.
15. `.mcp.json` contains `czlonkowski/n8n-mcp` as a **stdio** server with `N8N_API_URL` / `N8N_API_KEY` as `${...}` in the `env` block; no literal secret committed.
16. The Supabase PGVector store is populated by the indexer from `n8n/knowledge/*.md` (`vector` extension enabled); a retrieval query returns relevant chunks.
17. The answer + indexer workflows are exported to `n8n/support-answer.workflow.json` + `n8n/support-indexer.workflow.json` (committed).
18. Asking a question whose answer is in a known KB file returns a reply containing that specific fact; an out-of-scope question returns the exact "I don't have enough information" fallback (no hallucinated Expliq specifics).
19. The webhook requires the `x-webhook-secret` header (a request without it is rejected).
20. End-to-end on a Vercel **preview** deploy: sending a message returns the grounded `reply` in the widget.
21. The same flow works on production (`expliq-mvp.vercel.app`) after Phase 4 using the live demo session.
22. The runbook is sufficient to reproduce host + MCP + RAG setup from scratch.

### D. Deploy safety
23. All work lands on `feature/epic-18-n8n-support-triage`; nothing reaches `main` until Phases 0 to 3 pass on a preview.
24. `DEPLOY-PORTFOLIO.md` updated per the Config section (new env vars, corrected "never at app-level" line, touchpoint, corrected deploy note).

## Out of Scope

- **Agentic write actions** (GitHub issue / Linear ticket / Slack notify) — these are [Epic 19](19-agentic-triage-actions.md).
- **MCP Server Trigger door** (exposing the brain to AI agents) — [Epic 20](20-n8n-mcp-server-door.md).
- Persisting messages or conversation history in the Expliq DB (history is ephemeral client-side). No Prisma model, no schema migration.
- Turnstile / full bot protection (M1 ships best-effort rate limit + length cap).
- Robust KV-backed rate limiting (deferred; best-effort in-memory for now).
- n8n queue mode / scaling; demo-mode gating of the widget (always-on, writes nothing to the Expliq DB).
- Any change to the analysis pipeline, risk engine, or existing R2 screens.

## Domain Terms

| Term | Definition |
|------|-----------|
| **Outbound trigger** | A user action (Send) that issues a server-side `fetch()` POST to n8n, persisting nothing in Expliq. |
| **B-sync round-trip** | The widget awaits n8n's response and renders the answer, rather than fire-and-forget. Needs the webhook in "respond when last node finishes" mode. |
| **RAG** | Retrieval-Augmented Generation: retrieve KB chunks from a vector store and feed them to the LLM so answers are grounded, not hallucinated. |
| **PGVector** | Postgres vector extension; here on the project's existing Supabase, used by n8n's vector node. |
| **n8n-MCP** | `czlonkowski/n8n-mcp`: a build-time MCP server (stdio) that lets Claude Code create/validate/export n8n workflows via the n8n REST API. |
| **Grounding** | Constraining the LLM to answer only from retrieved context + provided data, with an explicit "I don't know" fallback. |

## Open Questions

1. ~~Embeddings provider~~ **Decided: self-hosted Ollama** (e.g. `nomic-embed-text`, 768-dim) for the fully-self-hosted story; OpenAI `text-embedding-3-small` kept as a fast fallback (node swap + KB re-index). Residual (Phase 0): confirm the exact Ollama model + that the box has RAM headroom (4GB+).
2. **n8n subdomain** for Phase 0 (host HTTPS domain).
3. **Knowledge-base content:** what goes into `n8n/knowledge/*.md` for v1, and who authors it.
4. **Rate-limit backing store:** best-effort in-memory (acceptable for M1) vs Vercel KV / Upstash; thresholds.
5. **Multi-turn history cap:** how many prior turns to send (e.g. last 6).

---

## Related

- [Epic 19 — Agentic Triage Actions (M2)](19-agentic-triage-actions.md) | [Epic 20 — n8n MCP Server Door (M3)](20-n8n-mcp-server-door.md)
- [Epic 12: Design System](12-design-system.md) — theme, fonts, the `(app)` shell.
- [DEPLOY-PORTFOLIO.md](../DEPLOY-PORTFOLIO.md) — live demo constraints; updated by this epic.
- [Brainstorming](18-n8n-ai-support-triage-brainstorming.md) — Rounds 1 to 9 decisions and rationale.
- `dl-ai-expliq/exercise_19/` (origin task), `exercise_22/` (KB + guardrail patterns), `exercise_20/` (agent safety).
