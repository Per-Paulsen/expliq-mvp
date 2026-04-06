# Patch: Add timeSavingsConfidence and revenueConfidence to per-automation LLM output and Automation model (Epic 11) — Brainstorming

## Initial Analysis

### Affected Files

| File | What changes |
|------|-------------|
| `prisma/schema.prisma` (lines 92-93) | Add `timeSavingsConfidence String?` and `revenueConfidence String?` after existing estimate fields |
| `src/lib/llm-pipeline.ts` (lines 37-50, 238-239) | Add fields to `PerAutomationResult` interface + update prompt output schema |
| `src/lib/actions/analysis.ts` (lines 321-322) | Add new fields to Prisma update call |
| `src/__tests__/analysis-pipeline.test.ts` (lines 147-148) | Update `makePerAutomationResult()` mock |
| New migration file | Prisma migration for the two new columns |

### Current Behavior

The per-automation LLM prompt (line 238-239) instructs:
```
"timeSavingsEstimate": "string — range with reasoning and confidence label",
"revenueImpactEstimate": "string — range with reasoning, or N/A",
```

The LLM returns everything in a single string (e.g., `"2-5 hours/week (benchmark-based)"`). There's no separate confidence field — the label is embedded in the text.

### Motivation

The cross-epic review (2026-04-06) identified that Epic 16 (Detail page) needs ConfidenceBadge components for the Business Case Card. ConfidenceBadge expects `"data-driven" | "benchmark-based" | "ai-suggested"` as a prop. Without separate confidence fields, the Detail page would need to parse confidence from the estimate string — fragile and unreliable.

User confirmed: "in-text info is never enough" — consistent with the card-based design system.

### Patterns & Conventions

- The `Recommendation` model already has `confidence: String?` as a separate field — this patch follows the same pattern for per-automation data.
- The LLM prompt uses structured JSON output with explicit field descriptions — adding two more fields follows the existing pattern.
- Confidence values in the system: `"data-driven"`, `"benchmark-based"`, `"ai-suggested"` (from ConfidenceBadge component).

## Questions

### 1. Confidence value vocabulary

The ConfidenceBadge component expects exactly three values: `"data-driven"`, `"benchmark-based"`, `"ai-suggested"`. The LLM prompt for workspace recommendations already specifies: `"confidence": "'data-driven', 'benchmark-based', or 'ai-suggested'"`.

Should the per-automation prompt use the same three values with the same constraint?

**Recommendation:** Yes — use the same three values. The LLM prompt should specify: `"timeSavingsConfidence": "data-driven | benchmark-based | ai-suggested"`. This ensures the values can be passed to ConfidenceBadge with minimal normalization (just the standard `.toLowerCase().replace(/\s+/g, "-")` pattern).

### 2. Estimate string content after splitting

Currently the estimate string contains the confidence label (e.g., `"2-5 hours/week (benchmark-based)"`). After adding a separate confidence field, should the estimate string:

**(A)** Still include the confidence label (redundant but backward-compatible)
**(B)** Drop the confidence label from the text (cleaner, but existing data still has it embedded)

**Recommendation:** (A) Keep the label in the text. The LLM naturally includes it, and stripping it would require prompt engineering to prevent. Existing data remains valid. The UI will use the separate field for the badge and display the full text as-is.

### 3. Null handling for existing data

Existing automations (already analyzed) won't have these fields until re-analyzed. The Detail page must handle `null` gracefully.

**Recommendation:** Fields are `String?` (nullable). The UI shows ConfidenceBadge only when the field is non-null. No backfill needed — fields populate on next Sync & Analyze.

### 4. Side effects

- **Skip-unchanged optimization** (Epic 15): Automations that haven't changed won't be re-analyzed, so they won't get confidence fields until their workflow definition changes or a force re-analyze is triggered. This is acceptable — the UI handles null gracefully.
- **Haiku model** (Epic 15): Per-automation calls use Haiku. The added fields are simple enum-like strings — Haiku handles these well.
- **Dashboard/Opportunities pages**: These use `Recommendation.confidence`, not per-automation confidence. No side effects.

No scope creep risk. No test gaps beyond updating the mock. No alternative approaches needed — this is the straightforward path.

## Implementation Applied

**Commit:** `341319a` — `feat: add per-automation confidence fields to LLM pipeline`

### Files Modified

| File | Change |
|------|--------|
| `prisma/schema.prisma` | Added `timeSavingsConfidence String?` and `revenueConfidence String?` after `revenueImpactEstimate` |
| `prisma/migrations/20260406005638_add_confidence_fields/migration.sql` | New migration adding two nullable text columns |
| `src/lib/llm-pipeline.ts` | Added fields to `PerAutomationResult` interface + `PER_AUTOMATION_SYSTEM_PROMPT` JSON schema |
| `src/lib/actions/analysis.ts` | Added fields to Prisma update call in per-automation result storage |
| `src/__tests__/analysis-pipeline.test.ts` | Updated `makePerAutomationResult()` mock with `timeSavingsConfidence: "benchmark-based"`, `revenueConfidence: "ai-suggested"` |

### Verification Results

| Check | Result |
|-------|--------|
| `npm run test` (278 tests) | Pass (0 failures, 183 skipped — pre-existing R1 skips) |
| `npm run lint` | No new errors (3 pre-existing errors in unrelated files) |
| `npm run build` | Pass (all routes compile, no type errors) |
| Prisma migration | Applied successfully to Supabase |
| DB field verification | Both columns exist and are queryable (null for pre-migration data, as expected) |
