# Design Guidelines — Expliq

> Compiled from PRD §15, Amendment T (design spike), PatternFly, Celonis, UXPin, Pencil & Paper.
> Authoritative for all visual decisions. Amends PRD §15 where noted.
> Demo prototype: `src/app/(app)/demo/page.tsx` (v5 approved)

---

## 1. Theme — DECIDED: Light

| Element | Value | Notes |
|---------|-------|-------|
| **Page background** | #f5f5f7 (light gray) | All app pages |
| **Card background** | #ffffff (white) | White cards with `shadow-sm` + `rounded-xl` (12px) |
| **Card border** | #e5e7eb (very subtle) | Shadows do most of the separation work |
| **Text primary** | #111827 (near-black) | Headings, card titles, workflow names |
| **Text secondary** | #6b7280 (medium gray) | Descriptions, body text, secondary info |
| **Text tertiary** | #9ca3af (light gray) | Labels, captions, timestamps, column headers |
| **Accent** | #0d9488 (teal) | Interactive, positive, opportunity, links, CTAs |
| **Status healthy** | #22c55e (green) | Coverage bars, healthy dots, improved indicators |
| **Status attention** | #f59e0b (amber) | Attention dots, at-risk values, investigate tier, update indicators |
| **Status critical** | #ef4444 (red) | Critical dots, error rates, critical impact |
| **Resolved/positive change** | #0d9488 (teal) | Resolved indicators in delta banner |

**Color = meaning only.** No decorative color. Unchanged from PRD §15.

---

## 2. Font — DECIDED: Plus Jakarta Sans

| Role | Font | Weight | Notes |
|------|------|--------|-------|
| **Body / UI** | Plus Jakarta Sans | 400-700 | Geometric, modern, wide, high readability |
| **Numbers / metrics** | JetBrains Mono | 400-700 | All numbers, percentages, counts, estimates |

Load via `next/font/google` in `layout.tsx`. Map to CSS variables `--font-dm-sans` → `--font-plus-jakarta-sans` and `--font-dm-mono` → `--font-jetbrains-mono` in `globals.css` @theme inline.

---

## 3. Typography Hierarchy

| Level | Size | Weight | Color | Use |
|-------|------|--------|-------|-----|
| Page title | 28-32px | Bold | #111827 | "Dashboard", "Process Map" |
| Section header | 13-14px | Semibold, uppercase, tracking-wider | #6b7280 | "YOUR NEXT MOVE", "NEEDS ATTENTION" |
| Card title | 15-16px | Semibold | #111827 | "Lead Management", workflow names |
| Primary metric | 24-32px | Bold, JetBrains Mono | #111827 or accent | "60%", "€1.2K", "12" |
| Secondary metric | 14-16px | Regular, JetBrains Mono | #6b7280 | "3 of 5 steps", "86%" |
| Body text | 15-16px | Regular | #6b7280 | Descriptions, briefs |
| Label/caption | 12-13px | Medium | #9ca3af | "saved per week", "methodology →" |
| Badge text | 11-12px | Semibold, uppercase | Contextual | "ACT NOW", "Data-driven" |

**Minimum readable body text: 15px.** Nothing below 11px.

**Numbers rule:** ALL numbers highlighted — bold + monospace + contextual color. Numbers never appear as plain body text. Even inline: "**2** workflows updated."

---

## 4. Card Components

### UnifiedCard (Attention + Recommendation)

**Same component** for both attention items and recommendations. Reused across Dashboard, Process Map, Priorities pages.

| Element | Attention (workflow problem) | Recommendation (suggested action) |
|---------|---------------------------|----------------------------------|
| **Left border** | 3px red (critical) or amber (attention) | 3px green (act-now), amber (investigate), gray (explore) |
| **Row 1** | Severity dot | Sparkle icon + Tier badge (ACT NOW etc.) + Confidence badge |
| **Row 2** | Workflow name (15px semibold) | Recommendation name (15px semibold) |
| **Row 3** | Description (14px, gray) | Brief (14px, gray) |
| **Row 4** | **THE metric** (e.g., "31% error rate" in red mono) + scope + process | **Impact value** (e.g., "~€1.2K/mo" in teal mono) + scope + process |

**Hover:** border darkens, title turns teal. **Click:** navigates to Detail (attention) or Priorities (opportunity).

### KpiCard (Hard Facts)

- Label (13px, gray)
- Value (24-28px, bold, JetBrains Mono, #111827)
- Optional delta ("↑ +2 since last sync" in green)
- White card, shadow-sm, rounded-xl

### EstimateCard (LLM-Estimated Values)

Same base as KpiCard, but with additional:
- Explanation text (14px, gray) — what the estimate measures
- Confidence badge (Data-driven / Benchmark-based / AI-suggested)
- "methodology →" link (teal, 12px)
- Per PRD §1: transparent reasoning. Per PRD §3: "(methodology →)"

### ProcessCard (Process Coverage)

- Name (16px semibold) + Maturity badge (colored pill: Production/Developing/Emerging/etc.)
- **Big coverage bar** (h-3, rounded-full, teal fill on gray track)
- Coverage fraction ("3 of 5 steps") + percentage (large, teal, mono)
- Metrics row: Reliability % | At Risk (amber, mono) | Recommendations (teal, mono)

---

## 5. Page-Specific Layouts

### Dashboard (per PRD §3 + Amendment T)

| Order | Section | Layout |
|-------|---------|--------|
| 1 | Delta Banner | Teal-bordered card, Activity icon, color-coded changes, dismissible |
| 2 | Your Next Move | Tinted teal section (bg-teal/4%, border-l-3px teal), Bot icon, UnifiedCard (recommendation) inside, follow-up card, total impact |
| 3 | Facts Bar | 5-card row: 3× KpiCard (facts) + 2× EstimateCard (estimates with confidence + methodology) |
| 4 | Attention + Opportunities | Two-column: Left = UnifiedCard (attention type), Right = UnifiedCard (recommendation type) |
| 5 | Process Coverage | 2×2 grid of ProcessCards |
| 6 | Connected Systems | Chip row: name + bold count per system |

### Process Map (per PRD §4 — NOT changed by design spike)

- Collapsible rows for processes (compare vertically)
- Table rows for workflows inside expanded process
- Same UnifiedCard fields for workflow rows (but as aligned columns, not stacked cards)
- Gap indicators when "Show gaps" toggle ON

### Priorities/Opportunities (per PRD §5 — NOT changed by design spike)

- Table rows grouped by tier header (ACT NOW, INVESTIGATE, EXPLORE)
- Same UnifiedCard fields but as aligned columns
- Slide-over panel on click for full detail
- Visual weight decreases by tier (solid → dashed → outline left border)

### Detail (per PRD §6 — NOT changed by design spike)

- Scrollable sections, not cards
- Business narrative, business case (3-column), process position, connections, evidence

---

## 6. Sidebar

| Element | Decision | Notes |
|---------|----------|-------|
| **Background** | Dark (#111827 or #0f172a) | Dark sidebar on light content — standard SaaS pattern (FlowDash, Fillow both do this) |
| **Logo** | "Expliq" white bold | Top of sidebar |
| **Nav items** | Dashboard, Process Map, Opportunities, Settings | Icons + labels, white/gray text |
| **Active item** | Teal text + subtle teal/white background | Same pattern as current |
| **Inactive item** | Gray text (#9ca3af) | |
| **Footer** | "Synced X ago" + Sign out | Gray text, small |

**Alternative:** Light sidebar (white bg, gray text, teal active) could also work. TBD during implementation — try dark first since it provides visual separation from the content area.

---

## 7. Auth Pages (Login / Signup)

| Element | Decision |
|---------|----------|
| **Background** | Light gray (#f5f5f7) matching app background |
| **Form container** | White card, centered, shadow-md, rounded-xl, max-w-md |
| **Heading** | "Sign in to Expliq" — 24px bold, #111827 |
| **Subtitle** | Gray text below heading |
| **Labels** | 14px medium, #374151 |
| **Inputs** | White bg, gray border (#d1d5db), rounded-lg, 15px text |
| **CTA button** | Teal bg (#0d9488), white text, rounded-lg, full width |
| **Links** | Teal text (#0d9488) |
| **Error state** | Red bg/text (bg-red-50 text-red-700) |

---

## 8. Settings Page

- Light background matching app
- White card sections for Connection, Tag Selection, Sync & Analyze
- Same form element styling as auth pages
- Progress indicators in teal
- Existing functionality unchanged — only visual theme update

---

## 9. Empty / Loading / Error States

| State | Display |
|-------|---------|
| **Empty (no data)** | Centered message + teal CTA button, on light background |
| **Analyzing** | Skeleton layout (gray placeholders on white cards) + contextual message "Analyzing your automation landscape..." |
| **Failed** | Red text message + "Re-sync" teal link to Settings |

---

## 10. Anti-Patterns

| Don't | Do |
|-------|-----|
| Text dump (paragraph as data) | Structured card: title + metric + scope + action |
| Gray on gray (unreadable) | High contrast: #111827 on white, minimum 15px |
| Tiny text (9-11px body) | 15px minimum for anything you need to read |
| Unnamed metrics ("~12 hrs/wk") | Always label: what it measures + confidence + methodology |
| Abbreviations ("Recs") | Spell out ("Recommendations") |
| Narrative as data | Show THE SPECIFIC METRIC (error rate, status, value) |
| Tiny progress bars (6px) | h-3 minimum, prominent fill, large percentage |
| Equal visual weight | Answer first (biggest), evidence second, detail last |
| Numbers as plain text | Bold + monospace + color for ALL numbers |

---

## Sources

- [PatternFly Dashboard Design Guidelines](https://www.patternfly.org/patterns/dashboard/design-guidelines/)
- [UXPin Dashboard Design Principles](https://www.uxpin.com/studio/blog/dashboard-design-principles/)
- [Pencil & Paper — UX Pattern Analysis: Data Dashboards](https://www.pencilandpaper.io/articles/ux-pattern-analysis-data-dashboards)
- [Celonis Studio KPI Card Configuration](https://docs.celonis.com/en/configuring-kpi-cards-and-kpi-lists.html)
- [Celonis Management View Guidelines](https://docs.celonis.com/en/guidelines-management.html)
- [FlowDash — SAAS Admin Dashboard](https://themeforest.net/item/flowdash-saas-admin-dashboard-template/25586651)
- [Fillow — SaaS Admin Dashboard](https://fillow.dexignlab.com/xhtml/index.html)
- [Figma Make Prototype — Expliq Design System](https://www.figma.com/make/3bG7mlpucVffGMdoAFPcgc)
