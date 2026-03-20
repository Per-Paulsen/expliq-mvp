---
tags:
  - type/patch
  - status/done
  - epic/04
---

# Patch: Parallelize LLM processing

> Upstream: [Epic 04: LLM Pipeline](../04-llm-pipeline.md)

**Epic:** 04 (LLM Pipeline)
**Type:** Performance optimization

## Problem

`processUnprocessedAutomations` in `src/lib/actions/llm.ts` calls `processAutomation` sequentially. Each call takes ~10-12 seconds via OpenRouter. For 10 automations, users wait ~2 minutes. For 50+ automations, this approaches server action timeouts.

The seed script (`scripts/seed-test-data.ts`) has the same sequential pattern for both mock and real workspace LLM processing.

## Solution

Replace sequential `for` loops with parallel batch processing (concurrency = 5). This gives a ~5x speedup with minimal code change.

### Implementation

Add a batch helper:

```typescript
async function processInBatches<T>(
  items: T[],
  fn: (item: T) => Promise<void>,
  concurrency = 5
): Promise<void> {
  for (let i = 0; i < items.length; i += concurrency) {
    await Promise.all(items.slice(i, i + concurrency).map(fn));
  }
}
```

### Files to change

**`src/lib/actions/llm.ts`** — `processUnprocessedAutomations` function (line 30):
- Replace sequential `for (const automation of toProcess)` loop with parallel batches
- Error collection must still work — each concurrent call catches its own errors
- Return shape stays the same: `{ success, summary: { total, processed, errors } }`

**`scripts/seed-test-data.ts`** — Two locations:
- `seedMockWorkspace` LLM loop (~line 1238): sequential `for` → parallel batches
- `seedRealWorkspace` LLM loop (~line 1426): sequential `for` → parallel batches
- Progress logging adjusts to batch-level rather than per-automation

### Test compatibility

Existing tests in `src/__tests__/llm-actions.test.ts` (9 tests) mock `processAutomation` and check:
- `calledTimes(N)` — still correct with parallel
- Error array contents (not order-dependent)
- Return shape `{ success, summary }` — unchanged

No test changes expected.

### Expected improvement

- 10 automations: ~2 min → ~24 seconds (5 concurrent)
- 25 automations (seed script): ~4 min → ~50 seconds
- Users can also set `OPENROUTER_MODEL` to a faster model (e.g., Haiku) for additional speed

## Invocation

```
/patch 'specs/patches/parallelize-llm.md' --epic 04
```

---

## Related

- [Epic 04 Spec](../04-llm-pipeline.md)
- [Epic 04 Results](../04-llm-pipeline-results.md)
