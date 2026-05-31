---
tags:
  - type/handoff
  - status/ephemeral
---

# Handoff: n8n support stack — strategic research session (showcase direction set)

**Generated**: 2026-05-30 18:40  ·  **Branch**: `main`  ·  **Status**: Ready for next session

## Repo Snapshot

> Script-collected (Step 2a). Source of truth, do not paraphrase.

- **Branch**: `main` (ahead 0, behind 0 of `origin/main`) — before this handover's commits
- **HEAD**: `0e556c2` — docs: session handover (2026-05-30 00:11)
- **Working tree**: 4 untracked, 1 modified, 0 staged
- **Stash**: 1 entry (old: "session wip: specs/env/seed parked for epic-18 switch")
- **Uncommitted paths**:
  - Memory: —
  - Skills: —
  - Config: —
  - Docs: `_TODO.md` (modified); `specs/patches/ai-trust-showcase-plan.md`, `specs/patches/expliq-core-mcp-vision-brainstorming.md`, `specs/patches/formatter-deterministic-brainstorming.md`, `specs/patches/local-agentic-multiagent-vision-brainstorming.md` (untracked)
  - Code/WIP: —
  - Suspicious: —
  - Other: —

## Goal

Decide the strongest, application-relevant direction for evolving the live n8n agentic support stack, for an n8n AI Product Builder showcase. This was a research + decision session (no build yet); 4 /explore runs produced 5 research files in the Dev `_resources/`.

## Current State

- **Direction set (AI-Trust showcase):** keep the existing SINGLE-agent + tools architecture; Claude stays the prod agent core. Headline = the "AI Trust" layer (evals + observability + guardrails). Plan: `specs/patches/ai-trust-showcase-plan.md` (5 phases + ops section, infra-elastic, self-hosted Langfuse, golden-dataset eval as the core must-have).
- **Deliberately rejected** (with reasons, documented): multi-agent for triage (sequential = single-agent is senior; parked as a separate future learning project), local-LLM as prod core (kept only as optional eval-comparison candidate + local guardrail checks).
- **Box fact corrected:** Hetzner cx23 = 2 vCPU / 4 GB (not 8 GB). n8n 2.56.0. Native Evaluation + Guardrails nodes confirmed present. Self-hosted Langfuse / a 32B need a bigger/separate box (infra is elastic).
- **MCP clarified:** MCP = integration layer, NOT orchestrator; the composition demo is emergent agent orchestration (no gateway needed at 3 servers). The valuable "ask about MY governance data" agent belongs on a future **Expliq-Core MCP / in-app data agent**, NOT the support door (security: lethal trifecta). Securely buildable via auth-scoped tools + RLS backstop; in-app-agent first, MCP later; keep the UI (not MCP-only).
- **5 research files written** to `C:\Users\perpa\Dev\_resources\` (all in `_research-index.md`): local-llm-hosting, multi-agent-orchestration, ai-trust-evals-observability-guardrails, mcp-gateways-orchestration, mcp-enterprise-practice-vs-hype, secure-per-workspace-agent-data-access, plus self-hosting-founder-stack reference.

## Key Decisions

| Decision | Rationale |
|----------|-----------|
| AI-Trust (evals/observability/guardrails) is the showcase, not multi-agent/local | Matches the role's "AI Trust" workstream + eval must-have verbatim; single-agent is the senior choice for sequential triage |
| Claude stays prod core; local LLM only as eval-comparison candidate | Local for the agentic core is fragile + marginal; local's real value is a data-backed comparison + local guardrail checks |
| Governance-data agent = future Expliq-Core MCP / in-app, not the support door | Different domain + sensitivity; avoids combining private data + untrusted input + outward action on one server |
| Keep the UI; add MCP additively (not MCP-only) | Expliq's value is visual/auditable; consensus is UI + API + MCP, not replacement |

## Open Questions / Pending

- **⚠️ SECURITY TODO (carried over from prior handover, STILL OPEN, untouched this session): rotate 7 leaked Surface-3 secrets** — `HCLOUD_TOKEN`, `RAG_DATABASE_URL`, `GITHUB_SANDBOX_PAT`, `LINEAR_API_KEY`, `SLACK_BOT_TOKEN`, `SLACK_OAUTH_CLIENT_ID/SECRET`. Do NOT rotate `N8N_ENCRYPTION_KEY`. Runbook: private repo `_resources/surface3-n8n-box-plan-2026-05-28.md`.
- AI-Trust showcase is planned but NOT built. First build step would be Phase 1 (deterministic formatter, `specs/patches/formatter-deterministic-brainstorming.md`).
- Tracing backend choice for Phase 4 (Langfuse Cloud free vs separate self-hosted box) — minor, decide before Phase 4.
- 1 old stash (pre-existing, unrelated).

## Next Step

Pick one: (a) act on the carried-over SECURITY TODO (rotate the 7 Surface-3 secrets), or (b) start the AI-Trust showcase at Phase 1 (deterministic formatter on a copy of `file_support_request`, prod-safe). Ask the user which.

## References

- **Plans/vision**: `specs/patches/ai-trust-showcase-plan.md`, `specs/patches/expliq-core-mcp-vision-brainstorming.md`, `specs/patches/local-agentic-multiagent-vision-brainstorming.md`, `specs/patches/formatter-deterministic-brainstorming.md`
- **Research** (Dev vault): `_resources/_research-index.md` → the 6 files dated 2026-05-30
- **Demo context**: `_TODO.md` (MCP composition demo item, with this session's clarifications)
- **Live**: support workflows on n8n box (`178-105-184-130.sslip.io`, n8n 2.56.0); `file_support_request` = `3Mlx4jPSdle75zmW`
- **Recent commits**: `0e556c2`, `2315736` (Merge #18), `528a6eb`
