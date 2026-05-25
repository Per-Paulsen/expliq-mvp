# Portfolio Deploy — expliq

> Live state of the public portfolio demo for expliq. Read this before any
> change that touches login, landing page, middleware, cron, or seed
> infrastructure — it documents what's wired up in production.
>
> Sister-doc to apiq-mvp's `DEPLOY-PORTFOLIO.md`. Both projects share the
> same demo pattern (pre-seeded workspace + daily reset cron + one-click
> auto-login) but with project-specific data fixtures.

## Deploy model & branch discipline (READ FIRST)

**Production = the `main` branch.** Vercel auto-deploys production from `main`
via the GitHub integration: **every push to `main` goes live immediately** at
`https://expliq-mvp.vercel.app`. Verified against the Vercel deployment history
(every production deploy carries `githubCommitRef: main`, `githubDeployment: 1`).

- **Only git-tracked files on `main` reach production.** Vercel clones the repo
  at the pushed commit; untracked files (local dev artifacts) never ship.
- **Feature branches auto-deploy to isolated Preview URLs**, never to production
  (preview deploys carry `target: null`). Build and validate there first.
- **Local dev artifacts are gitignored** so they can never be committed to `main`
  or shipped: `screenshots/`, `.playwright-mcp/`, `.claude/projects/`,
  `.claude/settings.local.json`. `.vercelignore` is defense-in-depth for the
  legacy `vercel --prod` CLI path. Do **not** `git add .`; stage by path.

### Golden rule

Never push work-in-progress to `main`; it ships to the public demo at once.
Do all feature work (e.g. Epics 18-20) on a feature branch, validate on its
Vercel **preview** deploy, then merge to `main` only when demo-mode-safe.

### Pre-merge-to-`main` checklist

Before merging any feature (e.g. 18-20) into `main`:

1. **Preview verified**: the branch's Vercel preview URL works end-to-end.
2. **Prod env vars set first**: add any NEW required env vars in the Vercel
   project (Production) *before* merge, or the production build/runtime breaks.
3. **DB migration planned**: if the feature adds Prisma models/columns, run the
   migration against the production DB as part of the release (not after).
4. **Demo-mode preserved**: the demo-owned files below still behave (landing
   banner, auto-login, cron reset, seed). See "Files owned by the portfolio deploy".
5. **CI green**: branch-protection required checks (`ci / Lint & Test`,
   `gitleaks / Secret scan`) pass on the PR.

## Live state (since 2026-05-03)

| Item | Value |
|---|---|
| Production URL | https://expliq-mvp.vercel.app |
| GitHub repo | https://github.com/Per-Paulsen/expliq-mvp |
| Vercel project | per-paulsens-projects/expliq-mvp |
| Demo credentials | `demo@example.com` / `demo` |
| Demo content | 9 Automations + 7 BusinessProcesses + 12 Recommendations + CompanyProfile, all derived from the 9 Reference-tagged fairtix workflows in `n8n-api-examples/fairtix/` |
| Email redaction | 27 occurrences of 3 real-person emails replaced with `*@fairtix.example.com` before fixture capture |
| Daily reset | Vercel Cron at 03:00 UTC via `vercel.json` → `/api/cron/reset-demo` |
| Env-flag | `DEMO_MODE=true` — gates landing-banner + auto-login button + reset-cron route |
| Workspace LLM cap | $10/24h per workspace (existing v0.1) |

## Vercel production env vars (state)

Set: `DATABASE_URL`, `AUTH_SECRET`, `AUTH_URL` (= `https://expliq-mvp.vercel.app`), `AUTH_TRUST_HOST` (= `true`), `ENCRYPTION_KEY`, `OPENROUTER_API_KEY`, `OPENROUTER_MODEL`, `DEMO_MODE`, `CRON_SECRET`.

NOT set: `TURNSTILE_*` (expliq has no anti-bot on signup), `N8N_API_URL` / `N8N_API_KEY` (per-user connector credentials live in ConnectorConfig at runtime, not app-level; local-only for build-time n8n-MCP authoring).

Must be set before merging Epic 18: `N8N_SUPPORT_WEBHOOK_URL`, `N8N_SUPPORT_WEBHOOK_SECRET` (app-level; the support widget is a single shared channel, distinct from per-user connector auth).

## Files owned by the portfolio deploy

Future work that modifies these MUST preserve demo-mode behavior or update
this doc.

| File | Purpose | Notes |
|---|---|---|
| `src/app/(public)/page.tsx` | Landing page; renders the demo banner conditionally | If you redesign landing, keep the `DEMO_MODE === "true"` branch |
| `src/app/(public)/demo-login-action.ts` | Server-action that auto-logs in the demo user, redirects to `/dashboard` | If `/dashboard` route changes, update `redirectTo` here |
| `src/lib/seed-demo.ts` | Idempotent demo-workspace seed/replay logic; reads `scripts/seed-fixtures/demo-data.json` | If schema changes (Automation / BusinessProcess / Recommendation / CompanyProfile), update field mappings |
| `src/app/api/cron/reset-demo/route.ts` | Vercel-Cron daily reset endpoint, gated by `CRON_SECRET` + `DEMO_MODE` | |
| `src/middleware.ts` | Auth.js middleware matcher; `api/cron` is excluded so cron auth via `CRON_SECRET` works | If you add new public/cron routes, extend the matcher exception list |
| `vercel.json` | Cron schedule | Append new crons; do NOT replace |
| `scripts/redact-fairtix.ts` | Extracts + redacts the 9 Reference fairtix workflows | Re-run only if you update the email-redaction list or want to refresh from updated fairtix exports |
| `scripts/capture-demo-fixtures.ts` | Runs `runAnalysisPipeline()` against redacted workflows; captures fixtures | Re-run when `analyzeAutomation` / `analyzeWorkspace` prompts change AND you want the demo refreshed (~$1-2 LLM cost per run) |
| `scripts/seed-demo.ts` | One-time CLI wrapper for prod-DB seeding | Run after first deploy / schema changes |
| `scripts/seed-fixtures/fairtix-workflows-redacted.json` | Sanitized source data | Committed |
| `scripts/seed-fixtures/demo-data.json` | LLM-derived analysis output (9 Automations + 7 Processes + 12 Recommendations + CompanyProfile) | Committed; replayed on each daily reset; zero LLM cost at reset time |

## Honest gaps (acceptable for portfolio v0.1; tighten later if needed)

- **No Turnstile / anti-bot on signup** — expliq's design choice. Anyone can sign up; cost-bounded by per-workspace `$10/24h` LLM cap.
- **Same DB for dev + prod** — workspace-scoping isolates the demo workspace, but other dev test-workspaces coexist in the same Postgres. If a user signs up on prod, their workspace lives next to dev test data. Acceptable for a portfolio piece; revisit if user-volume grows.
- **`.env` not shipped via git-integration**: `.env*` is gitignored, so the
  production git-integration deploy never includes it (prod env vars are set in
  the Vercel project). The legacy `vercel --prod` CLI path *would* tar a local
  `.env`; `.vercelignore` does not exclude it, so avoid CLI deploys with a
  populated local `.env`.
- **CI/CD**: PR checks run via central reusable workflows
  (`Per-Paulsen/ci-workflows@v1`): `ci / Lint & Test` + `gitleaks / Secret scan`
  are required on `main` (branch protection, admin-bypass on). Production deploys
  automatically on every push/merge to `main` (see "Deploy model" above).
- **Demo workspace has no `ConnectorConfig`** — n8n-Sync buttons in the dashboard will fall through with "no connector configured" UX. Visitor cannot trigger live n8n API calls. By design.

## Operations

### Daily reset

Vercel Cron at 03:00 UTC → `GET /api/cron/reset-demo` with
`Authorization: Bearer $CRON_SECRET`. Wipes the demo workspace's
Automations + Processes + Recommendations + ConnectorConfig +
ProcessSuggestions + CompanyProfile, replays from the committed fixtures.
User row + Workspace row are kept for ID stability.

### Manual reset

```bash
CRON_SECRET=$(npx vercel env pull .env.tmp && grep CRON_SECRET .env.tmp | cut -d= -f2 | tr -d '"' && rm .env.tmp)
curl --ssl-no-revoke \
  -H "Authorization: Bearer $CRON_SECRET" \
  https://expliq-mvp.vercel.app/api/cron/reset-demo
```

Returns `{ success: true, resetAt, automationCount: 9, processCount: 7, recommendationCount: 12 }`.

### Refreshing the demo content

If the LLM pipeline evolves and you want the demo to show the new outputs:

```bash
# 1. Re-run capture (~$1-2 LLM cost)
npm run capture-demo-fixtures

# 2. Inspect the diff
git diff scripts/seed-fixtures/demo-data.json

# 3. Commit + push — production deploys automatically on merge to main
git add scripts/seed-fixtures/
git commit -m "chore: refresh demo fixtures from current pipeline"
git push origin main
# Vercel auto-deploys production from main via the GitHub integration.
# Manual CLI deploy (npx vercel --prod) is not needed and should be avoided
# (see "Deploy model" section above).

# 4. Trigger reset to apply
curl --ssl-no-revoke -H "Authorization: Bearer $CRON_SECRET" \
  https://expliq-mvp.vercel.app/api/cron/reset-demo
```

### Re-redacting fairtix source

If `n8n-api-examples/fairtix/workflows-list.json` is updated:

```bash
npm run redact-fairtix         # rewrites scripts/seed-fixtures/fairtix-workflows-redacted.json
npm run capture-demo-fixtures  # re-runs LLM pipeline (~$1-2)
git add scripts/seed-fixtures/ && git commit && git push
# Production deploys automatically on merge to main via Vercel GitHub integration.
```

## Rollback / kill-switch

If something goes very wrong:

1. **Vercel Dashboard → Project → Settings → Pause Deployment** — instant kill.
2. **Or set `DEMO_MODE=false` via Vercel env-vars** — banner disappears, auto-login refuses, cron no-ops. Production stays up; existing demo workspace becomes a regular (orphan) account.
3. **Or rotate `OPENROUTER_API_KEY`** — cuts off LLM-cost source. App keeps running but analysis breaks.

## Touchpoints for future epics

When adding new epics that touch:

- **Login flow / Auth.js config** — verify the demo auto-login still works (`signIn` from server-action with `redirectTo: "/dashboard"`); changes to `(auth)/login` UI don't affect demo auto-login since it bypasses the form
- **Landing page redesign** — preserve the `DEMO_MODE === "true"` conditional branch in `(public)/page.tsx`; demo-banner can move/restyle but must not disappear
- **Schema changes (Automation / BusinessProcess / Recommendation / CompanyProfile)** — update `src/lib/seed-demo.ts` field mappings AND re-run `npm run capture-demo-fixtures` (or hand-patch the fixture JSON if the change is small)
- **Sync flows (n8n connector / governance webhook)** — should be no-op for demo workspace because no `ConnectorConfig` is seeded; if you change behavior to require ConnectorConfig server-side, gate that with `DEMO_MODE` check
- **New Vercel-Cron jobs** — append to `vercel.json` `crons` array, don't replace
- **New `/api/*` routes** — if they're public/cron, add to `src/middleware.ts` matcher exception list
- **Outbound integrations (Epic 18+)** — the `sendSupportMessage` Server Action (`src/lib/actions/support.ts`) makes a server-side outbound POST to the self-hosted n8n support webhook (`N8N_SUPPORT_WEBHOOK_URL`). If the n8n host changes (new domain, rotated secret), update both Vercel env vars (`N8N_SUPPORT_WEBHOOK_URL`, `N8N_SUPPORT_WEBHOOK_SECRET`) before deploying.
- **Agentic triage (Epic 19)** — the n8n side of the same webhook is now agentic: the AI Agent performs sandboxed outbound writes (a GitHub issue in `Per-Paulsen/expliq-support-sandbox`, a Linear ticket in the "Expliq Support" team, and a Slack audit post to the private `support-triage-audit` channel). The Expliq app itself is unchanged in posture: it still only POSTs to the same `N8N_SUPPORT_WEBHOOK_URL` with the same secret, so **no new app-level env vars are required**. The response contract gained `actionsTaken[]` (parsed by the Server Action, surfaced in the widget); the internal `slackSummary` is never returned to the client.

## Sister deploy: apiq-mvp

Same pattern, same workflow. See `C:\Users\perpa\Dev\apiq-mvp\DEPLOY-PORTFOLIO.md` for context. Both projects use:

- `demo@example.com` / `demo` credentials
- 03:00 UTC daily reset
- `DEMO_MODE=true` env flag
- One-click auto-login server-action
- Pre-baked LLM fixtures (zero LLM cost at reset time)

Differences:
- expliq fixtures = 9 Automations + 7 Processes + 12 Recommendations + CompanyProfile (n8n-workflow-analysis)
- apiq fixtures = 1 Spec + 14 Findings (OpenAPI-spec-analysis)
- expliq has no Turnstile (no anti-bot)
- apiq's redirect target is `/specs`, expliq's is `/dashboard`
