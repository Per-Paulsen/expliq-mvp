# Patch: Landing Page — Brainstorming

> Goal: Simple public landing page at `/` with a CTA to login/register.
> References: [Design Guidelines](../design-guidelines.md) | [PRD 2.0](../../prd-2.0.md)

---

## Context

Expliq has no public-facing page. Unauthenticated users hit `/login` directly. We need a simple landing page that tells you what Expliq is and lets you try it.

**This is NOT a marketing site.** It's a front door — logo, one sentence, one button, and a stylized workflow graphic.

---

## Final Decisions

### Layout — Single screen, no scroll

```
┌─────────────────────────────────────────────────┐
│                                                 │
│                  Expliq                          │
│          Automation Intelligence                 │
│                                                 │
│   See what's working, what's broken,            │
│   and what to build next.                       │
│                                                 │
│             [ Try it out ]                      │
│                                                 │
│   ┌─ Churn Prevention (teal, NEW) ──────────┐   │
│   │ Track Usage → Detect Risk → Offer → CSM │   │
│   └─────────────────────────────────────────┘   │
│   ┌─ Lead Management (gray, Production) ────┐   │
│   │ Capture → Enrich → CRM                  │   │
│   │ New Deal → Score → Assign → Notify      │   │
│   └─────────────────────────────────────────┘   │
│                                                 │
└─────────────────────────────────────────────────┘
```

### Elements

| # | Element | Decision |
|---|---------|----------|
| 1 | **Logo** | "Expliq" — Plus Jakarta Sans, bold, #111827, static (no link) |
| 2 | **Category** | "Automation Intelligence" — semibold, teal (#0d9488) |
| 3 | **Tagline** | Short single line: "See what's working, what's broken, and what to build next." (16-18px, #6b7280) |
| 4 | **CTA** | "Try it out" — teal button → `/login` |
| 5 | **Graphic** | Stylized n8n-style workflow SVG (see below) |
| 6 | **Background** | #f5f5f7 (same as app) |

### What we decided NOT to do
- No navbar
- No footer
- No features section
- No testimonials
- No product screenshot
- No mobile responsiveness
- No scroll

### Workflow graphic

SVG prototype at [`screenshots/landing-page-workflow.svg`](../../screenshots/landing-page-workflow.svg)

n8n-style workflow nodes with business process frames:
- **Top (teal, "NEW" badge):** "Churn Prevention" — 4 nodes: Track Usage → Detect Risk → Offer Discount → Notify CSM. Sparkle decorations. Teal borders, teal text.
- **Bottom (gray, "Production" badge):** "Lead Management" — two workflows in one process frame:
  - 3 nodes: Capture Lead → Enrich Profile → Create in CRM
  - 4 nodes: New Deal → Score Lead → Assign Rep → Notify Slack

Key visual choices:
- Dot grid background (n8n canvas feel)
- Dashed process frames with business process name labels + maturity badges
- Nodes have colored left border strip, connector dots, small icons, business-friendly names + system labels
- Teal opportunity on top (visually prominent), gray existing below

### Visual design

Same tokens as the app — no new design decisions:
- Background: `#f5f5f7`
- Text: `#111827` (logo), `#6b7280` (tagline)
- Accent: `#0d9488` (CTA, category, teal workflow)
- Font: Plus Jakarta Sans
- Button: teal bg, white text, rounded-lg (same as app)
- Centered layout, max-width ~480px text block, graphic below

---

## Routing Changes

### Current route tree (as of 2026-04-06)
```
/                       → Dashboard (protected, src/app/(app)/page.tsx)
/processes              → Process Map (protected)
/opportunities          → Opportunities (protected)
/automations/[id]       → Detail (protected)
/settings               → Settings (protected)
/demo                   → Design spike prototype (protected, can delete)
/login                  → Login (public)
/signup                 → Signup (public)
/api/auth/[...nextauth] → NextAuth API routes
```

### Target route tree
```
/                       → Landing page (PUBLIC, new)
/dashboard              → Dashboard (protected, moved from /)
/processes              → Process Map (unchanged)
/opportunities          → Opportunities (unchanged)
/automations/[id]       → Detail (unchanged)
/settings               → Settings (unchanged)
/login                  → Login (unchanged)
/signup                 → Signup (unchanged)
```

### Exact changes needed

**Move dashboard (1 file):**
- `src/app/(app)/page.tsx` → `src/app/(app)/dashboard/page.tsx`

**New files (2):**
- `src/app/(public)/layout.tsx` — minimal layout, no sidebar, no auth
- `src/app/(public)/page.tsx` — landing page component with inline SVG graphic

**Update root route references (5 exact locations):**

| File | Line | Current | New |
|------|------|---------|-----|
| `src/components/app-sidebar.tsx` | 44 | Logo `href="/"` | `href="/dashboard"` |
| `src/components/app-sidebar.tsx` | ~58 | Dashboard nav item `"/"` | `"/dashboard"` |
| `src/app/(auth)/login/page.tsx` | 36 | `router.push("/")` | `router.push("/dashboard")` |
| `src/app/(auth)/signup/page.tsx` | 54 | `router.push("/")` | `router.push("/dashboard")` |
| `src/lib/auth.config.ts` | 14 | Redirect to `"/"` | Redirect to `"/dashboard"` |

**Update middleware (1 file):**
- `src/middleware.ts` — must exclude `/` from protection (currently protects all non-auth routes)

**Optional cleanup:**
- Delete `src/app/(app)/demo/page.tsx` (design spike prototype)

---

## Discussion History

### Round 1 — Design direction (2026-04-06)

Per wanted a simple landing page, not a marketing site. Rejected initial proposal with navbar, features section, footer, etc. Redirected to "just a front door."

### Round 2 — Graphic concept (2026-04-06)

Per proposed: two existing gray workflow visuals + one teal opportunity workflow as simple graphics. Explored Lucide icons (too small for landing page scale). Decided to create hand-crafted SVG in n8n workflow style instead.

### Round 3 — SVG iteration (2026-04-06)

v1: Three separate workflows (gray, gray, teal). Per requested: business process frames, business-friendly names, at least 3 nodes per workflow (one with 4), both existing workflows in same process, teal opportunity on top not stacked after existing. v2 delivered and approved.
