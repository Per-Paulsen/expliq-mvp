# Epic 02 — Authentication: Results

## What Was Built

Email/password authentication using Auth.js v5 (NextAuth) with Credentials provider and JWT session strategy. Full signup, login, logout, route protection, and session management with `userId` and `workspaceId`.

## Key Files Created/Modified

### New Files (15)
| File | Purpose |
|------|---------|
| `src/lib/prisma.ts` | Prisma client singleton with `@prisma/adapter-pg` driver adapter |
| `src/lib/auth.ts` | Auth.js v5 config — Credentials provider, PrismaAdapter, JWT callbacks |
| `src/lib/auth.config.ts` | Lightweight auth config for Edge middleware (no Prisma/bcrypt imports) |
| `src/lib/actions/auth.ts` | Signup server action — validation, bcrypt hash, transactional Workspace+User creation |
| `src/lib/session.ts` | `getRequiredSession()` helper for server components |
| `src/types/next-auth.d.ts` | Type augmentation — `workspaceId` on Session and JWT |
| `src/app/api/auth/[...nextauth]/route.ts` | Auth.js route handler |
| `src/middleware.ts` | Route protection middleware using auth.config.ts |
| `src/components/session-provider.tsx` | Client-side SessionProvider wrapper |
| `src/components/sign-out-button.tsx` | Sign out button component |
| `src/app/(app)/layout.tsx` | App layout with sidebar (moved from root) |
| `src/app/(auth)/layout.tsx` | Auth layout — centered, no sidebar |
| `src/app/(auth)/login/page.tsx` | Login page |
| `src/app/(auth)/signup/page.tsx` | Signup page |
| `src/__tests__/auth-actions.test.ts` | 6 unit tests for signup action |

### Modified Files (7)
| File | Change |
|------|--------|
| `prisma/schema.prisma` | Added `passwordHash String?` to User model |
| `package.json` | Added next-auth, @auth/prisma-adapter, bcrypt, @prisma/adapter-pg |
| `.env.example` | Added AUTH_SECRET and AUTH_URL |
| `src/app/layout.tsx` | Stripped sidebar, added AuthSessionProvider |
| `src/components/app-sidebar.tsx` | Added SidebarFooter with SignOutButton |
| `vitest.config.ts` | Added `@/generated/prisma/client` alias |
| `src/__tests__/home.test.tsx` | Updated import path for route group move |

### Moved Files (3)
- `src/app/page.tsx` → `src/app/(app)/page.tsx`
- `src/app/automations/page.tsx` → `src/app/(app)/automations/page.tsx`
- `src/app/automations/[id]/page.tsx` → `src/app/(app)/automations/[id]/page.tsx`

## Decisions and Deviations from Spec

1. **JWT sessions instead of database sessions** — Auth.js v5 Credentials provider does not support database session strategy. Used JWT with `userId` and `workspaceId` embedded in the token. The existing Session model remains in the schema for potential future OAuth providers.

2. **Split auth config** (`auth.config.ts` + `auth.ts`) — Next.js 16 middleware runs in Edge Runtime, which doesn't support Node.js modules (Prisma, bcrypt). Split the auth config so middleware only imports the lightweight `auth.config.ts` (route protection logic only, no DB access).

3. **Prisma 7 driver adapter** — Prisma 7 requires an explicit driver adapter at runtime (`@prisma/adapter-pg`). The PrismaClient constructor needs `{ adapter: new PrismaPg({ connectionString }) }`. This was not anticipated in the spec.

4. **next-auth@5.0.0-beta.30** — Auth.js v5 is still in beta. Installed version is `5.0.0-beta.30` with `@auth/prisma-adapter@2.11.1`.

5. **Next.js 16 middleware deprecation** — Next.js 16 shows a warning that `middleware` convention is deprecated in favor of `proxy`. The middleware still works but this may need migration in a future epic.

## Verification Results

| Check | Result |
|-------|--------|
| `npm run build` | Pass |
| `npm run lint` | Pass |
| `npm run test` (15 tests) | Pass |
| Signup creates User + Workspace | Pass |
| Duplicate signup shows error | Pass |
| Login with valid credentials | Pass |
| Login with bad credentials shows generic error | Pass |
| Route protection (redirect to /login) | Pass |
| Auth page redirect when logged in | Pass |
| Logout redirects to /login | Pass |
| Session exposes userId and workspaceId | Pass |
| Automations route accessible when logged in | Pass |

## Risks for Future Epics

1. **next-auth beta** — v5 is still beta. API may change. Pin version in package.json if stability is needed.

2. **Middleware deprecation** — Next.js 16 deprecates `middleware.ts` in favor of `proxy`. Future epics or a Next.js upgrade may require migrating route protection to the proxy pattern.

3. **Prisma 7 adapter-pg** — Adding `@prisma/adapter-pg` means the runtime client needs a `DATABASE_URL` connection string. Any future change to the database connection pattern must update `src/lib/prisma.ts`.

4. **Edge Runtime limitations** — The auth config split (`auth.config.ts` for middleware, `auth.ts` for server) means any middleware logic that needs DB access would require rethinking the architecture.

5. **Session data caching** — The JWT `jwt` callback only fetches `workspaceId` on sign-in. If a user's workspace changes, they'd need to re-authenticate to get the updated workspaceId in their token.

## Open Questions

- Should we add password strength requirements beyond minimum 8 characters?
- Should the middleware warning about deprecated `middleware` convention be addressed now or deferred?

what is your recommendation on both?

### Recommendations

**Password strength** — Defer. The current 8-character minimum is fine for an MVP. Stronger validation (uppercase, numbers, symbols) adds friction without meaningfully reducing risk at this stage. Revisit when there are real users or before a public launch.

**Middleware deprecation** — Defer. The `middleware.ts` convention still works in Next.js 16 (it compiles and runs correctly, just shows a warning). The `proxy` replacement is new and Auth.js v5 doesn't have official support for it yet. Migrating now would mean writing custom proxy logic without library support. Revisit when Auth.js ships a proxy-compatible API or when upgrading Next.js forces the change.