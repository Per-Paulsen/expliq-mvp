# Vercel Analysis Pipeline Reliability Fix

> Date: 2026-04-06
> Context: Live test on Vercel with real n8n data (9 FairTix workflows). Only 1 of 9 per-automation LLM calls succeeded; 8 were killed when Vercel terminated the serverless function.

---

## Root Cause

`syncAndAnalyze` in `src/lib/actions/connector.ts` (line 390) calls `runAnalysisPipeline()` as **fire-and-forget** — it doesn't `await` the result and returns immediately. On Vercel serverless, once the response is sent the execution context is terminated, killing all in-flight LLM calls.

The 9 parallel per-automation calls fire via `Promise.allSettled`, but Vercel kills the function ~1-2s after the response. Only the fastest call completes; the other 8 fail silently. The workspace analysis then runs with just 1 automation summary, producing 1 business process with 1 linked workflow.

Confirmed locally: all 9 calls succeed in ~4s when the function isn't killed.

## Decisions

### 1. Use `after()` from `next/server` for background analysis

Replace the raw fire-and-forget with Next.js's `after()` primitive. This tells the Vercel runtime to keep the function alive for background work after the response is sent.

**File:** `src/lib/actions/connector.ts` (~line 389-392)

Before:
```ts
runAnalysisPipeline(workspaceId).catch((err) => {
  console.error("Analysis pipeline failed:", err);
});
```

After:
```ts
import { after } from 'next/server';

after(async () => {
  try {
    await runAnalysisPipeline(workspaceId);
  } catch (err) {
    console.error("Analysis pipeline failed:", err);
  }
});
```

### 2. Set `maxDuration = 300` on the settings page route

The settings page is where `syncAndAnalyze` is called from. `maxDuration` controls how long Vercel keeps the function alive (including `after()` work).

**File:** `src/app/(app)/settings/page.tsx`

Add route segment config export:
```ts
export const maxDuration = 300;
```

300s covers the current case (9 workflows: ~4s parallel per-auto + ~30-120s workspace). For very large workspaces (50+ workflows), a phase-split approach would be needed — but that's a separate concern.

### 3. Add per-automation error logging in the analysis pipeline

Currently, failed per-automation calls are silently swallowed by `Promise.allSettled`. Add console.error for each failure so Vercel logs show exactly which automations failed and why.

**File:** `src/lib/actions/analysis.ts` (~line 329-334, inside the `settled.status !== "fulfilled"` branch)

Add before updating the DB:
```ts
console.error(
  `Per-automation analysis failed for ${automation.name} (${automation.externalId}):`,
  settled.reason
);
```

### 4. Keep per-automation calls parallel

No concurrency limiting needed for the current scale. The 9 concurrent calls complete in ~4s total. If scale grows significantly, a concurrency limiter (e.g., batches of 10) can be added later.

## Files Affected

| File | Change |
|------|--------|
| `src/lib/actions/connector.ts` | Replace fire-and-forget with `after()` |
| `src/app/(app)/settings/page.tsx` | Add `maxDuration = 300` export |
| `src/lib/actions/analysis.ts` | Add error logging for failed per-automation calls |

## Verification

After deploying:
1. Sign in on Vercel deploy, go to Settings, trigger sync
2. Wait for analysis to complete (poll status or watch dashboard)
3. All 9 automations should have `businessNarrative` populated
4. Multiple business processes should appear in Process Map
5. Check Vercel function logs — no per-automation failures should appear
