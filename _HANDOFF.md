---
tags:
  - type/handoff
  - status/ephemeral
---

# Handoff: n8n support stack final (Epic-20 cutover restored) — only secret-rotation left

**Generated**: 2026-05-30 00:10  ·  **Branch**: `main`  ·  **Status**: Ready for next session

## Repo Snapshot

> Script-collected (Step 2a). Source of truth, do not paraphrase.

- **Branch**: `main` (ahead 0, behind 0 of `origin/main`)
- **HEAD**: `2315736` — Merge pull request #18 from Per-Paulsen/docs/epic20-cutover-restore
- **Working tree**: **clean** (0 untracked, 0 modified, 0 staged) before this handover commit
- **Stash**: 1 entry (old: "session wip: specs/env/seed parked for epic-18 switch")
- **Uncommitted paths**: none.

## Goal

Get the self-hosted n8n agentic support stack into its final correct shape (one shared brain, two front doors) and make the prod support widget functional again.

## Current State

- **Prod widget LIVE again over the v2 door.** Verified end-to-end: demo login → a `bug` → category "Bug" + grounded reply + GitHub issue `expliq-support-sandbox#13`; n8n execution `52` ran on the delegating workflow `IuXf6YCFk85qxyu0` (monolith not triggered).
- **Root cause that was fixed:** the Doppler migration (~2026-05-28) imported `N8N_SUPPORT_WEBHOOK_URL` + `_SECRET` into Doppler `prd` **empty** (`vercel env pull` returns empty for Sensitive vars; the pre-flight value-diff passed empty-vs-empty). Widget had been returning "Support service is not configured" since then; this also silently undid the earlier Epic-20 cutover.
- **Now set (all consistent):** Doppler `prd` + Vercel **Production** + Vercel **Preview** all hold `N8N_SUPPORT_WEBHOOK_URL = …/webhook/expliq-support-agent-v2` and a fresh 64-char secret; the same secret is in the n8n Header-Auth cred `Q9PLFpkotcPFTRRe` (shared by all 3 webhook workflows).
- **Rollbacks:** monolith `B0YWkBWQa9NEfX9r` (`/webhook/expliq-support-agent`) **deactivated** but kept; Epic-18 RAG-answer `hcTllLJwyQZcpO2O` frozen.
- **Shipped:** PR #18 (docs: Epic-20 results + DEPLOY-PORTFOLIO) merged to `main` (`2315736`); CI + gitleaks green. Sandbox issue #13 closed. Playwright browser closed.

## Key Decisions

| Decision | Rationale |
|----------|-----------|
| Generate a FRESH webhook secret, set on both sides | old secret was lost (empty in Doppler + deleted `.env`); fresh + synchronized is deterministic |
| Secret set hygiene-clean (n8n cred via UI by Per, Doppler via local CLI) | keep the fresh secret out of the model API, consistent with the Doppler-migration hygiene |
| Preview-scope vars set via Vercel Dashboard | the CLI in agent-mode refuses "all preview branches" non-interactively (3 flag combos looped on `git_branch_required`) |
| Doku shipped via PR (ship), not direct push | gitleaks scan after heavy secret-handling + honor main-discipline |

## Open Questions / Pending

- **⚠️ SECURITY TODO (carried over, still open): rotate 7 Surface-3 secrets** — `HCLOUD_TOKEN`, `RAG_DATABASE_URL`, `GITHUB_SANDBOX_PAT`, `LINEAR_API_KEY`, `SLACK_BOT_TOKEN`, `SLACK_OAUTH_CLIENT_ID/SECRET`. (These leaked into a prior transcript via a `.env` Read.) Do NOT rotate `N8N_ENCRYPTION_KEY`.
- MCP composition demo (the open `_TODO.md` item) still pending: connect Expliq-Support + GitHub + Linear MCPs in Claude Code, one prompt spanning all three.
- 1 old stash (pre-existing, unrelated).

## Next Step

Rotate the 7 leaked Surface-3 secrets, highest-impact first (`RAG_DATABASE_URL`, `HCLOUD_TOKEN`): generate a fresh value at source, revoke the old, set it in Doppler `expliq-n8n-box/prd`, then push it onto the box's n8n store via `n8n-box-credential-sync.sh` (private repo). `N8N_ENCRYPTION_KEY` stays untouched.

## References

- **Public docs**: `specs/20-n8n-mcp-server-door-results.md` (Cutover-restore section), `-runbook.md`; `DEPLOY-PORTFOLIO.md` (Epic-20 outbound touchpoint + Sensitive-var caution)
- **Private repo** `Per-Paulsen/expliq-mvp-internal` (cloned at `_resources/`): `surface3-n8n-box-plan-2026-05-28.md` (rotation runbook), `n8n-box-credential-sync.sh`
- **Memory**: `project_doppler_migration` (migration-defect lesson), `project_epic18_n8n_triage` (cutover correction)
- **SSH**: `ssh -i ~/.ssh/expliq_n8n_ed25519 root@178.105.184.130` · local doppler at `%LOCALAPPDATA%\Microsoft\WinGet\Packages\Doppler.doppler_*\doppler.exe` (not on PATH)
- **Recent commits**: `2315736` (Merge #18), `528a6eb` (docs), `1455989` (prev handover)
