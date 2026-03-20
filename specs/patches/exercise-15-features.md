---
tags:
  - type/patch
  - status/pending
  - epic/08
---

# Exercise 15 — Features for Later Discussion

> Upstream: [Epic 08: Workspace Snapshot](../08-workspace-snapshot.md)

These features were built during Exercise 15 (Quality & Observability) on the `exercises/15` branch.
The branch was deleted without merging. This file documents what was built so we can revisit them later.

---

## 1. "Last Synced" Timestamp (from 15.1)

**What:** Show "Last synced: X ago" below the Workspace Snapshot heading.
**Data source:** `ConnectorConfig.lastSyncAt` via Prisma. Falls back to "Never synced" when null.
**Display:** Uses `formatRelativeTime()` from `@/lib/format`.

**Files that would change:**
- `src/lib/snapshot-types.ts` — add `lastSyncedAt: string | null` to `SnapshotData`
- `src/app/(app)/page.tsx` — fetch `ConnectorConfig.lastSyncAt`, pass in data
- `src/components/snapshot-dashboard.tsx` — render subtitle below heading
- `src/__tests__/snapshot-dashboard.test.tsx` — update factory + 2 tests

---

## 2. Workspace Health Badge (from 15.2)

**What:** Colored percentage badge next to the "Workspace Snapshot" heading showing % of automations that are NOT high-risk.
**Thresholds:** Green >= 80%, Yellow >= 50%, Red < 50%.
**Logic:** `computeWorkspaceHealth(automations)` — pure function, counts high-risk vs total.

**Files that would change:**
- `src/lib/snapshot-metrics.ts` — add `computeWorkspaceHealth()` function
- `src/lib/snapshot-types.ts` — add `workspaceHealth: number` to `SnapshotData`
- `src/app/(app)/page.tsx` — compute + pass health
- `src/components/snapshot-dashboard.tsx` — render colored `<Badge>` next to heading
- `src/__tests__/snapshot-metrics.test.ts` — 5 unit tests
- `src/__tests__/snapshot-dashboard.test.tsx` — 4 badge rendering tests

---

## 3. Weighted Health Score Function (from 15.3)

**What:** `getWorkspaceHealthScore(automations): number` — a weighted composite score (0–100) based on governance signal count per automation.
**Scoring:** Per-automation health weight by active signal count: 0 = 1.0, 1 = 0.75, 2 = 0.50, 3 = 0.25, 4+ = 0.0. Workspace score = average × 100, rounded. Empty = 100.
**Note:** This function was not wired into any UI — it's a pure utility that could complement or replace the simpler `computeWorkspaceHealth()`.

**Files that would change:**
- `src/lib/snapshot-metrics.ts` — add `getWorkspaceHealthScore()` with `SIGNAL_COUNT_WEIGHTS` constant
- `src/__tests__/snapshot-metrics.test.ts` — 9 tests

---

## Related

- [Epic 08 Spec](../08-workspace-snapshot.md)
- [Epic 08 Results](../08-workspace-snapshot-results.md)
