# 01 — Project Setup: Results

## What was built
- Next.js App Router project with TypeScript, Tailwind CSS v4, and shadcn/ui
- Prisma 7 ORM with complete database schema (7 models, 4 enums) migrated to Supabase PostgreSQL
- App shell with sidebar layout: "Expliq" branding, "Automations" nav item
- Three placeholder routes: `/` (Workspace Snapshot), `/automations` (Portfolio), `/automations/[id]` (Automation Detail)
- Vitest configured with 1 passing test
- ESLint configured and passing
- Deployed to Vercel

## Key files created/modified
| File | Purpose |
|------|---------|
| `prisma/schema.prisma` | 7 models (Workspace, User, ConnectorConfig, Automation, Account, Session, VerificationToken), 4 enums |
| `prisma.config.ts` | Prisma 7 datasource config (replaces url/directUrl in schema) |
| `src/app/layout.tsx` | Root layout with SidebarProvider + AppSidebar |
| `src/components/app-sidebar.tsx` | Sidebar with Expliq branding and Automations nav |
| `src/app/page.tsx` | Workspace Snapshot placeholder |
| `src/app/automations/page.tsx` | Portfolio placeholder |
| `src/app/automations/[id]/page.tsx` | Automation Detail placeholder (async params) |
| `vitest.config.ts` | Vitest config with jsdom, React plugin, @/ alias |
| `src/__tests__/home.test.tsx` | Renders WorkspaceSnapshotPage, asserts heading |
| `.env.example` | Supabase connection string placeholders |

## Decisions and deviations from spec
- **Prisma 7** (not Prisma 5/6): `create-next-app` installed Prisma 7 which uses `prisma.config.ts` for datasource configuration instead of `url`/`directUrl` fields in schema.prisma. Requires `dotenv` package.
- **Next.js 16.1.6** installed (latest at time of scaffolding). App Router API is compatible with the spec's Next.js 15 target.
- **Tailwind CSS v4**: Installed by create-next-app; uses CSS-first config approach instead of `tailwind.config.ts`.
- **shadcn/ui sidebar**: Uses `render` prop pattern (not `asChild`) for polymorphic components.
- **Supabase connection**: Uses pooler URL format (`aws-1-eu-west-1.pooler.supabase.com`), port 5432 (session mode) for migrations.

## Verification results
- `npm run lint` — passed, zero errors
- `npm run test` — 1 test file, 1 test passed
- `npm run build` — succeeded, all 3 routes registered (2 static, 1 dynamic)
- `npm run dev` — starts successfully with Turbopack
- Prisma migration — applied successfully to Supabase
- Vercel deployment — succeeded

## Open questions
- **Prisma 7 `directUrl`**: Removed from `prisma.config.ts` (caused TS error in build). May need revisiting if production requires separate pooled vs direct connection strings.
- **Supabase connection modes**: Local dev uses session mode (port 5432). Vercel production should use transaction/pooled mode (port 6543) — currently set in Vercel env vars but not enforced.
- **shadcn/ui `render` prop**: Sidebar uses `render` prop pattern instead of `asChild`. Verify compatibility if shadcn/ui is updated.

## Commit
`f9ecf93` — `feat: implement epic 01 — project setup`
