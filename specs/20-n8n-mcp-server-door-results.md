---
tags:
  - type/reference
  - status/done
  - epic/20
  - exercise/19
---

# Epic 20 — n8n MCP Server Door (M3) — Results

> Spec: [20-n8n-mcp-server-door.md](20-n8n-mcp-server-door.md) · Brainstorming: [20-n8n-mcp-server-door-brainstorming.md](20-n8n-mcp-server-door-brainstorming.md) · Runbook: [20-n8n-mcp-server-door-runbook.md](20-n8n-mcp-server-door-runbook.md)
> Upstream: [Epic 18 results](18-n8n-ai-support-triage-results.md), [Epic 19 results](19-agentic-triage-actions-results.md)
> Built 2026-05-27 via `/dev` (lead-driven n8n-MCP build; no Expliq app-code change). **Status: build + verification complete; widget cutover pending as a Per-driven go-live.**

## What was built

The support brain factored into reusable tool sub-workflows, exposed via a second front door (native MCP Server Trigger) alongside the existing widget webhook.

| Object | id | Role |
|---|---|---|
| `Expliq Support — file_support_request` | `3Mlx4jPSdle75zmW` | WRITE tool sub-workflow (agent-backed): the full Epic-19 pipeline (retrieve → Triage Agent + GitHub/Linear MCP Client tools → Format → Slack audit) behind an Execute Workflow Trigger. **Self-contained — the n8n-application showcase workflow.** |
| `Expliq Support — answer_expliq_question` | `QEkcrvHaatPMpj0J` | READ tool sub-workflow: read-only RAG (retrieve → grounded answer), own retrieval block, contract `{ category, reply }`. |
| `Expliq Support — Widget Webhook (delegating)` | `IuXf6YCFk85qxyu0` | New widget front door: `Webhook → Execute Sub-workflow(file_support_request) → Respond`, path `/webhook/expliq-support-agent-v2`. Built in parallel; not yet cut over to prod. |
| `Expliq Support — MCP Server` | `ZMnqIwsEiBgpOBOC` | MCP front door: `MCP Server Trigger` (v2, `bearerAuth`, path `/mcp/expliq-support-mcp`) + two `Call n8n Sub-Workflow Tool` nodes → both tools. |
| Credential `Expliq Support MCP Server (Bearer)` (httpBearerAuth) | `9FXAAcHjcQq3Pu1k` | Validates incoming MCP bearer tokens. |

**Files created/modified (committed):**
- `n8n/support-file-support-request.workflow.json`, `n8n/support-answer-expliq-question.workflow.json`, `n8n/support-widget-webhook.workflow.json`, `n8n/support-mcp-server.workflow.json` (exports, credential references only, no secrets).
- `specs/20-n8n-mcp-server-door-runbook.md` (AC5).
- `.env` (gitignored): added `N8N_MCP_BEARER_TOKEN`.
- No Expliq app-code change (spec: the widget keeps using the webhook).

## Architecture (Variante B, Per-confirmed)

```
file_support_request   = Epic-19 agent pipeline, fully inline, Execute Workflow Trigger → … → Return result
answer_expliq_question = read-only RAG, own retrieval block, Execute Workflow Trigger → … → Return result
Widget door:  delegating Webhook → Execute Sub-workflow(file_support_request) → Respond   (contract preserved)
MCP door:     MCP Server Trigger (bearerAuth) → exposes both tools
Backup:       Epic-18 answer workflow untouched (frozen rollback)
```

## Key decisions & deviations from spec

- **D-B1 — Each tool carries its own retrieval block (no shared `retrieve_kb`).** The spec's AC1 says "reusing one shared retrieval block." We deliberately duplicated the retrieval block into each tool instead, so that **`file_support_request` is one complete, self-contained workflow** — the single workflow Per shows for the n8n Product Builder application (a shared `retrieve_kb` sub-workflow would hide retrieval behind an Execute-Workflow node, leaving no complete workflow to present). AC1's *scoped* requirement — "no duplicated KB/retrieval **between the two live front doors**" — still holds: the widget webhook and the MCP server both call the **same** two sub-workflows. The duplication is only *between the two tools*, not between the front doors. Per confirmed this trade-off explicitly.
- **D-B2 — Named MCP tool parameters require defined trigger inputs.** With an `Execute Workflow Trigger` in `passthrough` ("Accept all data") mode, the `Call n8n Sub-Workflow Tool` exposes a **generic `{ input: string }`** MCP parameter (verified: functional, but not the spec's named `query`/`message`). To get clean named params, the triggers were switched to "Define using fields below": `answer_expliq_question` defines `query`; `file_support_request` defines `message` + `history`/`user`/`context`/`timestamp`. The MCP tool maps only the primary arg via `$fromAI(...)`; the extra `file_support_request` fields exist so the **widget webhook keeps its full Slack-audit context** (user/workspace/page), which MCP-initiated calls simply leave empty.
- **D-B3 — Prod-safe parallel build + (pending) cutover.** Nothing touched the live prod path. The delegating widget webhook was built on a temp path (`/expliq-support-agent-v2`) and byte-equivalence-verified against the live agent. The actual cutover (repoint Vercel `N8N_SUPPORT_WEBHOOK_URL` → the new path, merge to `main`) is a Per-driven go-live per `DEPLOY-PORTFOLIO.md`; see runbook.
- **D-B4 — n8n 2.x draft/publish.** A sub-workflow must be **published** (`activateWorkflow`) before an active parent (the MCP server / delegating webhook) may reference it. Both tool sub-workflows are published despite having no listening trigger of their own.
- **D-B5 — Validator false-positives (n8n-MCP `validate_workflow`).** `file_support_request` reports 4 "errors" that are false-positives relative to the proven-live config it copies: (1)/(2) `mcpClientTool` "no serverUrl" — the node's real required param is `endpointUrl` (confirmed via `get_node`; the live agent uses it and works); (3)/(4) MCP tools "no toolDescription" — optional, omitted for live parity. Also benign: AI sub-nodes "not reachable from trigger" (they connect via `ai_*`), agent "no systemMessage" (set under `options.systemMessage`), "Community node used as AI tool" (the langchain agent/MCP-trigger are not community nodes).

## Verification results

All acceptance criteria verified end-to-end against the live box (n8n 2.56.0) and real sandbox targets.

| AC | What | Result |
|---|---|---|
| **AC1** | Factored into shared tool sub-workflows, exported as JSON; only the agent (widget) door refactored, Epic-18 answer workflow untouched | ✓ (retrieval-sharing per D-B1) |
| **AC2** | MCP exposes both tools, bearer required | ✓ `tools/list` shows `answer_expliq_question(query)` + `file_support_request(message)`, named params with descriptions |
| **AC3 read** | `answer_expliq_question` grounded, no write/audit | ✓ `tools/call {query}` → grounded KB answer, `actionsTaken: []` |
| **AC3 write** | `file_support_request` performs sandboxed action, returns contract | ✓ `tools/call {message}` → `category: bug`, GitHub issue #11, full `{category, reply, actionsTaken[], slackSummary}` |
| **AC4** | Unauthenticated MCP access refused | ✓ HTTP **403** with missing/invalid bearer |
| **AC5** | Runbook documents bearer scheme + Claude Desktop/Code config | ✓ `specs/20-n8n-mcp-server-door-runbook.md` |
| **AC6** | Widget contract byte-equivalent + parallel-build cutover | ✓ question probe → identical contract/category/actions vs. live agent; bug probe → GitHub issue #10 via the delegating webhook; audit context (user/workspace/page) intact after the trigger change (execution 43 `Build audit` inspected). Cutover pending (go-live). |

**Verification method:** lead-driven, no Vitest/Playwright (no app code). MCP verified as a raw MCP-over-HTTP client (JSON-RPC handshake `initialize` → `notifications/initialized` → `tools/list`/`tools/call`, echoing `Mcp-Session-Id`, `curl --ssl-no-revoke`, bearer read from `.env`). Widget contract verified via header-authed POST probes; audit context confirmed via the n8n execution record.

**Sandbox test artifacts (resettable):** GitHub `expliq-support-sandbox` issues **#10** (widget-webhook bug probe) and **#11** (MCP file_support_request probe). Harmless; can be bulk-closed anytime.

## Retrospective

- **Version/dependency surprises:** none new — reused Epic-18/19 credentials and node versions. Confirmed live node facts: `mcpTrigger` v2 (`httpBearerAuth` cred for `bearerAuth`), `executeWorkflowTrigger` v1.1, `executeWorkflow` (Execute Sub-workflow) v1.3, `toolWorkflow` ("Call n8n Sub-Workflow Tool") v2.2 (no `name` prop ≥ v2.2 → the node name is the tool name).
- **Deviations:** D-B1 (retrieval per-tool, not shared) and D-B2 (defined trigger inputs for named params) — both above; D-B1 is the only AC-wording relaxation, scoped and Per-confirmed.
- **Patterns established:** (a) factor a live monolithic workflow by wrapping it behind an Execute Workflow Trigger (Build context/audit reworked to read trigger inputs instead of `$('Webhook')`/`$execution.id`) and delegating from a thin webhook — preserves behavior, enables reuse; (b) for a clean MCP tool schema, **define the sub-workflow trigger inputs** (passthrough → generic `input`); (c) "agent behind a tool" is a sanctioned MCP pattern when the agent enforces guards the client can't (injection hardening, one-action cap, audit).
- **Open questions / pending:**
  - **Widget cutover (go-live)** — repoint Vercel `N8N_SUPPORT_WEBHOOK_URL` to `/webhook/expliq-support-agent-v2`, preview-verify, merge to `main`; then optionally deactivate the old monolithic agent (keep as rollback). Per-driven.
  - **MCP-path audit context** is intentionally sparse (no user/workspace/page — the external client doesn't supply them); webhook-path audit stays full.
  - **Post-build composition demo** (Claude Code connecting Expliq + GitHub + Linear MCPs) remains the tracked `_TODO.md` item.
  - **Nit — `$fromAI`-mapped tool args surface as `required` in the MCP schema** (verified via `tools/list`: `file_support_request.inputSchema.required = ["message"]`, `answer_expliq_question.inputSchema.required = ["query"]`). The `Call n8n Sub-Workflow Tool` node auto-marks any `$fromAI(...)`-mapped arg as required; the trigger schema itself has no required-flag. Harmless — the MCP client always supplies the primary arg.
