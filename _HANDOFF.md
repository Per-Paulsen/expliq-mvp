---
tags:
  - type/handoff
  - status/ephemeral
---

# Handoff: Doppler migration + repo sanitization DONE — only secret-rotation left

**Generated**: 2026-05-29 22:10  ·  **Branch**: `main`  ·  **Status**: Ready for next session

## Repo Snapshot

> Script-collected (Step 2a). Source of truth — do not paraphrase.

- **Branch**: `main` (ahead 0, behind 0 of `origin/main`)
- **HEAD**: `88c88fb` — chore: move internal research + ops out of public repo, add Doppler usage doc (#17)
- **Working tree**: **clean** (0 untracked, 0 modified, 0 staged)
- **Stash**: 1 entry (old: "session wip: specs/env/seed parked for epic-18 switch")
- **Uncommitted paths**: none. (Internal material now lives in the private repo + is gitignored.)

## Goal

End the `.env`/Vercel/Hetzner secret fragmentation (every secret one home), and split public app
from internal ops/research so the public repo carries no secrets, plans, or spike data.

## Current State

- **Doppler migration COMPLETE — all 3 surfaces:** Surface 1 (app) → Doppler `expliq-mvp` (prd→Vercel, live; local = `doppler run -- npm run dev`); Surface 2 (MCP tooling) → Windows user-env; Surface 3 (n8n box) → Doppler `expliq-n8n-box/prd` + n8n store, box boots via `doppler run` (read-only token).
- **`.env` empty** (pointer comment); `.env.bak` deleted (19/19 home cross-check); `.env.example` = app vars only, complete.
- **n8n off-box backup** taken + **restore TEST-VALIDATED** (restored cred values byte-match prod).
- **Repo split DONE this session:** private repo **`Per-Paulsen/expliq-mvp-internal`** created + pushed; it holds `_resources/` (surface3 plan, box scripts `n8n-box-{backup,credential-sync}.sh`, ops-reference, encrypted backup) + `research-archive/` (all April spike research: v3..v9 + bootcamp). The public repo's `specs/research-spike-results/` (75 files) was removed.
- **Public repo cleaned:** added `specs/doppler-usage.md` (values-free Doppler reference); `.gitignore` now ignores `_resources/`, `.claude/scheduled_tasks.lock`, `specs/20-...-demo.md`. Two stray clipboard screenshots deleted.
- **Merged this session:** PR #15 (gitignore backups), #16 (.env.example), #17 (repo split + doppler-usage). All CI green (incl. gitleaks). Demo live throughout.

## Key Decisions

| Decision | Rationale |
|----------|-----------|
| Private repo `expliq-mvp-internal`, nested in `_resources/` | "git-backed but not public" needs a 2nd repo; `_resources/` is already gitignored by the public repo. |
| Surface 3 = backup, not per-value centralize | Recoverability goal; encryption key in Doppler + encrypted export = full restore. |
| `.env.example` / `doppler-usage.md` = public, values-free | Public repo documents the app + Doppler mechanics; no IDs/hosts/values ever. |
| `/handoff` skill updated (Step 2b) | Now forces a per-untracked-file decision (commit/delete/ignore) so artifacts stop drifting. Lives in `~/.claude/skills/handoff/`. |

## Open Questions / Pending

- **⚠️ SECURITY TODO: rotate 7 Surface-3 secrets.** During `.env` emptying a `Read` pulled their plaintext into the agent transcript (local, gitignored, but via the model API): `HCLOUD_TOKEN`, `RAG_DATABASE_URL` (Supabase pw), `GITHUB_SANDBOX_PAT`, `LINEAR_API_KEY`, `SLACK_BOT_TOKEN`, `SLACK_OAUTH_CLIENT_ID/SECRET`. Rotate at source → Doppler `expliq-n8n-box/prd` + n8n store via `n8n-box-credential-sync.sh` (in the private repo). Do NOT rotate `N8N_ENCRYPTION_KEY`.
- 1 old stash; empty `dev`/`stg` configs in `expliq-n8n-box` (can't delete root configs; harmless).

## Next Step

Rotate the 7 leaked Surface-3 secrets, highest-impact first (`RAG_DATABASE_URL`, `HCLOUD_TOKEN`): generate fresh value at source, revoke old, set new in Doppler `expliq-n8n-box/prd`, then push into the n8n store via the private repo's `n8n-box-credential-sync.sh` on the box.

## References

- **Public**: `specs/doppler-usage.md` (how Doppler is used here)
- **Private repo** `Per-Paulsen/expliq-mvp-internal` (cloned at `_resources/`): `surface3-n8n-box-plan-2026-05-28.md` (3 STATUS sections + the rotation runbook), `n8n-box-credential-sync.sh`, `n8n-box-backup.sh`, `portfolio-demo-ops-reference.md`
- **Memory**: `project_doppler_migration`
- **SSH**: `ssh -i ~/.ssh/expliq_n8n_ed25519 root@178.105.184.130` · local doppler at `%LOCALAPPDATA%\Microsoft\WinGet\Packages\Doppler.doppler_*\doppler.exe` (not on PATH)
- **Recent commits**: `88c88fb` (#17), `e4221ed` (#16), `f1275a7` (#15)
