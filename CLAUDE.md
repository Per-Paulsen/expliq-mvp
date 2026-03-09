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

**Next.js App Router** with `src/` directory. All pages are under `src/app/`. Layout uses shadcn/ui `SidebarProvider` wrapping `AppSidebar` + `SidebarInset`.

**Routes:** `/` (Workspace Snapshot), `/automations` (Portfolio), `/automations/[id]` (Automation Detail)

**Database:** Prisma 7 with Supabase PostgreSQL. Schema at `prisma/schema.prisma`, datasource config at `prisma.config.ts` (Prisma 7 uses this file instead of url/directUrl in schema). Generated client outputs to `src/generated/prisma/`.

**Models:** Workspace, User, ConnectorConfig, Automation + Auth.js adapter models (Account, Session, VerificationToken). All application models scoped by `workspaceId`.

**Components:** shadcn/ui primitives in `src/components/ui/`, custom components in `src/components/`. Use `cn()` from `src/lib/utils.ts` for className merging.

## Key Conventions

- **Dynamic route params are async** (Next.js 15+): `{ params }: { params: Promise<{ id: string }> }` — must `await params`
- **shadcn/ui sidebar** uses `render` prop pattern (not `asChild`), requires `SidebarProvider` wrapper in root layout
- **Tailwind v4**: CSS-first config via `src/app/globals.css`, not `tailwind.config.ts`
- **Path alias**: `@/*` maps to `src/*`
- **Prisma 7**: Datasource configured in `prisma.config.ts` with `dotenv`, not inline in schema
- **Vitest**: jsdom environment, globals enabled, setup file imports `@testing-library/jest-dom`

## Specs & Epics

PRD at `expliq_prd.md`. Eight sequential epics in `specs/01-*.md` through `specs/08-*.md`. Each epic has a brainstorming companion file. Completed epics get a `specs/{number}-{name}-results.md`.

## Workflow Rules

- **Do not modify spec files.** If unclear, ask.
- **Do not go beyond the spec.** Only build what the spec defines.
- **All discussions happen in markdown files**, not chat. Chat is for status updates only.
- **Commit format**: `feat: implement epic {number} — {name}`
