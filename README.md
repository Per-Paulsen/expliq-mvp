# Expliq

RevOps automation governance dashboard. Understand automation impact, ownership, and risk exposure across your no/low-code automation platforms.

## Tech Stack

- **Frontend**: Next.js (App Router), TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Next.js Route Handlers
- **Database**: PostgreSQL (Supabase), Prisma ORM
- **Auth**: Auth.js
- **Testing**: Vitest
- **Deployment**: Vercel

## Getting Started

```bash
npm install
```

Copy `.env.example` to `.env` and fill in your Supabase connection string:

```bash
cp .env.example .env
```

Run database migrations:

```bash
npx prisma migrate dev
```

Start the dev server:

```bash
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
