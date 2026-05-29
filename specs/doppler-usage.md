---
tags:
  - type/reference
  - status/done
---

# Doppler — How Secrets Work in This Repo

> Reference for any future session. **Mechanics only — no secret values, no credential IDs, no
> live host URLs.** Those live in Doppler and in the private internal notes (not in this public repo).

All secrets are managed in **Doppler** (a central secrets vault). The local `.env` is intentionally
empty — it holds only a pointer comment. Nothing reads secrets from a committed file.

## Run the app locally

```bash
doppler run -- npm run dev      # injects the dev config into the process env
doppler run -- npm run build    # same, for a prod-like build
```

If a command needs secrets and you skip `doppler run`, it will fail with missing-env errors. That
is expected — the values are in Doppler, not in `.env`.

## The two Doppler projects

| Project | What it holds | Consumed by |
|---------|---------------|-------------|
| `expliq-mvp` | App runtime secrets (DB, Auth.js, OpenRouter, the support-widget webhook URL/secret) | The Next.js app. Config `prd` **syncs to Vercel** (Production); `dev` is for local. |
| `expliq-n8n-box` | Secrets for the self-hosted n8n box (encryption key + the box's API/integration credentials) | The Hetzner n8n box, which boots via `doppler run`. Config `prd`. |

Each project uses Doppler's default `dev` / `stg` / `prd` configs; only the ones above are used
(`stg` is unused, kept for the standard 3-config layout).

## The three "surfaces" (where each secret lives)

1. **App** → Doppler `expliq-mvp` (`dev` local, `prd` → Vercel).
2. **Claude Code / MCP tooling** → **Windows user-env**, *not* Doppler. These (e.g. `DOPPLER_TOKEN`,
   the n8n-MCP API vars) are machine-level and referenced by `.mcp.json` via `${VAR}`. Putting them
   in Doppler would force every `claude` invocation to be wrapped in `doppler run`.
3. **n8n box** → Doppler `expliq-n8n-box` **and** the n8n credential store on the box itself.

## Authentication

- The Doppler CLI and the Doppler MCP authenticate via a **`DOPPLER_TOKEN`** in the Windows
  user-env — **not** `doppler login` (that flow is unreliable here).
- The n8n box authenticates with a **read-only** service token scoped to `expliq-n8n-box/prd`.

## Vercel sync (production)

`expliq-mvp/prd` → Vercel is wired through Doppler's native Vercel integration (Dashboard →
Integrations → Vercel), scoped to the `expliq-mvp` Vercel project, `prd` → Production, marked
Sensitive. After changing a prod secret, redeploy with `vercel redeploy` (not `vercel --prod`,
which would rebuild from local).

## Conventions (important)

- **Never put secret values through an MCP tool argument or the chat** — they would land in the
  agent transcript. Set values via the Doppler dashboard import or the CLI (`doppler secrets set`)
  directly; for box secrets, set them **on the box** so the value never leaves it.
- **Never `Read` a secret-bearing file just to edit it** — overwrite it on disk instead, so values
  don't enter the model context.
- `.env` stays empty; `.env.example` documents the **app** variables only (placeholders, no values).
- A few app keys are prod-only: `CRON_SECRET`, `AUTH_TRUST_HOST` (behind Vercel's proxy).
  `OPENROUTER_PER_AUTOMATION_MODEL` falls back to a default model if unset.

## Common operations

```bash
# list secret NAMES (no values) for a project/config
doppler secrets --only-names --project expliq-mvp --config dev

# set one secret (value stays local to your shell)
doppler secrets set MY_KEY="..." --project expliq-mvp --config dev

# run any command with secrets injected
doppler run --project expliq-mvp --config dev -- <command>
```

> Operational specifics (live host, workflow/credential IDs, the box backup + credential-sync
> scripts, and the secret-rotation runbook) are kept in the **private internal repo**, never here.
