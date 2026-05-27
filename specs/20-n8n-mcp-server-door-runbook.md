---
tags:
  - type/reference
  - status/in-progress
  - epic/20
  - exercise/19
---

# Epic 20 — MCP Server Door — Runbook

> Spec: [20-n8n-mcp-server-door.md](20-n8n-mcp-server-door.md) · Results: [20-n8n-mcp-server-door-results.md](20-n8n-mcp-server-door-results.md)
> Operational guide for the second front door: the native **MCP Server Trigger** that exposes the Expliq support brain as MCP tools for a capable AI client (Claude Desktop / Claude Code). The first front door (the in-app widget webhook) is documented in [18-n8n-ai-support-triage-runbook.md](18-n8n-ai-support-triage-runbook.md).

## Topology — one shared brain, two front doors

```
Shared brain (callable sub-workflows, Execute Workflow Trigger):
  file_support_request   (3Mlx4jPSdle75zmW)  WRITE  agent-backed: retrieve → classify → act (GitHub/Linear MCP) → Slack audit → { category, reply, actionsTaken[], slackSummary }
  answer_expliq_question (QEkcrvHaatPMpj0J)  READ   read-only RAG: retrieve → grounded answer → { category, reply }

Front door 1 — Widget (human):  Webhook → Execute Sub-workflow(file_support_request) → Respond
  delegating webhook  IuXf6YCFk85qxyu0   path /webhook/expliq-support-agent-v2   (header-auth x-webhook-secret)

Front door 2 — MCP (AI agent):  MCP Server Trigger → answer_expliq_question + file_support_request
  MCP server  ZMnqIwsEiBgpOBOC   path /mcp/expliq-support-mcp   (bearerAuth)

Rollback (frozen, untouched):  Expliq Support — RAG Answer  (hcTllLJwyQZcpO2O)  path /webhook/expliq-support
Predecessor (live prod until cutover):  Expliq Support — Agentic Triage  (B0YWkBWQa9NEfX9r)  path /webhook/expliq-support-agent
```

Both live front doors call the **same** two tool sub-workflows, so there is no duplicated retrieval between them. (Each tool carries its own retrieval block internally — a deliberate, documented choice so `file_support_request` stays a single self-contained workflow; see results §Deviations.)

## MCP endpoint + authentication

- **MCP URL:** `https://178-105-184-130.sslip.io/mcp/expliq-support-mcp`
- **Transport:** Streamable HTTP (also serves SSE). The server is stateful — it returns an `Mcp-Session-Id` header on `initialize` that must be echoed on every later request.
- **Auth:** `bearerAuth`. Every request needs `Authorization: Bearer <token>`. Missing/wrong token → **HTTP 403**.
  - The token lives in the gitignored `.env` as `N8N_MCP_BEARER_TOKEN` and in the n8n **HTTP Bearer Auth** credential `Expliq Support MCP Server (Bearer)` (id `9FXAAcHjcQq3Pu1k`) on the box. To rotate: generate a new token, update the credential (`n8n_manage_credentials` action=update) and `.env`, and update every client config.
- **Tools exposed:**
  - `answer_expliq_question(query: string)` — read-only. Returns a grounded answer + category. No external action, no audit.
  - `file_support_request(message: string)` — write/agent-backed. Classifies, takes ≤1 category action (GitHub issue for bug/urgent, Linear ticket for feature-request, none for question), posts a Slack audit line, returns `{ category, reply, actionsTaken[], slackSummary }`.

## Connect Claude Code

```bash
claude mcp add --transport http expliq-support \
  https://178-105-184-130.sslip.io/mcp/expliq-support-mcp \
  --header "Authorization: Bearer <N8N_MCP_BEARER_TOKEN>"
```

A mid-session add needs a reconnect: run `claude --continue` (preserves context) or use `/mcp` to reconnect. Then the two tools appear and Claude can call them (e.g. "ask Expliq why an automation is flagged critical" → `answer_expliq_question`; "report that the Opportunities page is blank" → `file_support_request`).

## Connect Claude Desktop

Claude Desktop reaches a remote HTTP MCP server through the `mcp-remote` bridge. In `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "expliq-support": {
      "command": "npx",
      "args": [
        "mcp-remote",
        "https://178-105-184-130.sslip.io/mcp/expliq-support-mcp",
        "--header",
        "Authorization: Bearer <N8N_MCP_BEARER_TOKEN>"
      ]
    }
  }
}
```

Restart Claude Desktop; the two tools appear under the `expliq-support` server.

## Verify the door (raw MCP over HTTP)

The MCP protocol is JSON-RPC over HTTP. The handshake is `initialize` → `notifications/initialized` → `tools/list` / `tools/call`, echoing the `Mcp-Session-Id` header. Windows curl needs `--ssl-no-revoke` for the box's LE cert.

- **AC4 (unauth refused):** `POST <MCP URL>` with no/invalid bearer → expect **403**.
- **AC2 (list):** after the handshake, `tools/list` → both tools with named params (`query`, `message`).
- **AC3 (call):**
  - `tools/call answer_expliq_question {"query": "..."}` → grounded answer, no side effects.
  - `tools/call file_support_request {"message": "<a bug>"}` → creates a sandbox GitHub issue and returns the contract.

A reusable verification script lives in the results file's verification section; it reads `N8N_MCP_BEARER_TOKEN` straight from `.env`.

## Cutover / go-live (widget front door)

The MCP door is independent and live now (it does not touch prod). The **widget** cutover is the only prod-affecting step and follows the Epic-19 go-live pattern (it is a deploy action, gated by `DEPLOY-PORTFOLIO.md`):

1. Confirm the delegating webhook (`/webhook/expliq-support-agent-v2`) passes the byte-equivalence probe set (done — see results).
2. Point the Vercel **Preview** then **Production** `N8N_SUPPORT_WEBHOOK_URL` at `/webhook/expliq-support-agent-v2`, preview-verify, then merge to `main`.
3. After cutover is stable, the old monolithic agent (`B0YWkBWQa9NEfX9r`) can be deactivated; keep it (and the Epic-18 answer workflow `hcTllLJwyQZcpO2O`) as rollbacks.

**Rollback:** repoint `N8N_SUPPORT_WEBHOOK_URL` back to `/webhook/expliq-support-agent` (the untouched monolithic agent) or `/webhook/expliq-support` (the frozen RAG-answer workflow).

## Box objects created by this epic

| Object | id | Active |
|---|---|---|
| Workflow `Expliq Support — file_support_request` | `3Mlx4jPSdle75zmW` | published |
| Workflow `Expliq Support — answer_expliq_question` | `QEkcrvHaatPMpj0J` | published |
| Workflow `Expliq Support — Widget Webhook (delegating)` | `IuXf6YCFk85qxyu0` | active |
| Workflow `Expliq Support — MCP Server` | `ZMnqIwsEiBgpOBOC` | active |
| Credential `Expliq Support MCP Server (Bearer)` (httpBearerAuth) | `9FXAAcHjcQq3Pu1k` | — |

Committed exports: `n8n/support-file-support-request.workflow.json`, `n8n/support-answer-expliq-question.workflow.json`, `n8n/support-widget-webhook.workflow.json`, `n8n/support-mcp-server.workflow.json` (credential references only, no secrets).
