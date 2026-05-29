---
tags:
  - type/handoff
  - status/ephemeral
---

# Handoff: Doppler migration COMPLETE — only secret-rotation left

**Generated**: 2026-05-29 17:45  ·  **Branch**: `main`  ·  **Status**: Ready for next session

## Repo Snapshot

> Script-collected (Step 2a). Source of truth — do not paraphrase.

- **Branch**: `main` (ahead 0, behind 0 of `origin/main`)
- **HEAD**: `e4221ed` — docs: align .env.example with Doppler + real var names (#16)
- **Working tree**: 8 untracked, 2 modified (`.gitignore`, `_HANDOFF.md`), 0 staged
- **Stash**: 1 entry (old: "session wip: specs/env/seed parked for epic-18 switch")
- **Uncommitted paths**:
  - Modified (to commit via PR): `.gitignore` (now ignores `.claude/scheduled_tasks.lock` + the whole `_resources/`), `_HANDOFF.md`
  - Untracked, **pending individual triage** (user chose to do this pass next; unused scripts to be deleted): `scripts/research-spike-v9-{collect,enrich,run,test-single}.ts`, `specs/research-spike-results/v9/`, `specs/20-n8n-mcp-server-door-demo.md` (live URLs), `specs/patches/bootcamp-analysis-{explained.md,raw.json}` (email + cloud URL)
- **Cleaned this session**: deleted a stray clipboard screenshot from repo root; gitignored `.claude/scheduled_tasks.lock`; gitignored the entire `_resources/` dir (6 internal ops/plan files with host+credential-IDs — local-only, off public `main`, no more git-status noise). Updated the `/handoff` skill (Step 2b) to force a per-untracked-file decision so artifacts stop drifting across sessions.

## Goal

End the `.env`/Vercel/Hetzner secret fragmentation: every secret has exactly one home (Doppler or Windows-env), the local `.env` is empty, and the self-hosted n8n box is recoverable.

## Current State

- **Doppler migration COMPLETE — all 3 surfaces done:**
  - Surface 1 (app) → Doppler `expliq-mvp` (dev+prd; prd→Vercel). Live. Local dev = `doppler run -- npm run dev`.
  - Surface 2 (MCP tooling) → Windows user-env (by design): `DOPPLER_TOKEN`, `N8N_MCP_API_KEY/URL` confirmed present.
  - Surface 3 (n8n box) → Doppler `expliq-n8n-box/prd` (10 secrets: 8 box + `N8N_API_KEY` + `N8N_ENCRYPTION_KEY`) + the n8n credential store. Box boots via `doppler run`; box token is **read-only**.
- **`.env` emptied** (pointer comment only); `.env.bak` **deleted** after a 19/19 home cross-check; `.env.example` cleaned + completed (PR #16).
- **n8n off-box backup** taken + **restore TEST-VALIDATED** (throwaway container; restored cred values byte-match prod). Tarball in `_resources/n8n-backups/` (gitignored, PR #15). Re-run: `bash /opt/n8n/n8n-box-backup.sh <stamp>` + scp.
- **Merged this session:** PR #15 (gitignore backups), PR #16 (.env.example). 2 dead n8n credentials deleted (now 8, all active).
- Demo (`expliq-mvp.vercel.app`) functional throughout; box `/healthz` 200.

## Key Decisions

| Decision | Rationale |
|----------|-----------|
| Surface 3 = **backup**, not per-value centralization | Goal is recoverability; encryption key in Doppler + encrypted off-box export = full restore. (Per-value sync script exists + proven, not the path taken.) |
| Box token **read-only** | `doppler run` only reads; one-time writes used the personal token. |
| Backup **manual, no cron** | Box-local cron = false safety (dies with the box). Re-run on workflow change. |
| `.env.example` = **app variables only** | It documents the Next.js app; box/MCP-foreign secrets do not belong in it. |

## Open Questions / Pending

- **⚠️ SECURITY TODO (deferred by user): rotate 7 Surface-3 secrets.** Emptying `.env` needed a `Read` that pulled their plaintext into the agent transcript (local + gitignored, but via the model API): `HCLOUD_TOKEN`, `RAG_DATABASE_URL` (Supabase pw), `GITHUB_SANDBOX_PAT`, `LINEAR_API_KEY`, `SLACK_BOT_TOKEN`, `SLACK_OAUTH_CLIENT_ID/SECRET`. Rotate at source → set new in Doppler `expliq-n8n-box/prd` + n8n store via `n8n-box-credential-sync.sh`.
- **8 untracked files pending individual triage** (explicit user choice, not silent deferral): the 4 `research-spike-v9-*.ts` + `research-spike-results/v9/` (unused spike — user said deletable), `specs/20-...-demo.md` (live URLs), `bootcamp-analysis-{explained,raw}` (email+cloud URL). Decide commit/delete/ignore per file.
- 1 old stash; empty `dev`/`stg` configs in `expliq-n8n-box` (can't delete root configs; harmless).

## Next Step

Rotate the 7 leaked Surface-3 secrets: for each, generate a fresh value at the source, revoke the old, then run the rotate-and-set machinery (`_resources/n8n-box-credential-sync.sh` on the box, fed from Doppler `expliq-n8n-box/prd`). Start highest-impact: `RAG_DATABASE_URL` + `HCLOUD_TOKEN`. Do NOT rotate `N8N_ENCRYPTION_KEY`.

## References

- **Plan + full build-log**: `_resources/surface3-n8n-box-plan-2026-05-28.md` (three dated STATUS sections at the end)
- **Inventory**: `_resources/expliq-credential-inventory-2026-05-28.md` · **Migration plan**: `_resources/doppler-migration-plan-2026-05-28.md`
- **Scripts** (on box at `/opt/n8n/`): `_resources/n8n-box-backup.sh`, `_resources/n8n-box-credential-sync.sh`
- **Memory**: `project_doppler_migration` (lean status pointer)
- **Recent commits**: `e4221ed` (#16 .env.example), `f1275a7` (#15 gitignore backups)
- **SSH**: `ssh -i ~/.ssh/expliq_n8n_ed25519 root@178.105.184.130` · local doppler at `%LOCALAPPDATA%\Microsoft\WinGet\Packages\Doppler.doppler_*\doppler.exe` (not on PATH)
