---
tags:
  - type/handoff
  - status/ephemeral
---

# Handoff: CI hardening + plugin skills DONE; one restart unblocks skills + n8n-MCP (Epic 18)

**Generated**: 2026-05-24 21:30  ·  **Branch**: main (Epic-18 work on `feature/epic-18-n8n-support-triage`)  ·  **Status**: Ready for next session

## Goal

Two threads converged on **one Claude Code restart**: (1) the CI/PR-check system is built and merged; its new plugin skills (`/ship`, `/ci-init`) only load after a restart. (2) Epic 18 (n8n AI support triage) is still waiting on the n8n-MCP, which needs the same restart (env vars). A clean restart unblocks both, then Epic 18 Phase 0 closes and Phase 1a (RAG) begins.

## Current State

- **CI system — DONE, merged to main:**
  - Central `Per-Paulsen/ci-workflows@v1` (public): 4 reusable workflows — `node-ci` (npm ci + `type-check` blocking + eslint non-blocking + vitest), `autofix` (eslint --fix + commit-back), `gitleaks`, `claude-review` (advisory, `continue-on-error` step).
  - expliq-mvp migrated to a thin `pr-checks.yml` caller (PRs #1, #2, #3 all merged). All checks green.
  - **Branch protection on `main`**: `ci / Lint & Test` + `gitleaks / Secret scan` required; admin bypass on (`enforce_admins:false`); review/autofix advisory.
- **Plugin — pushed + cache-synced, NOT yet loaded here:**
  - `per-claude-skills` has `/ship` + `/ci-init` (latest commit `4b1d0fb`). Cache at `~/.claude/plugins/marketplaces/per-claude-skills` is a GitHub clone, verified at `4b1d0fb`, both skills present.
  - **Not in this session's skill list** — new skill folders are only discovered at startup; `/reload-plugins` does NOT pick them up. Restart required.
- **n8n-MCP (Epic 18) — blocked on restart:** infra live (`https://178-105-184-130.sslip.io`), `.mcp.json` + `setx` env set, but THIS claude.exe inherited a stale env from a Cursor process running since May 20 (pre-`setx`). `claude mcp list` → `n8n ✗ Failed to connect (Missing env vars)`.
- **AGENTS.md** adoption decided (not implemented) — see Open Questions.

## Key Decisions

| Decision | Rationale |
|----------|-----------|
| Commit-back `autofix` kept (vs pre-commit hook) | Centrally distributable for a solo dev; pre-commit needs per-repo husky |
| Pin consumers to `@v1`, never `@main` | A bad push to ci-workflows would break all consumers; move v1 on release |
| review/autofix non-blocking via `continue-on-error` **on the reusable step** | `continue-on-error` on a reusable-CALLING job = `startup_failure`; must be on the step inside the reusable |
| Light branch protection (admin bypass) | Real gate for Vercel-production main without solo lockout |
| Adopt `AGENTS.md` + thin `CLAUDE.md` that `@AGENTS.md`-imports it | Claude Code does NOT read AGENTS.md natively (verified); portable to Cursor/Copilot. No symlink (Windows). |

## Open Questions / Pending

- **AGENTS.md adoption** — captured in global `Dev/_TODO.md` (bilinked to the "Achse 2" item). Pattern: AGENTS.md source-of-truth + CLAUDE.md `@AGENTS.md`. Not implemented; bake into the starter.
- **Personal starter repo + `/new-project` skill** — researched (SOTA = one starter repo + local scaffold OR `gh repo create --template`), deferred. See repo-bootstrapping research.
- **Roll `/ci-init` to other GitHub repos** — shared discovery step with the gitleaks-distribution TODO.
- **Epic 18 Phase 1a (RAG)** — after Phase 0 closes (MCP verified), per the runbook.

## Next Step

After a **clean restart** (fully quit Cursor so the main process re-reads the registry, OR launch Claude Code from a terminal opened fresh via the Start menu so `setx` env is inherited): in the new session, verify BOTH — (1) `ship` + `ci-init` appear in the skills list, and (2) `claude mcp list` shows `n8n ✓ Connected`, then list the box's workflows via the MCP (expect 0). If both pass, **Epic 18 Phase 0 is closed → start Phase 1a (RAG)** per the runbook.

## References

- **Research (expliq-mvp/research/)**: `ai-pr-review-state-of-the-art-...`, `github-actions-best-practices-...`, `repo-bootstrapping-state-of-the-art-...` (all 2026-05-24)
- **Design doc**: `Dev/_resources/ci-distribution-across-repos-2026-05-24.md`
- **Memory**: `project_ci_github_actions` (CI setup + all GitHub Actions gotchas), `project_epic18_infra` (n8n coordinates), `feedback_selective_commits` (never `git add .`)
- **Epic 18 runbook**: `specs/18-n8n-ai-support-triage-runbook.md` (Phase 0 + 1a)
- **Repos**: `github.com/Per-Paulsen/ci-workflows` (`@v1`), `github.com/Per-Paulsen/per-claude-skills` (`4b1d0fb`)
- **Recent commits**: `3409058` (PR #3), `1717af2` (#2), `bf3e4d5` (#1)
