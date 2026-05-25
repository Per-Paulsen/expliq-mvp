---
tags:
  - type/handoff
  - status/ephemeral
---

# Handoff: Epic 19 (M2) DONE + live — next is Epic 20 (M3, MCP Server Door)

**Generated**: 2026-05-26 01:00 · **Branch**: main · **Status**: Ready for next session

## Goal

Build the n8n AI support widget as a 3-milestone portfolio series for an n8n Product Builder application. M1 (Epic 18, answer-only) and **M2 (Epic 19, agentic actions) are now DONE + live on production.** Next: **M3 = Epic 20** — factor the RAG/triage tools into reusable sub-workflows and add a native **MCP Server Trigger** workflow that exposes them to Claude Desktop/Code (the interview demo door).

## Current State

- **Epic 19 (M2) COMPLETE + LIVE.** PR #9 (`d2bd1ca`, code + workflow) + PR #10 (`254b0a3`, docs finalize) merged to `main`. Working tree clean.
- **Live agentic workflow:** `Expliq Support — Agentic Triage` (id `B0YWkBWQa9NEfX9r`, active, path `/webhook/expliq-support-agent`). Retrieve-first RAG → AI Agent (Claude/OpenRouter) + GitHub MCP (`issue_write`) + Linear MCP (`save_issue`) → separate Format chain → deterministic structured Slack audit → respond. Contract `{ category, reply, actionsTaken[], slackSummary }`.
- **Prod verified:** all 4 categories live (bug→GitHub issue, feature→Linear ticket, urgent→issue+`@here` Slack, question→answer only); prod `N8N_SUPPORT_WEBHOOK_URL` points at the agent path. Tests 346/346, build + lint green.
- **Epic-18 answer workflow** (`hcTllLJwyQZcpO2O`) stays active as the rollback.
- Full record: `specs/19-agentic-triage-actions-results.md`.

## Key Decisions

| Decision | Rationale |
|----------|-----------|
| Slack = native n8n node (bot token), NOT MCP | Slack's MCP rejects non-partner OAuth clients (no DCR); `mcp.slack.com` won't accept a custom-app token. Proven dead in a live probe. |
| RAG = deterministic retrieve-first; structured output = separate Format chain | Research-backed hybrid: guarantees grounding + n8n's parser is unreliable on a tool-calling agent. Spec-literal "pure agent" was rejected. |
| MCP Client tools = `include: selected` (1 tool each) | Full toolsets collapse agent tool-selection accuracy (research). |
| 4 post-go-live classification tweaks applied to the live agent | urgent-vs-bug, bug-vs-question, feature-vs-question, prompt-injection hardening (public actioning endpoint). |

## Open Questions / Pending

- **Epic 20 spec may have stale assumptions** given Epic 19's deviations (Slack = native node not MCP; tools not yet factored into sub-workflows; retrieve-first + separate format chain). Reconcile before building.
- Sandbox test artifacts are accumulating (GitHub issues #2–#9, Linear EXP-5/EXP-6, Slack audit posts) — harmless + resettable, can be bulk-cleared anytime.
- Redundant native `githubApi` cred `ZZDNvvAvVOpTdTwS` (from Phase 0) is unused by the workflow — can be deleted.

## Next Step

Open `specs/20-n8n-mcp-server-door.md` and, **before** `/dev`, run `/refine` (or `/refine_all`) to reconcile its assumptions with Epic 19's actual architecture (Slack via native node, retrieve-first + separate Format chain, GitHub/Linear via MCP Client tools, tools to be factored into sub-workflows). Then `/dev specs/20-n8n-mcp-server-door.md`.

## References

- **Results**: `specs/19-agentic-triage-actions-results.md` (full build log, Phases 0–4 + the 4 tweaks) · **Spec**: `specs/19-agentic-triage-actions.md` · **Next spec**: `specs/20-n8n-mcp-server-door.md`
- **Research**: `research/n8n-agentic-rag-mcp-state-of-the-art-research-2026-05-25.md` (architecture rationale) · `research/official-mcp-servers-slack-github-linear-research-2026-05-25.md` (MCP/DCR mechanics)
- **Memory**: `project_epic18_n8n_triage` (status footer + Slack-MCP finding), `project_epic18_infra` (box/host), `feedback_no_build_log_in_memory`
- **Recent commits**: `254b0a3` docs finalize · `d2bd1ca` Epic 19 merge · `0c26c76` widget cast cleanup
