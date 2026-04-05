---
tags:
  - type/results
  - status/done
  - epic/14
---

# Epic 14 — Process Map: Results

> Upstream: [Epic 14: Process Map](14-process-map.md)

## What Was Built

Process-centric view of the automation landscape with collapsible ProcessCard headers, embedded workflow UnifiedCards, gap indicators with show/hide toggle, and client-side search filtering by process name and workflow name.

## Key Files Created/Modified

### New Files (4)

| File | Purpose |
|------|---------|
| `src/lib/process-map-data.ts` | `prepareProcessMapData(workspaceId)` — data preparation module. Reuses `buildProcessCoverage()`, `formatAttentionMetric()`, `resolveStepScope()` from dashboard-data.ts. Computes governance dots via risk-engine. Returns structured ProcessMapData with processes, workflows, and gaps. |
| `src/components/process-map-view.tsx` | "use client" component. Search bar, show-gaps toggle, collapsible ProcessCard headers with chevron, expanded UnifiedCard (attention type) per workflow, dashed-border gap cards. Client-side filtering by process name and workflow name. |
| `src/app/(app)/processes/error.tsx` | Client error boundary for Process Map route. |
| `src/__tests__/process-map.test.tsx` | 7 tests covering AC 21-27: render order, expand/collapse, gaps toggle, search by process name, search by workflow name, workflow navigation, gap navigation. |

### Modified Files (2)

| File | Change |
|------|--------|
| `src/app/(app)/processes/page.tsx` | Complete rewrite from stub to async server component. `getRequiredSession()` + CompanyProfile status check + BusinessProcess count. 4 states: empty, analyzing, failed, complete. Passes data to ProcessMapView. |
| `src/__tests__/route-smoke.test.tsx` | Updated Process Map smoke test for async server component pattern. Added `businessProcess.count` mock. Test now verifies empty state message. |

## Decisions and Deviations from Spec

1. **ProcessCard used directly as collapsible header** — Rather than creating a custom ProcessCard-style header, the existing ProcessCard component is rendered inside a button wrapper with `border-0 shadow-none` overrides. This reuses the component without duplication while the outer card container provides the border/shadow.

2. **Healthy workflows show no severity dot** — When `governanceDot === "healthy"`, `severity` is passed as `undefined` to UnifiedCard. This means healthy workflows don't show a StatusDot, which matches the visual convention that only problems need indicators.

3. **Metric fallback to "Active"** — When `formatAttentionMetric()` returns null (no error rate, not inactive), the workflow card shows "Active" as the metric. This ensures every card has a metric value in row 4.

4. **Gap recommendation count uses process-level count** — Per AC 8, gap cards show recommendation count. Since recommendations are linked at the process level (not per-step), all gap cards within a process share the same recommendation count.

5. **Empty state split between page and view** — The server page handles the main empty state (no CompanyProfile or no processes) with CTA to Settings. The view component has a defensive empty state for "No processes to display" if the filtered list is empty.

6. **Auto-expand on workflow search** — When a search matches a workflow name, the parent process auto-expands to show the matching workflow. This is implemented via a separate `autoExpandIds` set in `useMemo` that tracks which processes need auto-expansion.

## Verification Results

| Check | Result |
|-------|--------|
| `npm run test` (264 tests, 23 files) | Pass (183 skipped — R1 test files) |
| `npm run build` | Pass (all routes compile, /processes is dynamic) |
| `npm run lint` | No new errors (pre-existing: R1 files, demo page) |
| Playwright browser verification | Pass — all features verified with real Fairtix data |

### Test Coverage (7 new tests)

- `process-map.test.tsx`: 7 tests — AC 21 (render order + columns), AC 22 (expand shows workflows), AC 23 (gaps toggle), AC 24 (search by process name), AC 25 (search by workflow name shows parent), AC 26 (workflow click → /automations/[id]), AC 27 (gap click → /opportunities?process=[id])
- `route-smoke.test.tsx`: Updated Process Map test (async server component with Prisma mocks)

### Playwright Browser Verification

Verified with real Fairtix pipeline data (seed-real workspace, existing analysis data):

1. **Process list (collapsed)** — 4 processes in correct order: Lead Management (Production, 60%), Customer Communication (Developing, 75%), Employee Onboarding (Emerging, 40%), Reporting & Analytics (Production, 67%). All showing maturity badges, coverage bars, reliability %, at-risk values, recommendation counts.

2. **Expanded process** — Lead Management expanded shows 3 workflow cards: HubSpot → Gmail Cold Outreach (critical dot, 31% error rate, Step 1 of 5), Employee Onboarding Automation (attention dot, 8% error rate, Step 2 of 5), AI-Powered Lead Distribution System (2% error rate, Step 4 of 5).

3. **Show gaps toggle** — Toggle ON reveals 2 gap cards: "Score and qualify" and "Send follow-up email", each with dashed border, "Gap" label, "2 recommendations", and "View opportunities →" link. Toggle OFF hides them.

4. **Search filtering** — Searching "Employee" correctly shows Lead Management (expanded, matching workflow "Employee Onboarding Automation") and Employee Onboarding (matching process name). Other processes hidden.

Screenshots: `epic-14-process-map-collapsed.png`, `epic-14-process-map-expanded.png`, `epic-14-process-map-gaps.png`, `epic-14-process-map-search.png`

## Risks for Future Epics

1. **Gap cards link to /opportunities?process={id}** — Epic 15 (Opportunities) needs to handle the `process` query parameter to filter recommendations by process. If Epic 15 doesn't implement this filter, gap card navigation will land on the full opportunities list.

2. **ProcessCard border/shadow override pattern** — The Process Map uses ProcessCard with `className="border-0 shadow-none rounded-none hover:border-transparent"` to embed it as a collapsible header. If ProcessCard's styling changes in future epics, this override may need updating.

3. **Recommendation count is process-level for gaps** — All gap cards within a process show the same recommendation count (total for the process). If future epics need per-step recommendation counts, the data model would need to link recommendations to specific steps.

## Open Questions

None.

## Commit

`d7bd428` — `feat: implement epic 14 — process map`

---

## Related

- [Spec](14-process-map.md)
- [Epic 12: Design System](12-design-system.md) (components: CollapsibleRow, StatusDot, EmptyState)
- [Epic 13: Dashboard](13-dashboard.md) (reused: ProcessCard, UnifiedCard, dashboard-data.ts utilities)
- [Epic 15: Opportunities](15-opportunities.md) (gap cards link here)
