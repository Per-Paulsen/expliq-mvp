---
tags:
  - type/patch
  - status/pending
  - epic/08
  - exercise/21
---

# Exercise 21 — Dashboard UX Redesign

> Upstream: [Epic 08: Workspace Snapshot](../08-workspace-snapshot.md) | [Exercise 21 Task](../../dl-ai-expliq/exercise_21/task_21.md)

**Epic:** 08 (Workspace Snapshot)
**Type:** UX redesign — same features, better UI
**Exercise requirement:** Context Engineering & Multi-Agent Orchestration — use a sub-agent to extract design from Figma, implement dashboard redesign.

## Problem

The current Workspace Snapshot dashboard looks plain and overwhelming: no color, no visual hierarchy, system exposure list dominates the page, no icons or context on metric cards. Feedback from checkin session: "overwhelming and asymmetric."

## Solution

Redesign the dashboard using the Figma Make design (version 2) as reference. Same feature scope — same data, same sections — but with professional UI: icons, subtitles, colored progress bars, proper card components, two-column exposure layout.

### Design source

Figma Make file: `3bG7mlpucVffGMdoAFPcgc` (version 2 — restored)
- Extracted via `figma-design-extractor` sub-agent (`.claude/agents/figma-design-extractor.md`)

### What changes (UI only, no logic changes)

**Metric cards row (5 cards):**
- Add icons (Zap, AlertTriangle, UserX, Clock) from lucide-react
- Add subtitles ("Business critical", "Need attention", "Unassigned", "Past due date")
- Make cards clickable (link to filtered automations list)

**System Exposure section:**
- Colored progress bars (teal/green/amber/red by score)
- Percentage display
- Cap at ~6 entries (not 15+)
- Better spacing

**Owner Exposure section:**
- Progress bars with automation counts
- Two-column layout alongside System Exposure
- "Unassigned" highlighted differently

**Recently Changed section:**
- System badges per automation
- Relative timestamps
- Hover states with teal accent

**Multi-System Automations section:**
- System badge lists
- System count badges

**New shared components needed:**
- `MetricCard` — card with title, value, subtitle, icon, optional accent color
- `ExpliqCard` — base card with optional accent color border
- `ExpliqBadge` — badge variants (system, status, impact)
- `ProgressBar` — colored progress bar with height/color variants

### Files to change

**New components:**
- `src/components/metric-card.tsx`
- `src/components/expliq-card.tsx`
- `src/components/expliq-badge.tsx`
- `src/components/progress-bar.tsx`

**Modified:**
- `src/components/snapshot-dashboard.tsx` — redesigned layout using new components
- `src/app/globals.css` — new CSS variables for teal accent, additional colors if needed
- `src/lib/snapshot-types.ts` — may need minor type additions for new display fields

**NOT changed:**
- `src/app/(app)/page.tsx` — server component data fetching stays the same
- `src/lib/risk-engine.ts` — no logic changes
- No schema changes, no API changes

### Sub-agent workflow (Exercise 21 requirement)

1. **Trigger sub-agent**: `figma-design-extractor` reads the Figma Make file via MCP
2. **Sub-agent returns**: design tokens (colors, typography, spacing) + component specs
3. **Main agent uses**: the extracted tokens to implement the dashboard
4. **Verification**: Playwright screenshot comparison against Figma design

### Test plan

- Existing snapshot-dashboard tests should still pass (same data, different layout)
- No new logic tests needed (UI-only change)
- Visual verification via Playwright

### What does NOT change

- Data fetching logic (server component)
- Risk engine, exposure calculations
- Database schema
- Other pages (portfolio, detail, settings)

## Invocation

```
/patch 'specs/patches/exercise-21-dashboard-ux.md' --epic 08
```

---

## Related

- [Epic 08 Spec](../08-workspace-snapshot.md)
- [Epic 08 Results](../08-workspace-snapshot-results.md)
- [Brainstorming R2](../brainstorming-roadmap-r2.md) — dashboard UX discussion
