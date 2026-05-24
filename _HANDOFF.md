---
tags:
  - type/handoff
  - status/ephemeral
---

# Handoff: Epic 18/19/20 — n8n AI Support Triage (planning complete, build next)

**Generated**: 2026-05-24  ·  **Branch**: main (build work belongs on `feature/epic-18-n8n-support-triage`)  ·  **Status**: Ready for next session

## Goal

Portfolio artifact for an **n8n Product Builder** application (deadline ~1 week). A chat/support widget in Expliq's live demo → self-hosted n8n → **RAG-grounded answer** (M1), with **agentic sandbox actions** (M2) and an **MCP Server door** for Claude Desktop/Code (M3) as additive milestones. Ship M1 first; it is a complete, demoable piece on its own.

## Current State

- **Specs complete + refined, no code yet.** Spec family: `specs/18-n8n-ai-support-triage.md` (M1 RAG answer), `specs/19-agentic-triage-actions.md` (M2), `specs/20-n8n-mcp-server-door.md` (M3). Each has a brainstorming file; shared decision history (Rounds 1-9) is in `specs/18-...-brainstorming.md`.
- **Runbook written:** `specs/18-n8n-ai-support-triage-runbook.md` — Phase 0 + 1a step-by-step (Hetzner + Ollama + n8n + MCP + pgvector + KB + indexer + answer workflow).
- **Refinement done this session:** `/refine` ×2 on Epic 18, `/refine_all_ind` (pass 11), `/refine_all` (2026-05-24). No open `NEEDS CONFIRMATION`.
- **Not started:** no Hetzner box, no n8n instance, no `n8n/` dir, no `support-widget.tsx`/`actions/support.ts`, no feature branch.
- **Working tree:** this session's spec/doc files are **committed** (Epic 18/19/20 specs + brainstorming + runbook + review passes + this handoff). ~128 pre-existing items remain uncommitted on `main` (screenshots, `.claude/projects/`, `.playwright-mcp/`, deleted `scripts/seed-r2-data.ts`, settings) — left untouched.

## Key Decisions

| Decision | Rationale |
|----------|-----------|
| Split one mega-epic into 18 (M1) / 19 (M2) / 20 (M3) | Each independently demoable; M1 is the deadline MVP |
| RAG lives in Epic 18; 19/20 reuse it | "Ask Expliq, get grounded answer" is the M1 vertical |
| Embeddings = self-hosted Ollama (`nomic-embed-text`, 768-dim) | Full self-host story for n8n; OpenAI `text-embedding-3-small` is the fallback (swap needs KB re-index) |
| Vector store = Supabase PGVector (n8n-managed table) | Reuse existing DB; no Prisma model / no migration |
| Hosting = Hetzner CX22 (4GB+) + Docker Compose + Caddy | Public HTTPS for the webhook; answer LLM stays Claude/OpenRouter |
| n8n-MCP = stdio in `.mcp.json` with `${ENV}` | HTTP-header env expansion is buggy; stdio `env` works; no committed secret |
| Outbound = Server Action (secret server-side); widget B-sync + multi-turn | Webhook URL/secret never in client; agentic writes (M2) hit **sandboxes only** |
| `main` = Vercel auto-deploy prod | Never push WIP to main; build on `feature/epic-18-n8n-support-triage`, test on preview |

## Open Questions / Pending

- Provision Hetzner box + subdomain `n8n.<domain>` (not done).
- M2 sandbox prereqs: throwaway GitHub repo, test Linear board, Slack workspace + private channel + tokens.
- Confirm exact Ollama model + box RAM headroom during Phase 0.
- Rate limit is best-effort in-memory (serverless caveat); KV/Upstash deferred.
- ~128 pre-existing uncommitted items remain on `main` (screenshots / session-data / settings) — Per to handle separately if desired.

## Next Step

Start **Phase 0** from the runbook: create the Hetzner CX22 + point `n8n.<domain>` DNS at it, then bring up Docker Compose (n8n + Caddy + Ollama) per `specs/18-n8n-ai-support-triage-runbook.md` §0.1-0.3. Per runs the console steps; Claude guides + fills the runbook gaps. (This is interactive ops, NOT a `/dev` run — `/dev` comes at Phase 2.)

## References

- **Specs**: `specs/18-n8n-ai-support-triage.md` (+ `-runbook.md`, `-brainstorming.md`), `specs/19-agentic-triage-actions.md`, `specs/20-n8n-mcp-server-door.md`
- **Reviews**: `specs/ind-epic-review.md` (pass 11), `specs/cross-epic-review.md` (2026-05-24 pass)
- **Memory**: `project-epic18-n8n-triage`, `project-deploy-topology` (main = auto-deploy prod)
- **Origin**: `dl-ai-expliq/exercise_19` (task), `exercise_22` (KB+guardrails), `exercise_20` (agent safety)
- **External**: github.com/czlonkowski/n8n-mcp · docs.n8n.io/hosting/installation/server-setups/hetzner
