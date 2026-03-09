# 01 — Project Setup — Brainstorming

## Proactive Review

### 1. Missing Auth.js adapter models — Hidden scope creep

The spec states the Prisma schema should define "all core models upfront so subsequent epics can build on a stable foundation." However, epic 02 (Auth) uses Auth.js with the Prisma adapter, which requires `Account`, `Session`, and `VerificationToken` models in the schema. These are not listed in epic 01's schema.

**Two options:**
- (a) Add the Auth.js adapter models to this epic's Prisma schema now, so epic 02 just configures Auth.js against an existing schema
- (b) Leave them out and let epic 02 add its own migration for those models

**Recommendation:** Option (a) — it aligns with the stated goal of defining the full schema upfront. These are boilerplate models with well-documented structures. If we go with (b), the claim "subsequent epics can build on a stable foundation" is weakened on the very next epic.

### 2. Automation field types unspecified — Missing / untestable acceptance criteria

Several Automation fields have ambiguous types:

| Field | Question |
|-------|----------|
| `systemsTouched` | `String[]` array? `Json`? Comma-separated `String`? |
| `dataTypes` | Same as above |
| `sideEffects` | Free-form `String`? `Json` array of structured objects? |
| `impactProposal` | Enum (e.g., high/medium/low)? Free-form string? |
| `impactOverride` | Same as `impactProposal`? Nullable override of the LLM suggestion? |
| `trigger` | `String` (e.g., "webhook", "cron schedule")? |
| `triggerType` | Enum? How does it differ from `trigger`? |
| `coreLogic` | Free-form text? Structured JSON? |
| `businessContext` | Same question |

Without these types, `npx prisma migrate dev` can "succeed" but produce a schema that doesn't match what later epics expect, forcing migrations in epic 04/05/06.

**Recommendation:** Specify Prisma types for every field. Suggested defaults:
- `systemsTouched`, `dataTypes`, `sideEffects` → `String[]` (Postgres array)
- `trigger`, `coreLogic`, `businessContext` → `String` (free-form text from LLM)
- `triggerType` → enum (`webhook`, `schedule`, `manual`, `event`) or `String` if the LLM decides
- `impactProposal` → enum (`critical`, `high`, `medium`, `low`) — the LLM-suggested level
- `impactOverride` → same enum, nullable — the human override

### 3. `passwordHash` on User vs Auth.js conventions — Ungrounded assumption

The User model includes `passwordHash`. Auth.js's Prisma adapter stores credentials in the `Account` model, not as a `passwordHash` field on `User`. A custom Credentials provider *can* use `passwordHash` on `User`, but this bypasses Auth.js's built-in account linking model.

**Recommendation:** Either (a) remove `passwordHash` from the User model here and let epic 02 define where credential data lives based on the Auth.js strategy chosen, or (b) explicitly note that a custom Credentials provider with `passwordHash` on User is the intended approach, and Auth.js's `Account` model stores only the provider linkage.

### 4. Next.js version — Minor clarification

The spec says "Next.js 14+". As of March 2026, Next.js 15 is well established. Pinning to a specific major version avoids ambiguity during implementation.

**Recommendation:** Specify "Next.js 15" (or whatever the current stable is at implementation time). Minor point — no action needed if the implementer just uses `latest`.

### 5. `owner` field type on Automation — Inconsistent domain language

The PRD mentions "owner" as a governance field (who is responsible for an automation). The Automation model lists `owner` as a field, but it's unclear whether this is:
- A `String` (free-form name)
- A foreign key to `User.id`
- Nullable (since it can be "missing" per the PRD's "missing owners" metric)

Specs 05 (Risk Engine) and 08 (Workspace Snapshot) reference "missing owners" as a key metric. If `owner` is a `userId` FK, then "missing" means null. If it's a free-form string imported from n8n, the semantics differ.

**Recommendation:** Define `owner` as `String?` (nullable free-form text) for now — n8n workflows don't have a native "owner" field, so this will likely be manually assigned or LLM-suggested. Add a note that it's not a FK to User.

### 6. No issues found in the following areas

- **Scope sizing** — The epic is appropriately scoped for a setup task
- **Route structure** — `/`, `/automations`, `/automations/[id]` aligns with the PRD's three screens
- **Out of scope** — Clean boundaries; no auth, no data fetching, no seed data
- **Domain terms** — Consistent with specs 02 and 03

i agree with all your recommmendations. but i have a different question: how is this epic "implemented"? i probably have to do a lot of manual work such as making a supabase account and so on ... do i also have to make an anthropic account for the later llm and so on? do we do this incrementally? do you guide me through this process when you need my manual labor?

**Response:** Yes — the implementation is incremental, epic by epic, and I guide you through each step. Here's how it works in practice:

**For this epic (01 — Project Setup), the workflow would be:**

1. **I do the code work** — scaffold the Next.js project, configure Tailwind/shadcn/ui, write the Prisma schema, create the app shell layout, set up ESLint and Vitest. You approve changes as I go.
2. **You do the account/infra work when I tell you it's needed** — I'll pause and walk you through each manual step:
   - **Supabase**: Create a project, pick a region, grab the connection string. I'll tell you exactly what to click and which env vars to paste back.
   - **Vercel**: Connect the repo for deployment. Same guided walkthrough.
3. **We verify together** — `npm run dev`, `npx prisma migrate dev`, deploy to Vercel, confirm ACs pass.

**For later epics, the same pattern applies — only when needed:**

| Epic | Manual steps from you |
|------|-----------------------|
| 01 — Project Setup | Supabase account + project, Vercel deployment |
| 02 — Auth | None (all code) |
| 03 — n8n Connector | You need an n8n instance (cloud or self-hosted) with some test workflows |
| 04 — LLM Pipeline | Anthropic API key (yes, you'll need an account — but **not until epic 04**) |
| 05–08 | None expected |

**Key principle: you never set up anything before the epic that needs it.** No Anthropic account now, no n8n instance now. Each epic tells you exactly what it needs at the start.

So to directly answer your questions:
- **Do you have to make an Anthropic account now?** No. That's epic 04.
- **Do we do this incrementally?** Yes. One epic at a time, in order.
- **Do I guide you?** Yes. When I need you to do something manual (create an account, copy a connection string, click a deploy button), I'll pause, give you step-by-step instructions, and wait for you to confirm before continuing.

## Refinement Applied

Changes made to `specs/01-project-setup.md`:

1. **Next.js version** — Changed "Next.js 14+" → "Next.js 15"
2. **Auth.js adapter models added** — `Account`, `Session`, `VerificationToken` models added to the Prisma schema section
3. **`passwordHash` removed from User** — Replaced with a note that credential storage is determined by Auth.js strategy in epic 02
4. **Automation field types specified** — Every field now has an explicit Prisma type (`String?`, `String[]`, `Json`, enum, `Int`, `DateTime?`)
5. **`owner` clarified** — Defined as `String?` (nullable free-form text, not a FK to User); added to domain terms
6. **`impactProposal` / `impactOverride` clarified** — Defined as enums (`critical`, `high`, `medium`, `low`), both nullable; added to domain terms
7. **Acceptance criteria updated** — Now lists all 7 models including Auth.js adapter models
8. **Open question resolved** — Removed UUID vs CUID question (will use `cuid()` as the Prisma default)