# Expliq AI

**Automation intelligence platform for no/low-code workflows.** A governance dashboard that helps RevOps teams understand the impact, ownership, and risk exposure of their automation stack — n8n, Zapier, and similar platforms — through a single pane of glass.

> ▶️ **Live MVP:** [expliq-mvp.vercel.app](https://expliq-mvp.vercel.app)

## What it does

As organizations adopt n8n / Zapier / Make at scale, automation sprawl quietly accumulates: workflows owned by people who left, integrations duplicating each other, broken triggers still firing on production data. Expliq imports your automation graph, scores each workflow on impact and risk, and surfaces the items that need attention before they cause incidents.

## Status

- MVP deployed at [expliq-mvp.vercel.app](https://expliq-mvp.vercel.app)
- n8n connector working end-to-end (workflow ingest → scoring → dashboard)
- Sibling project: [APIQ](https://github.com/Per-Paulsen/apiq-mvp) (same stack, OpenAPI-spec domain)
- Active development

## Tech stack

- **Frontend**: Next.js (App Router), TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Next.js Route Handlers
- **Database**: PostgreSQL (Supabase), Prisma ORM
- **Auth**: Auth.js
- **Testing**: Vitest
- **Deployment**: Vercel

## Getting started locally

```bash
npm install
cp .env.example .env  # fill in your Supabase connection string
npx prisma migrate dev
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server (Turbopack) |
| `npm run build` | Production build |
| `npm run lint` | Run ESLint |
| `npm run test` | Run Vitest |
