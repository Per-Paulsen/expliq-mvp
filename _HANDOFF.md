---
tags:
  - type/handoff
  - status/ephemeral
---

# Handoff: Epic 20 (MCP Server Door) built + verified — pending results review + widget cutover

**Generated**: 2026-05-27 22:10 · **Branch**: feature/epic-20-mcp-server-door · **Status**: Ready for next session

## Goal

Finish **Epic 20 (M3)**, the last milestone of the n8n Product Builder portfolio series: expose the support brain via a native **MCP Server Trigger** as a second front door so a capable AI client (Claude Desktop/Code) can call it as tools. "One brain, two doors: human widget (webhook) + AI agent (MCP)."

## Current State

- **Build done + committed** on the feature branch: commit `a012fcd` ("feat: implement epic 20 — n8n MCP Server Door"), 6 files (4 workflow exports + runbook + results). No Expliq app-code changed; **live prod path untouched** (parallel build).
- **Live on the box (n8n 2.56.0), all published/active:**
  - `file_support_request` `3Mlx4jPSdle75zmW` (WRITE, agent-backed, fully inline = the showcase WF)
  - `answer_expliq_question` `QEkcrvHaatPMpj0J` (READ, read-only RAG)
  - delegating widget webhook `IuXf6YCFk85qxyu0` (path `/webhook/expliq-support-agent-v2`)
  - MCP server `ZMnqIwsEiBgpOBOC` (path `/mcp/expliq-support-mcp`, bearerAuth, cred `9FXAAcHjcQq3Pu1k`)
- **All ACs verified** (raw MCP-over-HTTP + webhook probes): AC2 both tools listed with named params (`message`/`query`); AC3 read grounded + write created GitHub issue #11 via MCP; AC4 unauth→403; AC6 widget byte-equivalent + audit context intact.
- `.env` (gitignored): added `N8N_MCP_BEARER_TOKEN`.
- Sandbox test artifacts (resettable): GitHub `expliq-support-sandbox` issues #10, #11.

## Key Decisions

| Decision | Rationale |
|----------|-----------|
| **Variante B — each tool carries its own retrieval block** (no shared `retrieve_kb`) | So `file_support_request` is ONE complete, self-contained workflow to show in the n8n application. AC1's "no dup between the two live front doors" still holds (both doors call the same 2 subs). Per-confirmed. |
| **Named MCP params require defined trigger inputs** | passthrough triggers expose a generic `{input}`; so triggers define `query` / `message`(+audit fields). MCP maps the primary arg via `$fromAI`. |
| **Prod-safe parallel build; cutover is a separate go-live** | Nothing touched prod; widget cutover (Vercel env repoint) is gated by DEPLOY-PORTFOLIO. |

## Open Questions / Pending

- **Results file review:** `specs/20-n8n-mcp-server-door-results.md` is a draft awaiting Per's OK (corrections appended, not overwritten). Epic not marked "done" until confirmed.
- **Widget cutover (go-live, Per-driven):** repoint Vercel `N8N_SUPPORT_WEBHOOK_URL` → `/webhook/expliq-support-agent-v2`, preview-verify, merge to `main`; then optionally deactivate the old monolith agent `B0YWkBWQa9NEfX9r` (keep as rollback).
- **Ship:** offer to open a PR for the branch via `/ship` (brings exports + docs to `main`; CI runs).
- Post-build composition demo (Claude Code + Expliq + GitHub + Linear MCPs) stays a `_TODO.md` item.

## Next Step

Ask Per to review `specs/20-n8n-mcp-server-door-results.md` and confirm (or give corrections to append); on his OK, mark Epic 20 done, then walk through the widget cutover (Vercel env repoint + `/ship` PR) together.

## References

- **Spec / Brainstorming / Runbook / Results**: `specs/20-n8n-mcp-server-door{,-brainstorming,-runbook,-results}.md`
- **Exports**: `n8n/support-{file-support-request,answer-expliq-question,widget-webhook,mcp-server}.workflow.json`
- **Upstream results**: `specs/19-agentic-triage-actions-results.md`, `specs/18-n8n-ai-support-triage-results.md`
- **Memory**: `project_epic18_n8n_triage`, `project_epic18_infra`, `feedback_no_build_log_in_memory`, `feedback_surface_scope_decisions`
- **Recent commits**: `a012fcd` Epic 20 build · `e7a159d` Epic 20 docs · `9154c75` prior handover
