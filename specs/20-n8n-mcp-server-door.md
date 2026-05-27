---
tags:
  - type/spec
  - status/draft
  - epic/20
  - exercise/19
---

# Epic 20 — n8n MCP Server Door (M3)

> Upstream: [Epic 18 — Support Widget + RAG Answer (M1)](18-n8n-ai-support-triage.md) | [Epic 19 — Agentic Triage Actions (M2)](19-agentic-triage-actions.md) | [Brainstorming](20-n8n-mcp-server-door-brainstorming.md)
> Goal context: the advanced flex for the n8n Product Builder portfolio. Exposes the same support brain as an **MCP server** so an AI agent (Claude Desktop / Code) can call it as a tool. "One shared support brain, two consumption models: a human chat widget AND a capable AI agent that drives the same brain over MCP."
> Milestone 3 of 3: [Epic 18 (answer)](18-n8n-ai-support-triage.md) -> [Epic 19 (actions)](19-agentic-triage-actions.md) -> Epic 20 (this).
> **Depends on Epic 18 + Epic 19** (the RAG + agent logic this re-exposes). Build last.
> Branch: `feature/epic-20-mcp-server-door`.
> **Refined 2026-05-27** against the as-built Epic-19 architecture and verified MCP tool-design best practice; see [brainstorming](20-n8n-mcp-server-door-brainstorming.md) and [`research/mcp-tool-design-best-practices-research-2026-05-27.md`](../research/mcp-tool-design-best-practices-research-2026-05-27.md).

## Scope

Expose the support brain via the native **MCP Server Trigger** node as a **second front door** alongside the existing webhook, with the **read and write capabilities cleanly separated** into two tools.

1. **Factor the agent logic into reusable tool sub-workflows** (shared by both front doors, no duplicated retrieval):
   - **`file_support_request(message)`** = the **WRITE** tool. The Epic-19 agent pipeline (retrieve-first RAG, classify, act via the GitHub `issue_write` + Linear `save_issue` MCP Client tools, deterministic native Slack audit) packaged as a callable sub-workflow. It stays **agent-backed**: the agent earns that opacity by enforcing server-side guards a client cannot replicate (prompt-injection hardening, the one-action cap, consistent classification, the audit). Contract: `{ category, reply, actionsTaken[], slackSummary }`.
   - **`answer_expliq_question(query)`** = the **READ** tool. A read-only RAG sub-workflow (retrieve, then grounded answer, no actions, no audit) that shares the same retrieval block as the write tool. Contract: `{ category, reply }`.
   - **Backward touch (agent workflow ONLY):** the existing widget webhook is refactored to **delegate** to `file_support_request` instead of inlining the logic; its response contract stays byte-equivalent. The shared `Build context` and `Build audit` code (which currently read `$('Webhook')` and `$execution.id` by name) is reworked to take explicit sub-workflow inputs.
2. **Add a second workflow** `n8n/support-mcp-server.workflow.json` whose trigger is the native **MCP Server Trigger** node (`@n8n/n8n-nodes-langchain.mcpTrigger`, typeVersion 2), exposing **both** tool sub-workflows via "Custom n8n Workflow Tool" nodes, with **bearer-token auth required** (`authentication: bearerAuth`; SSE / streamable HTTP).
3. **Consumer = Claude Desktop / Claude Code**, configured against the MCP URL with its bearer token (documented in the runbook). NOT the Expliq web app (which keeps using the webhook). Demo: ask Claude Desktop an Expliq question and watch it call `answer_expliq_question` (read-only, no side effects); ask it to report a problem and watch it call `file_support_request` (which files the category-appropriate sandboxed action). The two-tool surface lets Claude route read vs. write itself.

> **Demo follow-up (post-build, tracked in [`_TODO.md`](../_TODO.md)):** a Claude Code **composition** demo that connects this MCP server alongside the GitHub + Linear MCP servers and runs one rehearsed prompt spanning all three (ask Expliq → file a GitHub issue → create a Linear ticket), optionally wrapped as a `/expliq-triage-demo` skill. Rationale + options in [`research/mcp-vs-api-explained.md`](../research/mcp-vs-api-explained.md) Punkt 3c.

Framing (i) only: mirror the support brain. Framing (ii), exposing Expliq governance-data tools (`get_riskiest_automations`, etc.), is a future extension and out of scope.

This is the delta on top of Epics 18/19; it does not change the Expliq web app. The read/write separation and the agent-as-tool decision are grounded in the research file linked above.

## Acceptance Criteria

### Manual / integration
1. The agent logic is factored into shared tool sub-workflows (`file_support_request`, `answer_expliq_question`) reusing **one** shared retrieval block, so there is no duplicated KB/retrieval **between the two live front doors**; the tool sub-workflows are exported as committed workflow JSON. **Only the agent (widget) front door is refactored;** the Epic-18 answer/rollback workflow is left untouched.
2. The MCP Server Trigger workflow exposes **both** tools with **bearer-token auth required**, exported to `n8n/support-mcp-server.workflow.json` (committed).
3. From an MCP client (Claude Desktop/Code) pointed at the MCP URL with its bearer token: listing shows **both** tools; calling `answer_expliq_question` returns a grounded, non-empty answer (no external write, no audit); calling `file_support_request` performs the category-appropriate sandboxed action and returns its `{ category, reply, actionsTaken[], slackSummary }` contract.
4. Unauthenticated access to the MCP URL (missing or wrong bearer token) is refused.
5. The runbook documents the MCP Server Trigger bearer-auth scheme and how to point Claude Desktop/Code at it (MCP URL + bearer token).
6. **Regression guard:** after factoring, the widget webhook front door returns a **byte-equivalent** `{ category, reply, actionsTaken[], slackSummary }` contract for a fixed probe set, verified **before cutover**. Go-live follows the Epic-19 pattern: build the refactored workflow in parallel, verify all categories against the sandboxes, then cut over the webhook path.

## Out of Scope

- **Touching the Epic-18 answer workflow.** It stays a frozen, self-contained rollback and must not depend on the shared sub-workflows.
- **Splitting the write capability into deterministic primitives** (`create_bug`, `create_feature_request`, etc.). Considered during refinement and deferred in favor of the agent-backed write tool (the agent enforces server-side guards the client cannot replicate). See brainstorming.
- Exposing Expliq **governance-data** tools (framing (ii)). Future extension.
- Any change to the Expliq web app (the widget keeps using the webhook).
- Building the RAG/agent logic itself (that is Epics 18/19; this only re-exposes it).

## Domain Terms

| Term | Definition |
|------|-----------|
| **MCP Server Trigger** | A native n8n trigger node (`@n8n/n8n-nodes-langchain.mcpTrigger`, typeVersion 2) that turns a workflow INTO an MCP server, exposing its attached tool nodes (SSE / streamable HTTP; auth `none` / `bearerAuth` / `headerAuth`) for AI-agent clients to list + call. Distinct from `n8n-MCP` (build-time authoring) and the MCP Client Tool (an agent consuming external tools). |
| **Tool sub-workflow** | A reusable n8n workflow called by both front doors. `file_support_request` (write, agent-backed) and `answer_expliq_question` (read-only RAG) share one retrieval block, attached to the MCP server via "Custom n8n Workflow Tool" nodes. |
| **Two front doors** | The same brain reachable two ways: a Webhook (human chat widget, Epics 18/19) and an MCP Server Trigger (capable AI agents like Claude Desktop/Code, this epic). |
| **Read/write separation** | Exposing the read capability (`answer_expliq_question`) and the write capability (`file_support_request`) as **distinct** MCP tools, so the client can gate, approve, and retry them differently per the MCP tool annotations (`readOnlyHint` / `destructiveHint` / `idempotentHint`). The established best practice; a single fused read+write tool is rejected. |

## Open Questions

None open. Both were resolved during the 2026-05-27 refinement (see [brainstorming](20-n8n-mcp-server-door-brainstorming.md)):
- **MCP auth scheme:** bearer token (`authentication: bearerAuth`), which Claude Desktop/Code configures as MCP URL + bearer token.
- **Write tool exposure:** yes. Both `answer_expliq_question` and `file_support_request` are exposed (read separated from write). The write tool stays **agent-backed** rather than split into deterministic primitives.

---

## Related

- [Epic 18 — Support Widget + RAG Answer (M1)](18-n8n-ai-support-triage.md) (RAG tool source)
- [Epic 19 — Agentic Triage Actions (M2)](19-agentic-triage-actions.md) (agent/action tool source)
- [Brainstorming](20-n8n-mcp-server-door-brainstorming.md) — rounds 1 to 4 of this refinement (the as-built reconciliation + the research-grounded final architecture)
- [Research: MCP tool-design best practices (2026-05-27)](../research/mcp-tool-design-best-practices-research-2026-05-27.md) — read/write separation, tool granularity, the agent-as-tool verdict
