---
tags:
  - type/index
---

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start dev server (Turbopack)
npm run build        # Production build
npm run lint         # ESLint (flat config)
npm run test         # Vitest (single run)
npm run test:watch   # Vitest (watch mode)
npx prisma migrate dev --name <name>  # Run database migration
npx prisma generate  # Regenerate Prisma client
```

Run a single test file: `npx vitest run src/__tests__/home.test.tsx`

## Architecture

**Next.js App Router** with `src/` directory. Route groups split layout concerns:
- `src/app/(app)/` — protected pages with sidebar (`SidebarProvider` + `AppSidebar` + `SidebarInset`)
- `src/app/(auth)/` — login/signup pages, centered layout, no sidebar
- `src/app/api/` — API route handlers

**Routes:** `/` (Workspace Snapshot), `/automations` (Portfolio), `/automations/[id]` (Automation Detail), `/login`, `/signup`

**Auth:** Auth.js v5 (next-auth) with Credentials provider and JWT sessions. Config split into two files:
- `src/lib/auth.config.ts` — lightweight, Edge-safe (route protection logic only, no DB imports)
- `src/lib/auth.ts` — full config with PrismaAdapter, Credentials provider, bcrypt
- `src/middleware.ts` — imports only `auth.config.ts` (Edge Runtime can't use Prisma/bcrypt)
- `src/lib/session.ts` — `getRequiredSession()` returns session with `user.id` and `user.workspaceId`

**Database:** Prisma 7 with Supabase PostgreSQL. Schema at `prisma/schema.prisma`, datasource config at `prisma.config.ts`. Generated client at `src/generated/prisma/`. **Import from `@/generated/prisma/client`** (not `@/generated/prisma` — no index.ts). Runtime client requires driver adapter: `new PrismaClient({ adapter: new PrismaPg({ connectionString }) })`. Singleton at `src/lib/prisma.ts`.

**Models:** Workspace, User (has `passwordHash`), ConnectorConfig, Automation + Auth.js adapter models (Account, Session, VerificationToken). All application models scoped by `workspaceId`.

**Components:** shadcn/ui primitives in `src/components/ui/`, custom components in `src/components/`. Use `cn()` from `src/lib/utils.ts` for className merging.

## Key Conventions

- **Dynamic route params are async** (Next.js 15+): `{ params }: { params: Promise<{ id: string }> }` — must `await params`
- **shadcn/ui sidebar** uses `render` prop pattern (not `asChild`), `SidebarProvider` lives in `(app)/layout.tsx`
- **Tailwind v4**: CSS-first config via `src/app/globals.css`, not `tailwind.config.ts`
- **Path alias**: `@/*` maps to `src/*`
- **Prisma 7**: Datasource configured in `prisma.config.ts` with `dotenv`, not inline in schema. Import from `@/generated/prisma/client`.
- **Prisma client**: Always use the singleton from `@/lib/prisma` — never instantiate `PrismaClient` directly
- **Auth in server components**: Use `getRequiredSession()` from `@/lib/session` to get `userId` and `workspaceId`
- **New protected pages** go in `src/app/(app)/`, auth-only pages in `src/app/(auth)/`
- **Vitest**: jsdom environment, globals enabled, setup file imports `@testing-library/jest-dom`. Alias `@/generated/prisma/client` configured in `vitest.config.ts`.

## Specs & Epics

PRD at [`expliq_prd.md`](expliq_prd.md). Ten sequential epics — see [Map of Content](_MOC.md) for the full index.

## Workflow Rules

- **Do not modify spec files.** If unclear, ask.
- **Do not go beyond the spec.** Only build what the spec defines.
- **All discussions happen in markdown files**, not chat. Chat is for status updates only.
- **Commit format**: `feat: implement epic {number} — {name}`
