---
tags:
  - type/handoff
  - status/ephemeral
---

# Handoff: Epic 19 (M2) prerequisites COMPLETE — next is the workflow build via /dev

**Generated**: 2026-05-25 21:15 · **Branch**: main · **Status**: Ready for next session

## Goal

Build the n8n AI support widget as a 3-milestone series (portfolio piece for an n8n Product Builder application). M1 (Epic 18) is done + live. **M2 = Epic 19**: turn the answer-only workflow into an **AI Agent that also acts** (bug→GitHub issue, feature-request→Linear ticket, always→Slack audit, urgent→Slack alert) via **MCP Client nodes**. This session set up all Epic-19 prerequisites; next is building the workflow.

## Current State

- **Epic 19 prerequisites COMPLETE (Phase 0).** Full log: `specs/19-agentic-triage-actions-results.md`.
- **Sandbox targets:** GitHub repo `Per-Paulsen/expliq-support-sandbox` (private) · Slack private channel `support-triage-audit` (`C0B5YHCGH1T`, workspace `expliqgovernance.slack.com`) · Linear team `Expliq Support` (id `c48dd37e-f37f-48ca-a9be-6b6c6a2224d2`).
- **n8n runtime credentials** (live box, for the workflow's MCP Client nodes): GitHub Bearer `ZBphLaYtMslOfeDE` (→api.githubcopilot.com), Linear Bearer `tyCijYT3lArGrC3W` (→mcp.linear.app), Slack OAuth2 `5ZgLobqHrckTpqhW` (→mcp.slack.com, **connected**).
- **Session MCPs** (Claude-side, for setup only — NOT the workflow): Slack via claude.ai connector (`mcp__claude_ai_Slack__*`), Linear via `claude mcp add` user-scope, GitHub via `gh`/PAT.
- **Secrets in `.env`** (gitignored): `GITHUB_SANDBOX_PAT`, `LINEAR_API_KEY`, `SLACK_OAUTH_CLIENT_ID`/`SLACK_OAUTH_CLIENT_SECRET`.
- **Working tree:** untracked this-session deliverables `specs/19-agentic-triage-actions-results.md` + `research/official-mcp-servers-...md` (commit with the Epic 19 PR), plus long-parked research-spikes + 2 screenshots (`{...}.png`) — leave those.

## Key Decisions

| Decision | Rationale |
|----------|-----------|
| Workflow arch = **MCP Client nodes → external MCP servers** | Per confirmed; matches spec domain terms. NOT native n8n nodes. |
| `urgent` = own branch; rate-limit = best-effort in-memory | Per chose urgent-branch; KV is spec Out-of-Scope. |
| Slack: claude.ai connector (session) + custom Slack OAuth app + `mcpOAuth2Api` (n8n) | Slack MCP lacks DCR. authorizationCode, user scopes `chat:write channels:read groups:read`, authUrl `slack.com/oauth/v2_user/authorize`. |
| Linear MCP via direct `claude mcp add` | Linear MCP supports DCR. |

## Open Questions / Pending

- **Slack n8n→MCP live call not yet exercised** — OAuth connect succeeded, but the agent actually posting via the MCP Client node is validated when the workflow runs in `/dev`.
- Native `githubApi` cred `ZZDNvvAvVOpTdTwS` is redundant with the GitHub Bearer cred — tidy at `/dev`.
- Response-contract extension (`actionsTaken[]` + `slackSummary`) + widget rendering — part of `/dev`.
- Untracked `research/`+`specs/19-...-results.md` ride with the Epic 19 PR; the 2 root `.png` screenshots are local — leave or delete.

## Next Step

Run `/dev specs/19-agentic-triage-actions.md` (fresh session) — it auto-branches from `main`, builds the AI Agent + MCP Client nodes on the three n8n creds above, extends the response contract + widget, updates `DEPLOY-PORTFOLIO.md`, and appends its build phases to `specs/19-agentic-triage-actions-results.md`.

## References

- **Results / build log**: `specs/19-agentic-triage-actions-results.md` (Phase 0) · **Spec**: `specs/19-agentic-triage-actions.md` · **Runbook**: `specs/18-n8n-ai-support-triage-runbook.md`
- **Research**: `research/official-mcp-servers-slack-github-linear-research-2026-05-25.md` (MCP/connector mechanics, DCR, Slack-OAuth config)
- **Memory**: `project_epic18_infra` (box + n8n host `178-105-184-130.sslip.io`), `reference_claude_code_mcp_connector_auth`, `feedback_no_build_log_in_memory`, `feedback_surface_scope_decisions`
- **Recent commits**: `aea5080` vercel ignored-build-step · `47a464e` prior handover (Epic 18)
