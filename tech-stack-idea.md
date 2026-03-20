---
tags:
  - type/tech
  - status/done
---

# Tech Stack Proposal

> Upstream: [PRD](expliq_prd.md) | [Map of Content](_MOC.md)

## Frontend
- Next.js (App Router)
- TypeScript
- Tailwind CSS
- shadcn/ui

## Backend
- Next.js Route Handlers
- Node.js runtime

## Database
- PostgreSQL (Supabase-managed)
- Prisma ORM

## Authentication
- Auth.js / NextAuth

## Testing
- Vitest

## Code Quality
- ESLint

## Deployment
- Vercel (web application)
- Supabase (Postgres)

## Why this stack
Optimized for a modern MVP: fast setup, strong TypeScript support, simple full-stack development, production-friendly defaults, low operational overhead. Single deployable web application — no microservices during MVP stage.

---

## Related

- [Epic 01: Project Setup](specs/01-project-setup.md)
