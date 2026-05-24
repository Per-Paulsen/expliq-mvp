---
tags:
  - type/handoff
  - status/ephemeral
---

# Handoff: Verify n8n-MCP on epic-18 branch, then close Epic 18 Phase 0

**Generated**: 2026-05-25 00:30  ·  **Branch**: feature/epic-18-n8n-support-triage  ·  **Status**: Ready for next session (after restart)

## Goal

Close **Epic 18 Phase 0** (self-hosted n8n AI support triage, portfolio piece) by confirming the n8n-MCP server connects, then begin **Phase 1a (RAG)** per the runbook. This session is being handed off specifically so a restart on THIS branch loads the n8n MCP (MCP servers load only at session startup).

## Current State

- **On `feature/epic-18-n8n-support-triage`.** `.mcp.json` here has the `n8n` server (`npx n8n-mcp`, env `N8N_API_URL`/`N8N_API_KEY` from `${N8N_MCP_API_URL}`/`${N8N_MCP_API_KEY}`). On `main` it is figma-only by design.
- **Env vars present** in the shell: `N8N_MCP_API_URL=https://178-105-184-130.sslip.io/api/v1`, `N8N_MCP_API_KEY` (267-char JWT). The old stale-Cursor-env blocker is gone.
- **n8n box already verified healthy** (direct curl, this session): `GET /workflows --ssl-no-revoke` returns `HTTP 200` `{"data":[],"nextCursor":null}` = 0 workflows (matches runbook expectation). So Phase 0 is substantively passing; only the MCP-path confirmation remains.
- **n8n MCP NOT yet loaded**: the running session started on `main`. A restart on this branch is required.
- **Two detours DONE today (on `main`, merged into this branch via `e69280d`):**
  - Deploy hygiene: PR #4 merged, prod deploy READY, live demo `HTTP 200`. main now structurally protected (gitignore + .vercelignore + docs).
  - Plugin fix: `per-claude-skills` bumped to v1.1.0; `ship` + `ci-init` skills now load and work.
- **Stash `stash@{0}`** holds unrelated wip (`.claude/skills/dev/SKILL.md`, `.env.example`, `specs/*` edits, deleted `scripts/seed-r2-data.ts`). NOT part of epic-18. Recover with `git stash pop` if/when wanted.

## Key Decisions

| Decision | Rationale |
|----------|-----------|
| n8n-MCP config stays on the epic-18 branch, never on `main` | `main` auto-deploys to the public demo; n8n is per-user at runtime, not app-level (see DEPLOY-PORTFOLIO.md) |
| Left the floating wip stashed, not committed | It is unrelated to epic-18; keeps the working tree clean for the MCP verification |

## Open Questions / Pending

- Fate of the stashed wip (specs/env/`SKILL.md`/deleted seed-r2-data.ts) — commit where, or discard? Decide separately from epic-18.
- Untracked housekeeping: root `{GUID}.png` strays, `scripts/research-spike-v9-*.ts`, `research/*` new files. Not gitignored; decide keep vs ignore.

## Next Step

After restarting Claude Code **on this branch**, run `claude mcp list` and expect `n8n ✓ Connected`, then list the box's workflows via the n8n MCP (expect 0). If both pass, **Epic 18 Phase 0 is closed → start Phase 1a (RAG)** per `specs/18-n8n-ai-support-triage-runbook.md`. (First `npx n8n-mcp` run may download the package, brief delay.)

## References

- **Runbook**: `specs/18-n8n-ai-support-triage-runbook.md` (Phase 0 + 1a); specs `18/19/20-*.md`
- **Memory**: `project-epic18-infra` (n8n box coords), `reference-plugin-update-mechanism` (plugin update gotcha), `project-deploy-topology` (main=prod), `feedback-selective-commits` (never `git add .`), `feedback-recommend-dont-pad`
- **n8n box**: https://178-105-184-130.sslip.io (API at `/api/v1`)
- **Recent commits**: `e69280d` (hygiene into epic-18), `9f99092` (PR #4 merge), `39e4102` (deploy hygiene)
