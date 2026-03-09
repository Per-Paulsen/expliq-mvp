# 01 — Project Setup

## Scope

Initialize the full development environment and application foundation. This includes:

- Scaffold a Next.js 15 App Router project with TypeScript and Tailwind CSS
- Install and configure shadcn/ui component library
- Set up Prisma ORM with the complete database schema connected to Supabase PostgreSQL
- Create the app shell: sidebar layout with "Automations" nav item and placeholder routes (`/` for Workspace Snapshot, `/automations` for Portfolio, `/automations/[id]` for Automation Detail)
- Configure ESLint and Vitest
- Deploy the shell to Vercel

The Prisma schema must define all models upfront so subsequent epics can build on a stable foundation:

**Application models:**

- **User** — id, email, workspaceId *(no `passwordHash` — credential storage is determined by Auth.js strategy in epic 02)*
- **Workspace** — id, name, createdAt
- **ConnectorConfig** — id, workspaceId, platform (enum: `n8n`), instanceUrl (`String`), apiKeyEncrypted (`String`), lastSyncAt (`DateTime?`)
- **Automation** — id, workspaceId, externalId (`String` — n8n workflow ID), platform (`String`), rawWorkflowJson (`Json`), name (`String?`), description (`String?`), trigger (`String?`), triggerType (`String?` — e.g., webhook, schedule, manual, event), coreLogic (`String?`), systemsTouched (`String[]`), dataTypes (`String[]`), businessContext (`String?`), sideEffects (`String[]`), impactProposal (enum: `critical`, `high`, `medium`, `low` — nullable), impactOverride (same enum, nullable — human override of LLM suggestion), owner (`String?` — free-form text, not a FK to User), reviewCadenceDays (`Int`, default 30), lastReviewDate (`DateTime?`), automationLastUpdated (`DateTime?`), documentationLastUpdated (`DateTime?`), status (enum: `active`, `inactive`, `removed` — sync-derived, written by n8n connector), statusOverride (enum: `active`, `inactive`, `deprecated` — nullable, default null — human override of sync-derived status; effective status = `statusOverride ?? status`), createdAt, updatedAt

**Auth.js adapter models** (required by the Prisma adapter in epic 02):

- **Account** — id, userId, type, provider, providerAccountId, refresh_token, access_token, expires_at, token_type, scope, id_token, session_state
- **Session** — id, sessionToken, userId, expires
- **VerificationToken** — identifier, token, expires

All application models include `workspaceId` foreign keys to support future multi-tenancy. Auth.js models follow the [official Prisma adapter schema](https://authjs.dev/getting-started/adapters/prisma).

## Acceptance criteria

- [ ] `npm run dev` starts the Next.js app locally with TypeScript, Tailwind CSS, and shadcn/ui working
- [ ] Prisma schema defines User, Workspace, ConnectorConfig, Automation, Account, Session, and VerificationToken models; `npx prisma migrate dev` succeeds against Supabase PostgreSQL
- [ ] App shell renders a sidebar with "Automations" as the only nav item and routes to `/`, `/automations`, and `/automations/[id]` exist (showing placeholder content)
- [ ] Vitest is configured with at least one passing test
- [ ] ESLint is configured and passes on the codebase
- [ ] The app deploys successfully to Vercel

## Out of scope

- Authentication (no login, no session, no route protection)
- Any data fetching, API routes, or business logic
- Seed data or mock data
- Settings page or any functional UI beyond the shell

## Domain terms

| Term | Definition |
|------|-----------|
| **App shell** | The layout skeleton (sidebar + main content area) that persists across all routes |
| **Workspace** | A tenant container that scopes all data; auto-created on signup in epic 02 |
| **ConnectorConfig** | Stores credentials for an external platform (n8n instance URL + API key) |
| **Automation** | The central entity representing a single imported workflow with both raw data and LLM-generated fields |
| **externalId** | The workflow's ID in the source platform (e.g., n8n workflow ID), used for upsert matching |
| **impactProposal / impactOverride** | LLM-suggested impact level vs. human override; both use the same enum (`critical`, `high`, `medium`, `low`) |
| **status / statusOverride** | Sync-derived status (`active`, `inactive`, `removed`) vs. human override (`active`, `inactive`, `deprecated`). Effective status = `statusOverride ?? status` |
| **owner** | Free-form text field for the person responsible for an automation; not a FK to User (nullable = "missing owner") |

## Open questions

- What Supabase project/region to use? (Can be decided at implementation time)
- ~~Resolved: `statusOverride` field added to Automation model (enum: active, inactive, deprecated — nullable). Sync writes to `status`; user overrides write to `statusOverride`. Effective status = `statusOverride ?? status`.~~
