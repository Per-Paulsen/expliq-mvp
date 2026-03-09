# 02 — Authentication

## Scope

Implement email/password authentication using Auth.js (NextAuth v5). This includes:

- **Signup flow**: user registers with email + password; a User record is created and a default Workspace ("My Workspace") is auto-created and linked
- **Login flow**: user authenticates with email + password; session is established
- **Logout**: user can log out; session is destroyed
- **Session management**: Auth.js session includes userId and workspaceId, accessible in both server components and API route handlers
- **Route protection**: all routes except `/login` and `/signup` redirect unauthenticated users to `/login`
- **Password security**: passwords hashed with bcrypt; no plaintext storage

Auth.js is configured with the Prisma adapter to store sessions and accounts in the existing Supabase database. The User model is extended with a `passwordHash` field (`String`) to support the Credentials provider — this field was deferred from epic 01.

**Prisma 7 note**: The project uses Prisma 7 with the generated client at `src/generated/prisma/` (configured via `prisma.config.ts`, not inline `url`/`directUrl` in `schema.prisma`). The Auth.js Prisma adapter (`@auth/prisma-adapter`) must be configured to import from this path. Verify adapter compatibility with Prisma 7 before implementing.

## Acceptance criteria

- [ ] User can sign up with email and password; a User record and a default Workspace record are created in the database
- [ ] User can log in with email and password; session is established and persists across page reloads
- [ ] Signing up with an already-registered email shows an error and does not create a duplicate User record
- [ ] Logging in with incorrect credentials shows a generic error message (does not reveal whether the email or password was wrong)
- [ ] User can log out; session is destroyed and user is redirected to `/login`
- [ ] All app routes (except `/login` and `/signup`) redirect unauthenticated users to `/login`
- [ ] The session exposes `userId` and `workspaceId` in server components and API route handlers
- [ ] A `passwordHash` field is added to the User model in the Prisma schema
- [ ] Passwords are hashed with bcrypt and stored in `passwordHash`; no plaintext storage anywhere

## Out of scope

- Password reset / forgot password flow
- OAuth providers (Google, GitHub, etc.)
- Email verification
- Multi-user invitations or team management
- Role-based access control
- Profile editing

## Domain terms

| Term | Definition |
|------|-----------|
| **Auth.js** | The Next.js authentication library (NextAuth v5) handling session management and credential verification |
| **Prisma adapter** | Auth.js adapter that stores users, sessions, and accounts in the Prisma-managed database |
| **Session** | Server-side record proving a user is authenticated; contains userId and workspaceId |

## Open questions

- Should we use JWT or database session strategy for Auth.js? (JWT is simpler for Vercel deployment; database sessions are more secure for revocation)
