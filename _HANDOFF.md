---
tags:
  - type/handoff
  - status/ephemeral
---

# Handoff: Epic 18 Phase 1a — build the answer workflow (1a.4)

**Generated**: 2026-05-25 · **Branch**: feature/epic-18-n8n-support-triage · **Status**: Ready for next session

## Goal

Build Epic 18 Phase 1a (RAG) for the n8n AI support widget: a self-hosted n8n workflow that answers user questions about **Expliq's output over the user's own n8n data**, grounded in a committed KB. Portfolio piece for an n8n Product Builder application. The indexer (write side) is done; next is the answer workflow (read side).

## Current State

- **Phase 0** (n8n box + Ollama + n8n-MCP): DONE, verified. Box live `https://178-105-184-130.sslip.io`.
- **1a.1 pgvector**: DONE — dedicated **2nd** Supabase project `expliq-rag` (NOT prod), `RAG_DATABASE_URL` in gitignored `.env`, pgvector 0.8.0.
- **1a.2 KB**: DONE — `n8n/knowledge/*.md` (5 files) committed `cb0671b`. Scope locked in brainstorming **Round 10**.
- **1a.3 indexer**: DONE — n8n workflow **"Expliq Support — KB Indexer"** (id `4VrcoPI5SmmEPheH`, manual, inactive). Idempotent (clear-table node), per-heading chunking (Code node), 6 doc sticky-notes. Verified: **34 distinct chunks, 768-dim, no duplicates**. Exported + committed `314056a` → `n8n/support-indexer.workflow.json`.
- **n8n box creds**: Postgres `ru7V4Tzqrw6ZSvSf`, Ollama `SijHtsthwmtboAFE`. Vector table `expliq_kb_vectors`.
- **n8n-MCP**: connected. If it drops mid-session, type `/mcp` → reconnect (no full restart).
- Build decisions/deviations recorded in `specs/18-n8n-ai-support-triage-results.md` (D1–D5).

## Key Decisions

| Decision | Rationale |
|----------|-----------|
| (D1–D5) | See `specs/18-...-results.md` — don't re-derive. RAG store off prod DB; KB via GitHub Contents API; per-heading Code node; Supabase pooler `allowUnauthorizedCerts`; indexer in n8n for compat + portfolio. |
| Impl detail → repo results file, NOT memory | Per user: keep auto-memory lean; build log lives in `specs/18-...-results.md`. |
| Run manual workflows via n8n UI "Execute"; verify via direct pgvector query | n8n_test_workflow can't fire manual triggers. |

## Open Questions / Pending

- **1a.4 design choices** to confirm before building: LLM model (spec default `anthropic/claude-sonnet-4` via OpenRouter; `OPENROUTER_API_KEY`/`OPENROUTER_MODEL` in `.env`); category enum (`bug | feature-request | question | urgent`); generate `N8N_SUPPORT_WEBHOOK_SECRET` (needed by the Phase-2 Server Action too).
- Parked, NOT epic-18 (decide separately): `stash@{0}`, `scripts/research-spike-v9-*.ts`, `research/*.md`, `specs/patches/bootcamp-analysis-*`, `specs/research-spike-results/v9/`.
- Minor: pgvector `metadata.source` is loader-default "blob"; chunk attribution is in the in-text title prefix (fine).

## Next Step

Build **1a.4 — the answer workflow** in n8n via the MCP: `Webhook (POST /expliq-support, x-webhook-secret) → pgvector retriever (Ollama-embedded query over expliq_kb_vectors) → Claude via OpenRouter (classify + grounded answer, "I don't have enough information" fallback, never invent) → Respond to Webhook → { category, reply }`. **First** verify the needed nodes via the n8n-MCP (`get_node`: OpenRouter chat model, retrieval QA chain / agent, structured output parser, webhook, respondToWebhook), then present the plan + the 3 open decisions above before building. Reuse the existing Ollama + Postgres credentials.

## References

- **Spec**: `specs/18-n8n-ai-support-triage.md` (Track-2 answer workflow + acceptance) · **Runbook**: `specs/18-n8n-ai-support-triage-runbook.md` §1a.4–1a.5
- **Results**: `specs/18-n8n-ai-support-triage-results.md` (D1–D5, indexer architecture, known gaps)
- **Brainstorming Round 10**: KB scope (Expliq-output domain; generic n8n help out of scope)
- **Memory**: `project_epic18_infra` (box + `/mcp` reconnect), `feedback_no_shortcuts_cleanest_solution`, `feedback_selective_commits` (never `git add .`)
- **Recent commits**: `314056a` (indexer+export+results), `cb0671b` (KB+scope), `a7f459c` (.mcp.json global)
