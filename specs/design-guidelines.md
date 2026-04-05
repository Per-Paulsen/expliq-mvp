# Dashboard & UI Design Guidelines

> Compiled from PatternFly, Celonis, UXPin, Pencil & Paper, and web research.
> These guidelines apply to all Expliq screens (Dashboard, Process Map, Opportunities, Detail).

---

## 1. Card Anatomy

Every dashboard item should be a **structured card**, not a text block. A card has:

| Element | Purpose | Example |
|---------|---------|---------|
| **Title** | What this card is about | "Lead Management" |
| **Primary metric** | The most important number, large + bold | "60%" or "€1.2K/mo" |
| **Delta indicator** | Change direction + magnitude | "↑ 12% vs last week" (green) |
| **Status indicator** | Visual health signal | Dot (green/amber/red), badge, icon |
| **Secondary metrics** | Supporting context | "3 of 5 steps automated" |
| **Sparkline/bar** | Trend or proportion at a glance | Mini coverage bar, trend line |
| **Action** | What to do about it | "Fix now →", "View details" |

**Rule**: If you have to READ a card to understand it, it's wrong. You should SCAN it — numbers, colors, and positions tell the story.

---

## 2. Card Types for Expliq

### KPI Card (Facts Bar)
- ONE metric per card
- Large number (24-32px, bold, monospace)
- Label above or below (smaller, muted)
- Optional: trend indicator (↑↓), comparison to benchmark
- Optional: sparkline

### Action Card ("Your Next Move")
- NOT a paragraph of text
- Structured as: **Action title** (what to do) + **Affected entity** (which workflow/process) + **Impact metric** (what you gain) + **CTA button**
- Think notification/alert card, not essay

### Alert Card (Attention Items)
- Severity indicator (dot or icon with color)
- Entity name (workflow name)
- THE SPECIFIC METRIC that's wrong (e.g., "31% error rate") — not a narrative
- Impact badge
- One line scan, not multi-line text

### Opportunity Card (Recommendations)
- Sparkle/opportunity icon
- Recommendation name
- Impact value PROMINENT (large, teal, monospace)
- Confidence badge
- Tier badge
- CTA: "Deploy" or "View →"

### Process Card (Process Coverage)
- Process name (title)
- LARGE coverage bar (not tiny — this is the star of the card)
- Coverage fraction: "3 of 5 steps"
- Maturity badge
- Reliability metric
- Recommendation count with link

---

## 3. Layout Rules

### Visual Hierarchy (F-pattern / Z-pattern)
- Most critical data: **top-left**
- Users scan less as they go down → put detail at bottom
- Structure: **Answer → Evidence → Detail** (McKinsey pyramid)

### Grid
- 3-4 column grid, 16px gutters
- Cards maintain consistent spacing
- Don't mix single-column and multi-column cards without intention

### Cognitive Load
- Max **4-7 items** per section
- Max **9 views** on one screen
- If you have 12 metrics, pick the 5 that matter — hide the rest behind interaction
- Every card must answer a user question or support a decision

### Progressive Disclosure
- Show high-level summary first
- Details on hover, click, or expand
- Don't dump everything at once

---

## 4. Typography Hierarchy

| Level | Size | Weight | Color | Use |
|-------|------|--------|-------|-----|
| Page title | 28-32px | Bold | White | "Dashboard" |
| Section header | 12-13px | Semibold, uppercase, tracking | Muted | "PROCESS COVERAGE" |
| Card title | 15-16px | Medium | White | "Lead Management" |
| Primary metric | 24-32px | Bold, monospace | White or accent | "60%", "€1.2K" |
| Secondary metric | 14-16px | Regular, monospace | Muted | "3 of 5 steps" |
| Body text | 15-16px | Regular | White/80 | Descriptions, narratives |
| Label/caption | 12-13px | Medium | Muted 50% | "saved per week", "error rate" |
| Badge text | 10-11px | Semibold, mono, uppercase | Contextual | "ACT NOW", "CRITICAL" |

**Minimum readable body text: 15px.** Nothing below 12px except badges.

---

## 5. Color Rules

| Color | Meaning | Use |
|-------|---------|-----|
| **White** | Primary content | Headlines, names, primary metrics |
| **White/50-80%** | Supporting content | Body text, secondary metrics |
| **White/30-40%** | Tertiary/labels | Captions, timestamps, column headers |
| **Teal (#0d9488)** | Interactive / positive / opportunity | Links, CTAs, savings metrics, recommendations |
| **Green (#22c55e)** | Healthy / good | Status dots, coverage bars, success |
| **Amber (#f59e0b)** | Warning / attention | Status dots, at-risk values, investigate tier |
| **Red (#ef4444)** | Critical / error | Status dots, error rates, critical items |
| **No decorative color** | — | Color = meaning ONLY |

---

## 6. Anti-Patterns (Things We Did Wrong)

| Anti-pattern | What we did | What to do instead |
|-------------|------------|-------------------|
| **Text dump** | "Your Next Move" was a paragraph | Structured action card with title + entity + metric + CTA |
| **Grey on grey** | Body text in muted gray on dark gray | Body text minimum white/80, labels minimum white/50 |
| **Tiny text** | 9-11px for body content | 15px minimum for anything you need to read |
| **Unnamed metrics** | "~12 hrs/wk" with no explanation | Always label: what it measures, what scope, what period |
| **Abbreviations** | "Recs" column header | Spell out: "Recommendations" |
| **Narrative as data** | Attention items showed businessNarrative paragraph | Show the SPECIFIC metric (error rate, status) |
| **Tiny progress bars** | 6px tall coverage bar | Prominent bars, at least 10px, with clear percentage |
| **Equal visual weight** | Every section looked the same | Visual hierarchy — the answer is biggest, evidence is smaller |

---

## 7. Theme Decision — LIGHT

**Decision: Light theme.** Dark advisory theme rejected by user — text unreadable, no visual depth, felt cold and flat.

**Reference dashboards:**
- [FlowDash — SAAS Admin Dashboard](https://themeforest.net/item/flowdash-saas-admin-dashboard-template/25586651) — light, card-based, mini sparklines in KPI cards
- [Fillow — SaaS Admin Dashboard](https://fillow.dexignlab.com/xhtml/index.html) — light gray background (#f5f5f7), white cards with shadows, large numbers, colorful accents, progress rings

**Light theme characteristics to match:**
- Background: light gray (#f5f7f9 or #f5f5f7)
- Cards: white (#ffffff) with subtle shadow and rounded corners (8-12px radius)
- Text: dark gray (#1a1a2e or #111827) for headings, medium gray (#6b7280) for secondary
- Accent: teal (#0d9488) for interactive elements, links, positive values
- Status colors: green/amber/red as before
- Sidebar: can be dark (teal/dark) or light — TBD
- Borders: very subtle (#e5e7eb), shadows do the separation work

**Impact:** Requires updating globals.css (Epic 12 dark theme → light), all page components, sidebar, auth pages. This is a design system rewrite.

---

## 8. Font Decision — OPEN

Tested so far:
- Geist Sans — thin and unreadable on dark
- Inter — still not good enough per user
- DM Sans — geometric, user still not satisfied

Candidates to try:
- **Plus Jakarta Sans** — most popular modern SaaS font, geometric, wide, very readable
- **Outfit** — clean geometric, wide characters
- **Manrope** — modern, high readability

**Decision needed.** User wants "more modern." Recommendation: Plus Jakarta Sans (body) + JetBrains Mono (numbers).

---

## Sources

- [PatternFly Dashboard Design Guidelines](https://www.patternfly.org/patterns/dashboard/design-guidelines/)
- [UXPin Dashboard Design Principles](https://www.uxpin.com/studio/blog/dashboard-design-principles/)
- [Pencil & Paper — UX Pattern Analysis: Data Dashboards](https://www.pencilandpaper.io/articles/ux-pattern-analysis-data-dashboards)
- [Celonis Studio KPI Card Configuration](https://docs.celonis.com/en/configuring-kpi-cards-and-kpi-lists.html)
- [Celonis Management View Guidelines](https://docs.celonis.com/en/guidelines-management.html)
- [Figma Make Prototype — Expliq Design System](https://www.figma.com/make/3bG7mlpucVffGMdoAFPcgc)
