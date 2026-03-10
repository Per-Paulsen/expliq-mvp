# Epic 05 — Risk Engine: Results

## What Was Built

Pure-logic governance signal computation, risk level derivation, and exposure score calculations. This is the analytical core that powers the dashboard badges, risk sections, and exposure rankings in epics 06-08.

All computations are on-read (derived at query time, not stored). No schema changes, no API routes, no UI — purely a service module and its tests.

## Key Files Created

| File | Purpose |
|------|---------|
| `src/lib/risk-engine.ts` | Core risk engine: governance signals, risk levels, exposure scores |
| `src/__tests__/risk-engine.test.ts` | 37 unit tests covering all edge cases |
| `scripts/verify-risk-engine.ts` | E2E verification script — runs risk engine against real DB data |

## API Surface

### Constants (exported)
- `STALE_THRESHOLD_DAYS = 14`
- `IMPACT_WEIGHTS` — `{ critical: 4, high: 3, medium: 2, low: 1 }`
- `RISK_WEIGHTS` — `{ high: 3, medium: 2, low: 1 }`

### Pure Functions (exported)
- `getGovernanceSignals(automation)` → `GovernanceSignals` (5 boolean fields)
- `getRiskLevel(automation)` → `'high' | 'medium' | 'low'`
- `getEffectiveStatus(automation)` → `string` (statusOverride ?? status)
- `getEffectiveImpact(automation)` → `string | null` (impactOverride ?? impactProposal)
- `getActiveSignalCount(signals)` → `number`

### Data-Loading Functions (exported)
- `getSystemExposure(workspaceId)` → `Promise<SystemExposure[]>` (sorted by score desc)
- `getOwnerExposure(workspaceId)` → `Promise<OwnerExposure[]>` (sorted by score desc)

### Types (exported)
- `GovernanceSignals`, `RiskLevel`, `SystemExposure`, `OwnerExposure`

## Decisions and Deviations from Spec

None. The spec was precise and unambiguous. Implementation matches the spec exactly:
- All 5 governance signals computed per the defined rules
- Risk level derived from signal counts and specific combos (3+, no-owner+doc-outdated, inactive+any)
- Exposure scores use impact_weight × risk_weight with null-impact defaulting to 1
- Scope precondition enforced: all queries filter `status: { not: 'removed' }`
- Null owners grouped as "Unassigned" in owner exposure

## Verification Results

| Check | Result |
|-------|--------|
| `npm run test` (109 tests, 11 files) | Pass |
| `npm run lint` | Pass (0 errors, 1 pre-existing warning) |
| `npm run build` | Pass |
| Browser verification (app loads) | Pass |
| E2E verification script (real DB) | Pass |

### E2E Verification (real database)
- 20 total non-removed records across 2 workspaces (10 unique n8n workflows × 2 test workspaces created during epic 02 and 04 Playwright e2e verification). The `@@unique([workspaceId, externalId])` constraint works correctly — same externalId is allowed across different workspaces.
- Per workspace: 10 automations, all risk level **High** (all inactive, no owners, overdue reviews)
- Governance signals (per workspace): 10 overdueReview, 10 noOwnerAssigned, 10 inactive, ~2 automationStale, 0 documentationOutdated
- System exposure (scoped to one workspace): Slack highest, followed by HubSpot/Gmail/Salesforce
- Owner exposure (scoped to one workspace): Unassigned=90 (10 automations × 9 exposure each)
- Math spot-check: high(3) × high(3) = 9 per automation — verified against system totals

### Test Coverage (37 tests)
- `getGovernanceSignals`: 17 tests (each signal individually + all/none + edge cases)
- `getEffectiveStatus`: 2 tests
- `getEffectiveImpact`: 3 tests
- `getRiskLevel`: 5 tests (all high combos, medium, low)
- Constants: 3 tests
- `getSystemExposure`: 4 tests (weighted scores, null impact, empty systemsTouched, removed filtering)
- `getOwnerExposure`: 3 tests (Unassigned grouping, weighted scores, sort order)

## Risks for Future Epics

1. **All test automations are "high" impact** — As noted in epic 04 results, the LLM classifies most RevOps automations as "high". This means exposure scores will cluster similarly until users apply `impactOverride` (epic 07). The risk engine handles this correctly but the Workspace Snapshot (epic 08) rankings may look flat until impact diversity exists.

2. **`getEffectiveImpact` returns `string | null` not `ImpactLevel | null`** — The return type is `string | null` to avoid importing the Prisma enum into the pure function signature. Downstream consumers (epics 06-08) should be aware when using it for display or comparison. The IMPACT_WEIGHTS lookup handles any string, defaulting gracefully.

3. **Exposure score computation queries all non-removed automations** — Both `getSystemExposure` and `getOwnerExposure` load all automations into memory. Fine for MVP scale (tens to low hundreds), but if the Workspace Snapshot (epic 08) calls both, that's two full-table scans. Could be optimized to share a single query if performance matters.

4. **`deprecated` status and governance signals** — The spec is clear that `deprecated` does NOT trigger the `inactive` signal. However, deprecated automations still contribute to exposure scores and may still have governance gaps (no owner, overdue review). This is correct behavior per spec, but users might find it surprising that deprecated automations show up in exposure rankings. Epic 06/07 should consider whether to surface this distinction.

## Open Questions

None. The spec had no ambiguities and all open questions were pre-resolved.

## Commit

`761eef4` — `feat: implement epic 5 — risk engine`