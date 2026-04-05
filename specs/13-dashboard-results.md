---
tags:
  - type/results
  - status/done
  - epic/13
---

# Epic 13 — Dashboard: Results

> Upstream: [Epic 13: Dashboard](13-dashboard.md)

## What Was Built

Executive summary Dashboard page with 4 states (empty, analyzing, failed, complete) and 6 content sections: delta banner, "Your Next Move", facts bar, attention/opportunities columns, process coverage table, and systems compact row.

## Key Files Created/Modified

### New Files (2)

| File | Purpose |
|------|---------|
| `src/components/dashboard-view.tsx` | "use client" component rendering all 6 dashboard sections. Exports `DashboardView` and `DashboardViewProps`. |
| `src/__tests__/dashboard.test.tsx` | 22 tests covering empty states, full rendering, delta banner dismissal, navigation links, conditional rendering. |

### Modified Files (3)

| File | Change |
|------|--------|
| `src/app/(app)/page.tsx` | Complete rewrite: server component fetching CompanyProfile, Automation (with governance dot computation), BusinessProcess, Recommendation. Handles empty/analyzing/failed/complete states. Passes structured props to DashboardView. |
| `src/app/(app)/error.tsx` | Updated styling to use dark advisory design tokens (text-status-critical, bg-primary, etc.). |
| `src/__tests__/route-smoke.test.tsx` | Added Prisma mocks for dashboard server component. Dashboard smoke test now verifies empty state path. |

## Decisions and Deviations from Spec

1. **Governance dot computed on-read** — The spec says "Automations with governance dot = critical or attention." Since governance dot isn't a stored field, the page calls `computeGovernanceDot()` from risk-engine.ts for each automation. This is consistent with Epic 11's pure-function architecture.

2. **Coverage computed from steps Json** — Process coverage uses `BusinessProcess.steps` Json array (from Epic 11): total steps = array length, automated steps = entries where `isGap === false`. This matches the cross-epic review's documented structure `{ name, isAutomated, isGap, automationId? }`.

3. **Reliability computed on-read** — Per-process reliability = average `(1 - errorRate)` across process automations with non-null errorRate. Processes with no execution data show "—". Matches AC 19a from Epic 14 spec (shared computation pattern).

4. **Empty/analyzing/failed states as inline components** — Rather than separate files, the three non-complete states (DashboardEmpty, DashboardAnalyzing, DashboardError) are defined in page.tsx since they're only used there. This avoids file proliferation for simple components.

5. **Attention items sorted by severity** — Critical governance dots are shown before attention dots. The spec says "cap at 5" but doesn't specify sort order within the attention list. Sorting by severity (critical first) matches the McKinsey pyramid principle.

## Verification Results

| Check | Result |
|-------|--------|
| `npm run test` (252 tests, 22 files) | Pass (183 skipped — R1 test files) |
| `npm run build` | Pass (all routes compile) |
| `npm run lint` | No new errors (pre-existing: research spike scripts) |
| Playwright browser verification | Pass — empty state verified with dark theme + CTA button |

### Test Coverage (22 new tests)

- `dashboard.test.tsx`: 22 tests — empty attention/opportunities, delta banner display + dismissal, full dashboard rendering (all sections), navigation links (attention → detail, opportunity → highlight, process → process map), conditional rendering (View All link, null reliability, impact estimates, aggregate estimates)
- `route-smoke.test.tsx`: Updated dashboard test to handle async server component with Prisma mocks

### Playwright Browser Verification

Ran `scripts/seed-dashboard-verify.ts` to populate CompanyProfile, 4 BusinessProcess records, 8 Recommendations, and 10 enriched Automations for the seed-real workspace. Then logged in as seed-real@expliq.dev and verified:

1. **Delta Banner** — "Since last analysis: 2 workflows updated, error rates improved on 1 workflow" with dismiss X button
2. **Your Next Move** — Full narrative paragraph referencing actual workflow names ("HubSpot → Gmail Cold Outreach"), "View recommendations →" link
3. **Facts Bar** — 12 Workflows, 4 Processes, 14 Systems, 7 Active, 8 Recommendations + "est. ~12 hrs/wk saved · ~€4.2K/mo at risk"
4. **Needs Attention** — 5 items with red (critical) and amber (attention) governance dots, business narrative truncated, "View all on Process Map →" link
5. **Top Opportunities** — 3 ACT NOW items with tier badges, briefs, and impact estimates (€1.2K/mo, €800/mo, €600/mo)
6. **Process Coverage** — 4 processes with coverage bars (60%, 75%, 40%, 67%), reliability %, recommendation counts, all clickable
7. **Systems** — 14 system chips (Slack (7), HubSpot (4), Google Sheets (3), etc.)

All navigation links verified: attention items → `/automations/[id]`, opportunities → `/opportunities?highlight=[id]`, processes → `/processes`, "View recommendations" → `/opportunities`.

## Risks for Future Epics

1. **Process coverage computation duplicated** — The coverage and reliability computations in page.tsx will be needed again in Epic 14 (Process Map). Consider extracting to a shared utility when building Epic 14.

3. **Aggregate estimates Json structure** — The dashboard reads `aggregateEstimates.totalTimeSavings` and `.totalValueAtRisk`. The actual structure depends on LLM output (Epic 11). If the LLM uses different keys, the display will be empty (gracefully — no crash, just no text).

4. **R1 snapshot-dashboard.tsx still exists** — The old R1 dashboard component and its dependencies (snapshot-metrics.ts, snapshot-types.ts) are not imported by the new page but still exist in the codebase. Epic 17 should clean these up.

## Open Questions

None.

## Commit

`83bae65` — `feat: implement epic 13 — dashboard`

---

## Related

- [Spec](13-dashboard.md)
- [Brainstorming](13-dashboard-brainstorming.md)
- [Epic 11: LLM Pipeline V2](11-llm-pipeline-v2.md) (data source)
- [Epic 12: Design System](12-design-system.md) (components)
