# Patch: Vercel Analysis Pipeline Reliability (Epic 17) — Brainstorming

## Codebase Analysis

### Current Behavior

`syncAndAnalyze()` in `src/lib/actions/connector.ts:390` triggers the analysis pipeline as fire-and-forget:

```ts
runAnalysisPipeline(workspaceId).catch((err) => {
  console.error("Analysis pipeline failed:", err);
});
return { success: true, summary };
```

This pattern was intentionally introduced in Epic 17 (see `specs/17-settings-seed-polish-results.md` line 32) so the client could return immediately and poll via `getAnalysisStatus()`.

**On Vercel serverless, this is fatal.** Once the response is sent, the function execution context is terminated. The analysis pipeline — which fires 9+ concurrent LLM calls via `Promise.allSettled` — gets killed mid-flight. In the live test (2026-04-06), only 1 of 9 per-automation calls completed before the kill. The workspace analysis ran with just 1 automation, producing 1 business process.

### Affected Files

| File | Current State |
|------|--------------|
| `src/lib/actions/connector.ts` | Fire-and-forget on line 390. `"use server"` directive. Imports `runAnalysisPipeline`. |
| `src/app/(app)/settings/page.tsx` | No route segment config (`maxDuration`, etc.). 43 lines. |
| `src/lib/actions/analysis.ts` | `Promise.allSettled` on line 253. Failed automations silently set to `analysisStatus: "failed"` (lines 329-334) with no logging. |
| `src/__tests__/connector-actions.test.ts` | Mocks `runAnalysisPipeline` (line 117). Tests verify sync returns successfully. |

### Key Constraints

- Next.js 16.1.6 — `after()` from `next/server` is available
- `connector.ts` uses `"use server"` — `after()` works in server actions
- Per-automation LLM timeout: 120s. Workspace LLM timeout: 300s.
- Client already polls via `getAnalysisStatus()` — that pattern stays
- Per-automation calls MUST stay parallel for performance (9 calls complete in ~4s parallel)

---

## Questions

### 1. `after()` vs Dedicated API Route

**Option A — `after()` in server action:** Minimal change. Replace the `.catch()` with `after(() => runAnalysisPipeline(...))`. Add `maxDuration` to settings page. The polling UX is unchanged.

**Option B — Dedicated API route:** Create `/api/analysis/run` POST endpoint with its own `maxDuration`. Client calls it after sync returns. More moving parts but more explicit control.

**Claude's recommendation:** Option A. `after()` is designed exactly for this — background work after response. It's a 3-line change to `connector.ts` plus a 1-line export on the settings page. The polling pattern already works. No reason to add a new route.

### 2. `maxDuration` Value

Vercel Pro plan cap is 300s. For the current 9-workflow case:
- Per-automation (parallel): ~4-10s
- Workspace analysis: 30-120s
- DB operations: ~5-10s
- Total: ~40-140s

300s should cover most real-world cases (up to ~50 workflows). For truly massive workspaces, a phase-split approach would be needed, but that's a separate concern.

**Claude's recommendation:** Set `maxDuration = 300`. It's the Pro plan maximum and covers the realistic envelope. If you're on the Hobby plan (60s cap), this still helps — Vercel caps it silently.

### 3. Error Logging Scope

Currently, failed per-automation calls are silently swallowed:

```ts
} else {
  await prisma.automation.update({
    where: { id: automation.id },
    data: { analysisStatus: "failed" },
  });
}
```

No `console.error`, no reason stored. On Vercel, this means the function logs show nothing when 8 of 9 automations fail.

**Claude's recommendation:** Add `console.error` with the automation name, externalId, and the rejection reason. This is the minimum needed to debug from Vercel logs. No schema changes, no new fields.

### 4. Test Impact

The connector test mocks `runAnalysisPipeline` (line 117). The change from fire-and-forget to `after()` shouldn't break tests since `after()` is a Next.js runtime primitive that won't execute in Vitest. The mock stays the same.

However, we should verify that importing `after` from `next/server` doesn't cause issues in the test environment. It may need a mock.

**Claude's recommendation:** Add a `vi.mock('next/server')` to mock `after` as a no-op in tests. Straightforward.

### 5. Scope Boundary

The patch description also mentions concerns about `maxDuration = 300` not being enough for very large workspaces. Should this patch address that?

**Claude's recommendation:** No. This patch fixes the immediate fire-and-forget kill. Scaling beyond 300s (phase-splitting, queues, etc.) is a separate architectural concern. Keep this patch focused on the 3-file fix.

---

## Implementation Applied (2026-04-06)

**Commit:** `beed038` — `fix: use after() for analysis pipeline reliability on Vercel`

**Files modified:**
- `src/lib/actions/connector.ts` — Replaced fire-and-forget `.catch()` with `after()` from `next/server`; added import
- `src/app/(app)/settings/page.tsx` — Added `export const maxDuration = 300` route segment config
- `src/lib/actions/analysis.ts` — Added `console.error` with automation name/externalId for failed per-automation calls
- `src/__tests__/connector-actions.test.ts` — Added `vi.mock('next/server')` making `after()` execute immediately in tests

**Verification:**
| Check | Result |
|-------|--------|
| `npm run test` | Pass (306 tests, 1 flaky timeout on re-run passed) |
| `npm run lint` | Pass (1 pre-existing error in opportunities-view.tsx) |
| `npm run build` | Pass |
| Real data pipeline | Pass (Sync & Analyze against perpaulsen.app.n8n.cloud — 1 created, 14 unchanged) |
| E2E verification | Pass — Dashboard: 6 processes, 15 workflows. Process Map: all 6 processes with coverage bars. |
