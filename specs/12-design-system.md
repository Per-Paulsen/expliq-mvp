---
tags:
  - type/spec
  - status/draft
  - phase/1b
---

# Epic 12 — Design System + App Shell

> Upstream: [PRD 2.0](../prd-2.0.md) | [Decisions §15](../prd-2.0-decisions.md) | [Brainstorming](brainstorming.md)
> Phase: 1b (parallel with Epic 10, no dependency)
> Dependencies: None

## Scope

Dark advisory design system, shared UI components, sidebar conversion, and route scaffolding for all R2 pages.

**Dark advisory theme (Tailwind v4 CSS-first):**
- Background: near-black (#0a0a0a to #171717)
- Surface: dark gray (#1c1c1c to #262626)
- Text: white (#ffffff / #f5f5f5), secondary (#a3a3a3), tertiary (#737373)
- Accent: teal (#0d9488) — interactive elements and opportunity indicators only
- Status colors: healthy green (#22c55e), attention amber (#f59e0b), critical red (#ef4444), inactive gray (#525252)
- Color rule: color = meaning only. No decorative color.

**Typography hierarchy:**
- Page title: 24-28px, semibold/bold, white
- Section header: 11px, uppercase, tracking-wider, semibold, secondary color
- Row/item title: 13-14px, medium weight, white
- Body text: 12-13px, regular, light gray
- Metrics/numbers: monospace (font-mono), semibold
- Badges/labels: 9-10px, monospace, uppercase
- Evidence/tertiary: 10-11px, secondary color

**Shared components:**
- `StatusDot` — healthy (green), attention (amber), critical (red). Small circle indicator.
- `SystemFlow` — "source → destination" display with system names.
- `ConfidenceBadge` — three variants per decisions §15: solid (data-driven), dashed (benchmark-based), outline (ai-suggested).
- `TierBadge` — Act Now (green accent), Investigate (amber accent), Explore (gray accent).
- `ImpactBadge` — critical/high/medium/low with appropriate color.
- `CollapsibleRow` — expand/collapse with chevron animation. Supports header content + expandable children.
- `SlideOverPanel` — right-side overlay panel. Close on Escape, click-outside, or X button. Transition animation.
- `CoverageBar` — proportional fill bar (green for coverage %).
- `FactCard` — compact metric display: label (section header style) + value (monospace) + optional subtitle.
- `EmptyState` — centered message + optional CTA button.

**Sidebar conversion:**
- Dark background (#0a0a0a)
- Nav items: Dashboard (home icon), Process Map (layers icon), Opportunities (target icon), Settings (gear icon)
- Active item: accent color text + subtle accent background
- Inactive: secondary gray text
- Expliq logo at top
- "Synced X ago" or "Not synced" at bottom (reads from ConnectorConfig.lastSyncAt or similar)

**Route scaffolding:**
- `/` → Dashboard (replaces existing Workspace Snapshot page)
- `/processes` → Process Map (new route)
- `/opportunities` → Opportunities (new route)
- `/automations/[id]` → Detail (keep existing route path)
- `/settings` → Settings (keep existing)
- Each route renders an empty page shell with the correct layout (page title + section structure)

**Login/signup dark theme:**
- Apply dark background, light text, accent CTA buttons to existing auth pages

## Acceptance Criteria

### Theme
1. `globals.css` updated with dark advisory color tokens as CSS custom properties
2. Background is near-black (#0a0a0a) on all app pages
3. Surface elements (cards, sections, panels) use dark gray (#1c1c1c to #262626)
4. Text follows the hierarchy: white for headings, #a3a3a3 for secondary, #737373 for tertiary
5. Accent teal (#0d9488) used only for interactive elements and positive signals — not backgrounds or large areas
6. All numbers rendered in monospace font (font-mono class)

### Components
7. `StatusDot` renders three states with correct colors, accepts a `status` prop
8. `SystemFlow` renders "System A → System B" with arrow, accepts system array
9. `ConfidenceBadge` renders solid/dashed/outline variants based on confidence level
10. `TierBadge` renders Act Now (green), Investigate (amber), Explore (gray) with correct styling
11. `ImpactBadge` renders critical (red), high (amber), medium (default), low (gray)
12. `CollapsibleRow` expands/collapses with smooth animation, chevron rotates
13. `SlideOverPanel` opens from right, closes on Escape/click-outside/X, has transition
14. `CoverageBar` renders proportional fill (0-100%), green fill on dark track
15. `FactCard` renders label + monospace value + optional subtitle
16. `EmptyState` renders centered message + optional CTA button with accent styling
17. All components use `cn()` for className merging, accept `className` prop for extension

### Sidebar
18. Sidebar shows 4 nav items with icons, correct active/inactive states
19. Active route highlighted with accent text + subtle accent background
20. Expliq logo rendered at top of sidebar
21. "Synced X ago" or "Not synced" shown at bottom of sidebar
22. Sidebar navigation works — clicking each item routes to the correct page

### Routes
23. `/` renders Dashboard empty shell with page title "Dashboard"
24. `/processes` renders Process Map empty shell with page title "Process Map"
25. `/opportunities` renders Opportunities empty shell with page title "Opportunities"
26. `/automations/[id]` renders Detail empty shell (existing route, restyled)
27. `/settings` renders Settings page (existing, restyled to dark theme)
28. All routes protected by auth middleware (existing)

### Auth Pages
29. Login page uses dark theme (dark background, light text, accent button)
30. Signup page uses dark theme

### Tests
31. Component tests for StatusDot (3 states), ConfidenceBadge (3 variants), TierBadge (3 tiers), ImpactBadge (4 levels)
32. Component test for CollapsibleRow (renders collapsed, expands on click, shows children)
33. Component test for SlideOverPanel (renders when open, closes on Escape)
34. Smoke test: all 5 routes render without errors

## Out of Scope

- Page content (populated in Epics 13-16)
- Data fetching or server components beyond empty shells
- Figma MCP component import (design system from decisions §15, not Figma)
- Mobile responsiveness
- Dark/light theme toggle (dark only)

## Domain Terms

| Term | Definition |
|------|-----------|
| **Dark advisory theme** | Visual language inspired by Celonis, Linear dark, Bloomberg — confident, restrained, data-forward. Dark backgrounds, high-contrast text, color = meaning only. |
| **Confidence badge** | Visual indicator of evidence quality: solid (data-driven), dashed (benchmark-based), outline (ai-suggested). Visual weight decreases with confidence. |
| **Tier badge** | Recommendation urgency: Act Now (green), Investigate (amber), Explore (gray). |
| **Governance dot** | StatusDot showing healthy/attention/critical per automation. Derived from risk engine (Epic 11). |

## Open Questions

1. Should the sidebar "Synced X ago" read from a `lastSyncAt` field on ConnectorConfig (set in Epic 10), or from CompanyProfile.analyzedAt (set in Epic 11)? (Recommendation: ConnectorConfig.lastSyncAt — available after sync regardless of LLM analysis status.)

---

## Related

- [Epic 10: Schema + Extended Sync](10-schema-sync.md) (parallel)
- [Epic 13-16](13-dashboard.md) (consume these components)
- [Decisions §15: Design System](../prd-2.0-decisions.md)
