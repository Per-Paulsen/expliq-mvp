# Epic 16 — Detail: Results

## Summary

Complete rewrite of `/automations/[id]` from a stub page to a full business-first detail view with 7 card sections, matching the spec's visual layout and data requirements.

## Files Created

- `src/lib/detail-data.ts` — Data layer with `prepareDetailData(automationId, workspaceId)` returning fully typed `DetailData`
- `src/components/detail-view.tsx` — "use client" view component with all 7 sections
- `src/__tests__/detail.test.tsx` — 13 view component tests (AC #36-42)
- `src/__tests__/detail-utils.test.ts` — 25 utility tests for normalizeTier, normalizeConfidence, getConnectionType

## Files Modified

- `src/app/(app)/automations/[id]/page.tsx` — Rewritten: server component with auth, data fetching, three states (not found, not analyzed, full detail)
- `src/app/(app)/automations/[id]/error.tsx` — Updated to match project error boundary pattern (status-critical color, text-text-secondary)
- `src/__tests__/route-smoke.test.tsx` — Updated for new page behavior (mocks detail-data, tests not-analyzed state)

## Acceptance Criteria Verification

| AC | Status | Notes |
|----|--------|-------|
| 1. Card containers | Pass | All sections in `bg-surface rounded-xl border border-border shadow-sm` |
| 2. Section headers | Pass | Standard `text-xs font-semibold uppercase tracking-wider text-text-tertiary` |
| 3. Monospace numbers | Pass | All metrics in `font-bold font-mono` with contextual color |
| 4. normalizeTier/normalizeConfidence exported | Pass | Both exported from `opportunities-data.ts` (Task #1) |
| 5. getConnectionType exported | Pass | Exported from `connected-automations.ts` (Task #1) |
| 6. Header card layout | Pass | Two-row white card container |
| 7. Header identity row | Pass | Name, StatusDot, status label, n8n pill |
| 8. Header context row | Pass | SystemFlow + process step pill (clickable) |
| 9. Business Narrative callout | Pass | Teal border-l, Sparkles icon, bg-primary/[0.03] |
| 10. Full narrative text | Pass | text-[15px] leading-relaxed, no truncation |
| 11. Business Case grid | Pass | Three-column grid with colored left borders |
| 12. Failure Impact column | Pass | Red border + tint, failureScenario text |
| 13. Time Savings column | Pass | Teal border, monospace estimate, ConfidenceBadge |
| 14. Revenue Connection column | Pass | Amber border + tint, monospace estimate, ConfidenceBadge |
| 15. Null field handling | Pass | Gray border, "Not applicable" text |
| 16. Recommendations card | Pass | Count badge, automationId + processId dedup |
| 17. Recommendation rows | Pass | TierBadge + name + brief + impact estimate |
| 18. Recommendation hover/click | Pass | hover:bg-surface-hover, links to /opportunities?highlight={id} |
| 19. Empty recommendations | Pass | "No recommendations linked" + "View all opportunities" link |
| 20. Process Position card | Pass | Process name (clickable) + maturity badge |
| 21. Step pill trail | Pass | Filled current step (bg-primary text-white), ghost others |
| 22. Connections hidden when empty | Pass | Card not rendered when both upstream/downstream empty |
| 23. Connection sub-sections | Pass | Upstream/Downstream with directional icons |
| 24. Connection rows | Pass | Name + type pill (gray) + brief |
| 25. Connection click | Pass | Full row links to /automations/[id], name turns teal on hover |
| 26. Evidence collapsed | Pass | CollapsibleRow, collapsed by default |
| 27. Execution Stats | Pass | 4-column KV grid, error rate with contextual color |
| 28. Error Handling | Pass | Amber callout with border-l |
| 29. Credentials | Pass | Teal pills (bg-primary/10 text-primary) |
| 30. Detectability | Pass | 3-column grid with level badge |
| 31. Key Findings | Pass | Bordered mini-rows, capped at 5, "Show N more" toggle |
| 32. Complexity | Pass | Node count (monospace) + branching text |
| 33. No additional API calls | Pass | All data from Automation model fields |
| 34. Back link | Pass | "← Back to Process Map" above header, links to /processes |
| 35. Async params | Pass | `await params` for [id] route parameter |
| 36-42. Tests | Pass | 13 view tests + 25 utility tests, all passing |

## Test Results

- **316 tests passed** (43 new: 13 detail view + 25 detail utils + 5 route-smoke updated)
- **183 skipped** (pre-existing R1 skips)
- **0 failures**
- **Lint**: Clean for all new/modified files
- **Build**: Production build succeeds

## Deviations from Spec

1. **Confidence normalization in data layer**: The spec implies normalizeConfidence is called in the view component. We normalize in `detail-data.ts` instead, because importing `normalizeConfidence` from `opportunities-data.ts` in the "use client" component would pull Prisma into the client bundle (opportunities-data.ts imports prisma). The DetailData type carries pre-normalized confidence values.

2. **Step pill text format**: Spec says "stepName + process name, clickable". We render as "stepName — processName" in a single pill for readability.

3. **Status label derivation**: The spec says "status label describing the dot reason." We implemented `buildStatusLabel()` which generates contextual labels like "Critical — 31% error rate", "Attention — recently inactive", "Healthy — active, monitored" based on the governance dot computation inputs.

## Playwright Verification

Verified with real data (seed-real@expliq.dev workspace):

- **AI-Powered Lead Distribution System**: All 7 sections rendered with real LLM data. Header shows "Attention — partially monitored" with StatusDot. SystemFlow shows "slack → openai → email". Business narrative, business case (3-column), 4 recommendations, process position with step trail, 1 downstream connection (HubSpot Lead Scoring Automation, "logical" type), evidence section (collapsed by default, expanded to show all 6 sub-sections).

- **Navigation verified**: Back link → /processes, step pill → /processes, recommendation click → /opportunities?highlight={id}, connected automation click → /automations/{id} (renders reverse connection as Upstream).

- **Cross-navigation**: HubSpot Lead Scoring Automation detail page shows "AI-Powered Lead Distribution System" as Upstream connection, confirming bidirectional connection rendering.

Screenshots saved to `screenshots/epic-16-detail-*.png`.
