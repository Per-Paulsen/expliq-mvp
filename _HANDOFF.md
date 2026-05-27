---
tags:
  - type/handoff
  - status/ephemeral
---

# Handoff: Epic 20 (M3, MCP Server Door) refined — ready for `/dev`

**Generated**: 2026-05-27 · **Branch**: main · **Status**: Ready for next session

## Goal

Build **Epic 20 (M3)**, the final milestone of the 3-part n8n Product Builder portfolio series: expose the
existing support brain via the native **MCP Server Trigger** as a second front door, so a capable AI client
(Claude Desktop / Code) can call it as a tool. "One shared support brain, two consumption models: a human
widget (webhook) and an AI agent (MCP)."

## Current State

- **Epic 20 spec is refined + architecture locked** (this session, via `/refine`). Spec + brainstorming
  updated and **uncommitted** on `main`: `specs/20-n8n-mcp-server-door.md` (M),
  `specs/20-n8n-mcp-server-door-brainstorming.md` (M, rounds 1–4 + Refinement Applied).
- **Verified against reality:** reconciled with Epic 19's as-built workflow, checked the live n8n node
  (`nodes-langchain.mcpTrigger` v2), and grounded in fresh MCP best-practice research.
- **Epics 18 + 19 remain live + unchanged** on prod (`expliq-mvp.vercel.app`). Tests were 346/346 at Epic 19.
- New uncommitted docs: `research/mcp-tool-design-best-practices-research-2026-05-27.md`,
  `research/mcp-advantages-over-direct-api-research-2026-05-27.md`,
  `research/mcp-vs-api-explained.md` (a long MCP-concepts teaching dialogue), `_TODO.md` (new, project-local).

## Key Decisions

| Decision | Rationale |
|----------|-----------|
| **Two tools, read/write separated** | `answer_expliq_question` (read-only RAG) + `file_support_request` (write, agent-backed). MCP best practice: separate query from mutation; one fused tool rejected. |
| **Factoring touches ONLY the agent workflow** | The Epic-18 answer workflow stays a frozen, untouched rollback. Webhook delegates to `file_support_request`; contract stays byte-equivalent (new regression-guard AC6). |
| **Write tool stays agent-backed (not primitives)** | Epic 19's agent enforces server-side guards a client can't replicate (injection hardening, one-action cap, classification, audit). Research-backed. |
| **MCP node is Tools-only — Resources/Prompts NOT possible in n8n** | Verified on the live node (only auth + path props, `ai_tool` input). KB-as-Resource & Prompts showcase would need a custom TS MCP server; **rejected** to keep the pure-n8n portfolio story. |
| **Auth = `bearerAuth`** | Claude Desktop/Code compatible; node default is `none`, so set explicitly. |

## Open Questions / Pending

- **Refine outputs are uncommitted on `main`** (spec + brainstorming + 3 research files + `_TODO.md`).
  `/dev` will branch to `feature/epic-20-mcp-server-door` and carry them over; decide at `/dev` start whether
  to commit the docs first or let the Epic-20 branch absorb them.
- **Epic 20 prerequisites:** does the MCP Server Trigger need box-side setup first (a bearer-auth credential,
  the path, factoring the shared sub-workflows)? Confirm at `/dev` start.
- **Composition-demo follow-up** (Claude Code connecting Expliq + GitHub + Linear MCPs) is tracked in
  `_TODO.md` as a **post-build** task; not part of the Epic-20 build itself.

## Next Step

Run **`/dev specs/20-n8n-mcp-server-door.md`** to build the MCP Server Door: factor the agent logic into the
two shared tool sub-workflows, add the `MCP Server Trigger` workflow (`bearerAuth`, both tools), keep the
answer/rollback workflow untouched, and verify the widget contract stays byte-equivalent before cutover.

## References

- **Spec**: `specs/20-n8n-mcp-server-door.md` · **Brainstorming**: `specs/20-n8n-mcp-server-door-brainstorming.md` (rounds 1–4)
- **Research**: `research/mcp-tool-design-best-practices-research-2026-05-27.md` (read/write split, tool granularity, agent-as-tool verdict) · `research/mcp-advantages-over-direct-api-research-2026-05-27.md`
- **Upstream results**: `specs/19-agentic-triage-actions-results.md`, `specs/18-n8n-ai-support-triage-results.md`
- **Memory**: `project_epic18_n8n_triage`, `project_epic18_infra`, `feedback_no_build_log_in_memory`, `feedback_surface_scope_decisions`
- **Recent commits**: `d2d4c5b` prior handover · `254b0a3` Epic 19 docs finalize · `d2bd1ca` Epic 19 merge
