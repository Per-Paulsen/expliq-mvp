---
tags:
  - type/handoff
  - status/ephemeral
---

# Handoff: Epic 18 M1 shipped + live — next is Epic 19 (M2, agentic actions)

**Generated**: 2026-05-25 · **Branch**: main · **Status**: Ready for next session

## Goal

Build the n8n AI support widget as a 3-milestone series (portfolio piece for an n8n Product Builder application). **M1 (Epic 18) is done + live in production.** Next: M2 = Epic 19 (turn the RAG answer workflow into an agent that takes external write actions), then M3 = Epic 20 (native MCP server door).

## Current State

- **Epic 18 M1 — COMPLETE + LIVE** on `expliq-mvp.vercel.app`. Merged PR #5 (`d414b3e`), panel-position fix PR #6 (`9bb18f8`), results finalized PR #7 (`1b5af71`). All acceptance criteria (A1–A8, B9–B13, C14–C22, D23–D24) met. Full build log: `specs/18-n8n-ai-support-triage-results.md`.
- Widget `src/components/support-widget.tsx` + server action `src/lib/actions/support.ts` are live; verified on prod with the demo session (`demo@example.com`/`demo`) → grounded answer + category badge over the live n8n webhook.
- **n8n box** live `https://178-105-184-130.sslip.io`; answer workflow `hcTllLJwyQZcpO2O` (ACTIVE) + KB indexer. Details in memory `project_epic18_infra`.
- **Vercel**: `N8N_SUPPORT_WEBHOOK_URL` + `N8N_SUPPORT_WEBHOOK_SECRET` set in **Preview + Production**. Vercel CLI installed + logged in (`per-paulsen`).
- **Branches**: only `main` — all feature branches merged + deleted.
- **Local-build quirk**: `npm run build`/`dev` need `NEXT_TURBOPACK_EXPERIMENTAL_USE_SYSTEM_TLS_CERTS=1` (Google-fonts TLS on this machine); Vercel unaffected.
- **Working tree**: clean except long-parked untracked files (research spikes, bootcamp patches) — NOT epic-18, leave them.

## Key Decisions

| Decision | Rationale |
|----------|-----------|
| `per-claude-skills` → **v1.3.0** | `/dev` + `/patch` now branch-guard (never commit to `main`; derive a feature branch from the spec/slug, use an existing feature branch as-is) + stage by explicit path; `/ship` adds Step 6 that asks to merge after green checks (never auto-merges). Source: `C:\Users\perpa\Dev\per-claude-skills`. |
| Policy A: doc/results updates ride with their code PR | One rule (everything via PR), no "direct to main" carve-out for docs. |
| Remote Control on globally | `remoteControlAtStartup` + `daemonColdStart:ask` + push notifs in `~/.claude/settings.json` (active next session; say "ja" to the persistent-daemon prompt). |
| Build log / IDs → results file, never memory | Per's rule — see memory `feedback_no_build_log_in_memory`. |

## Open Questions / Pending

- **Epic 19 (M2) not started.** Confirm its sandbox prerequisites first (per the runbook): a GitHub sandbox repo, a Linear test board, a Slack workspace + private channel + tokens.
- Epic 19 extends the response contract (`actionsTaken[]` + `slackSummary`) → the widget renders only `reply` + `category` today; will need extension.
- Rate limit is best-effort in-memory (KV/Upstash deferred, spec-acknowledged).
- Parked untracked files (research spikes, bootcamp patches) — decide separately, not epic-18.

## Next Step

Open `specs/19-agentic-triage-actions.md`, confirm the M2 sandbox prerequisites (GitHub / Linear / Slack test targets) are in place, then run `/dev specs/19-agentic-triage-actions.md` — it now auto-branches from `main` (no manual branch step needed).

## References

- **Results / build log**: `specs/18-n8n-ai-support-triage-results.md` · **Specs**: `specs/19-agentic-triage-actions.md`, `specs/20-n8n-mcp-server-door.md` · **Runbook**: `specs/18-n8n-ai-support-triage-runbook.md`
- **Memory**: `project_epic18_infra` (box + workflow id), `feedback_no_build_log_in_memory`, `feedback_surface_scope_decisions`, `feedback_selective_commits`
- **Plugin**: `per-claude-skills` v1.3.0 (source `C:\Users\perpa\Dev\per-claude-skills`, marketplace pulls from its `main`)
- **Recent commits**: `1b5af71` results-finalize · `9bb18f8` panel-fix · `d414b3e` epic-18 merge
