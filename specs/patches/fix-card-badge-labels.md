---
tags:
  - type/patch
  - status/done
  - epic/06
---

# Patch: Fix card badge labels and remove redundant "Inactive" attention signal (Epic 06) — Brainstorming

> Upstream: [Epic 06: Portfolio Screen](../06-portfolio-screen.md)

## Context

After the card layout restructure, several display issues on portfolio cards:
1. Risk badge shows just "medium" — user can't tell it's about risk
2. Timestamps use abbreviated labels "Updated:" and "Docs:" — unclear what was updated
3. "Inactive" appears as both a red attention signal badge AND a gray status badge — redundant and confusing
4. System badge names are raw lowercase from n8n (e.g. "slack" instead of "Slack")

## Changes

### `src/components/portfolio-automation-card.tsx`

- **Risk badge:** `"medium"` → `"medium risk"` (add "risk" label)
- **System badges:** Capitalize first letter (`"slack"` → `"Slack"`)
- **Timestamp 1:** `"Updated:"` → `"Automation updated:"`
- **Timestamp 2:** `"Docs:"` → `"Docs updated:"`

### `src/lib/portfolio-types.ts`

- Remove `"inactive"` from `ATTENTION_SIGNAL_MAP` and `ATTENTION_LABELS`
- Risk engine still computes `inactive` signal (affects risk level), just not displayed as attention badge or filter chip
- Status badge already shows "Inactive" — no information lost

## Analysis

### Affected files
- `src/components/portfolio-automation-card.tsx` — 4 string changes (risk label, system capitalize, timestamps)
- `src/lib/portfolio-types.ts` — remove 2 lines from attention maps

### Test impact
- **`portfolio-automation-card.test.tsx`**: No test asserts on risk badge text directly. Timestamp regexes `/Updated:/` and `/Docs:/` are substring matches — still match longer strings. `queryByText("Inactive").not.toBeInTheDocument()` test renders with all signals false, so already passes.
- **`portfolio-filters.test.ts`**: `computeGlobalCounts` tests may reference "inactive" in attention counts — will need to verify and update if so.
- **Risk engine tests**: Untouched — `inactive` signal computation stays in risk-engine.ts.

### Side effects
- Filter chip row for "Attention" will no longer show "Inactive (N)". This is intentional — the status badge + status filter already cover this.
- Risk level calculation is unaffected (still uses `inactive` signal internally).

### Scope
Minimal and focused. No logic changes, no new behavior — just display label fixes and removing a redundant UI element.

---

## Implementation Applied (2026-03-10)

**Commit:** `18e878a` — `fix: clarify card badge labels and remove redundant Inactive attention signal`

**Files modified:**
- `src/components/portfolio-automation-card.tsx` — Risk badge adds "risk" label, system names capitalized, timestamp labels clarified
- `src/lib/portfolio-types.ts` — Removed "inactive" from ATTENTION_SIGNAL_MAP and ATTENTION_LABELS
- `src/__tests__/portfolio-automation-card.test.tsx` — Updated timestamp test assertions to match new labels

**Verification:**
| Check | Result |
|-------|--------|
| `npm run test` | Pass (178 tests) |
| `npm run lint` | Pass |
| `npm run build` | Pass |
| E2E verification | Playwright — risk shows "high risk"/"medium risk"/"low risk", systems capitalized, timestamps show "Automation updated:"/"Docs updated:", no "Inactive" attention badge (only status badge) |

---

## Related

- [Epic 06 Spec](../06-portfolio-screen.md)
- [Epic 06 Results](../06-portfolio-screen-results.md)
