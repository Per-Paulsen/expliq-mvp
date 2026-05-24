---
tags:
  - type/spec
  - status/brainstorming
  - epic/20
  - exercise/19
---

# 20 — n8n MCP Server Door — Brainstorming

> Upstream: [Epic 20 spec](20-n8n-mcp-server-door.md)
> **Decision history lives in [18-n8n-ai-support-triage-brainstorming.md](18-n8n-ai-support-triage-brainstorming.md)** (Rounds 1 to 9). This epic was carved out of Epic 18 as milestone M3 during the Round-9 split. The MCP-node use-case analysis (Round 5) and the MCP Server Trigger decision (Round 8) are recorded there.

## Carved decisions (from Epic 18 brainstorming)

- Add the native **MCP Server Trigger** to expose the support brain as MCP tools (Round 8), framing (i) only (mirror the support brain). Framing (ii) (governance-data tools) = future extension.
- Consumer = **Claude Desktop / Claude Code** (Round 8). The Expliq web app keeps using the webhook.
- Architecture: factor RAG + triage into reusable **tool sub-workflows** shared by both front doors; the MCP server is a separate workflow/trigger, not bolted onto the webhook flow.

## Open (epic-specific)

Use this file for any further `/refine` rounds scoped to Epic 20. Current open items are in the spec's Open Questions (MCP auth scheme + client config; whether the write tool is exposed via MCP in v1).

## Refinement Applied

Batch-refined via `/refine_all_ind`. See `specs/ind-epic-review.md` for details.
