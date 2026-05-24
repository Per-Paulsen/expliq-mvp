---
tags:
  - type/spec
  - status/draft
  - epic/20
  - exercise/19
---

# Epic 20 — n8n MCP Server Door (M3)

> Upstream: [Epic 18 — Support Widget + RAG Answer (M1)](18-n8n-ai-support-triage.md) | [Epic 19 — Agentic Triage Actions (M2)](19-agentic-triage-actions.md) | [Brainstorming](18-n8n-ai-support-triage-brainstorming.md)
> Goal context: the advanced flex for the n8n Product Builder portfolio. Exposes the same support brain as an **MCP server** so an AI agent (Claude Desktop / Code) can call it as a tool. "One n8n workflow, two front doors: a human widget AND an AI agent."
> Milestone 3 of 3: [Epic 18 (answer)](18-n8n-ai-support-triage.md) -> [Epic 19 (actions)](19-agentic-triage-actions.md) -> Epic 20 (this).
> **Depends on Epic 18** (RAG answer tool) and, if the write tool is exposed, **Epic 19** (the action tool). Build last.
> Branch: `feature/epic-20-mcp-server-door`.

## Scope

Expose the support brain via the native **MCP Server Trigger** node, as a **second front door** alongside Epic 18's webhook.

1. **Factor the logic into reusable tool sub-workflows** (so both front doors share it, no duplication):
   - `answer_expliq_question(query)` -> RAG over the KB (from Epic 18).
   - `file_support_request(message)` -> classify + sandboxed action (from Epic 19) — optional in v1 (see Open Questions).
   - **Backward touch:** factoring **refactors** Epic 18's answer workflow (and, if the write tool is exposed, Epic 19's agent workflow) to *delegate* to these sub-workflows instead of inlining the logic; those workflows are re-exported after the change. This is why Epic 20 builds last.
2. **Add a second workflow** `n8n/support-mcp-server.workflow.json` whose trigger is the native **MCP Server Trigger** node, exposing those tool sub-workflows with **auth enabled** (SSE / streamable HTTP).
3. **Consumer = Claude Desktop / Claude Code**, configured against the MCP URL (documented in the runbook). NOT the Expliq web app (which keeps using the webhook). Demo: ask Claude Desktop an Expliq question and watch it call the self-hosted n8n MCP server's `answer_expliq_question` tool.

Framing (i) only: mirror the support brain. Framing (ii), exposing Expliq governance-data tools (`get_riskiest_automations`, etc.), is a future extension and out of scope.

This is the delta on top of Epics 18/19; it does not change the Expliq web app.

## Acceptance Criteria

### Manual / integration
1. RAG (and, if exposed, triage) logic is factored into shared tool sub-workflows reused by both the webhook flow and the MCP server (no duplicated KB/retrieval); the tool sub-workflows are exported as committed workflow JSON.
2. The MCP Server Trigger workflow exposes the tool(s) with **auth required**, exported to `n8n/support-mcp-server.workflow.json` (committed).
3. From an MCP client (Claude Desktop/Code) pointed at the MCP URL: listing shows the tool(s), and calling `answer_expliq_question` returns a grounded, non-empty answer (not an error).
4. Unauthenticated access to the MCP URL is refused.
5. The runbook documents the MCP Server Trigger auth scheme and how to point Claude Desktop/Code at it.

## Out of Scope

- Exposing Expliq **governance-data** tools (framing (ii)) — future extension.
- Any change to the Expliq web app (the widget keeps using the webhook).
- Building the RAG/agent logic itself (that is Epics 18/19; this only re-exposes it).

## Domain Terms

| Term | Definition |
|------|-----------|
| **MCP Server Trigger** | A native n8n trigger node that turns a workflow INTO an MCP server, exposing its tool nodes (SSE / streamable HTTP, optional auth) for AI-agent clients to list + call. Distinct from `n8n-MCP` (build-time authoring) and the MCP Client Tool (agent consuming external tools). |
| **Tool sub-workflow** | A reusable n8n workflow (`answer_expliq_question`, `file_support_request`) called by both front doors, so logic is not duplicated. |
| **Two front doors** | The same brain reachable two ways: a Webhook (human chat widget, Epic 18) and an MCP Server Trigger (AI agents like Claude Desktop/Code, this epic). |

## Open Questions

1. **MCP server auth scheme** + how Claude Desktop/Code is configured against it (documented in the runbook).
2. **Write tool exposure:** is `file_support_request` (a write/action tool, from Epic 19) exposed via the MCP server in v1, or only the read-only `answer_expliq_question`? Exposing the write tool widens reach; sandbox + auth still apply.

---

## Related

- [Epic 18 — Support Widget + RAG Answer (M1)](18-n8n-ai-support-triage.md) (RAG tool source)
- [Epic 19 — Agentic Triage Actions (M2)](19-agentic-triage-actions.md) (action tool source)
- [Brainstorming](18-n8n-ai-support-triage-brainstorming.md) — Rounds 5 and 8 (MCP-node use cases + the MCP Server Trigger decision)
