# Design Spike V2 — Visual QA Pass

> Date: 2026-04-06
> Method: Playwright walkthrough with Per reviewing each screen
> Goal: Identify remaining visual issues across all pages

---

## Quick Fixes (implementable now)

| # | Fix | Effort | Files |
|---|-----|--------|-------|
| 2 | Delta banner colors: new recs → `info` (teal), resolved → `positive` (green), new workflows → `neutral` (not negative) | Small | `dashboard-data.ts` |
| 5 | "N moves, total impact": regex-parse dollar amount from LLM string, number in bold mono teal, rest in `text-text-secondary` | Small | `dashboard-view.tsx` |
| 6 | Next Move card clickable: wrap first UnifiedCard in `<Link href={/opportunities?highlight=${id}}>` | Trivial | `dashboard-view.tsx` |
| 7 | Facts Bar: merge 3 KpiCards into one vertical "Facts" card, `grid-cols-3` row with 2 EstimateCards | Medium | `dashboard-view.tsx`, new component or inline |
| 8+9 | EstimateCards: remove dead "methodology →" buttons, remove hardcoded explanation text, change both confidence badges to "benchmark-based" | Small | `estimate-card.tsx`, `dashboard-view.tsx` |
| 10 | Next Move total impact: use `totalOpportunityValue` instead of `totalValueAtRisk` | Trivial | `dashboard-data.ts` line 574 |
| 13 | Clamp confidence: "data-driven" on revenue/time estimates → downgrade to "benchmark-based" in data layers | Small | `dashboard-data.ts`, `detail-data.ts`, `opportunities-data.ts` |
| 14 | Detail page overflow: add `overflow-x-hidden` to page/card container | Trivial | `detail-view.tsx` |
| 15+16 | Detail page ALL long text: (a) step pill truncate at 30 chars, (b) business narrative 2-sentence truncate + "Read more", (c) failure impact same, (d) time savings split at "Reasoning:" — estimate bold mono + collapsed reasoning, (e) revenue connection same | Medium | `detail-view.tsx` |
| 18 | Process Map gap cards: change border from gray to teal (`border-primary/30`) | Trivial | `process-map-view.tsx` line 212 |

## Deferred (need schema/prompt/design changes)

| # | Item | Blocker |
|---|------|---------|
| 1 | Expliq logo asset | Need design/asset |
| 3 | Confidence badge deterministic rules | LLM prompt + rubric design |
| 4 | "Then" card styling | Design decision |
| 9 (Part B) | Compute aggregates from per-automation rollups | Prompt + schema change |
| 9 (Part B, tier 3) | User-provided business inputs for trustworthy estimates | Feature design |
| 11 | Split `impactEstimate` into time/revenue on Recommendations | Schema migration + prompt change |
| 12 | Process card time saved / opportunity value | Depends on #11 |

---

## Findings (continued from Process Map → Detail page)

### 14. Detail page — Horizontal scrollbar / overflow
- **Issue**: The detail page shows a horizontal scrollbar. Caused by the Business Case section: three-column grid (`grid-cols-3`) where Time Savings and Revenue Connection render the FULL LLM reasoning text in `text-lg font-bold font-mono`. Monospace + bold + long unbroken strings overflow the column width.
- **Location**: `src/components/detail-view.tsx` lines 218-222 — `timeSavingsEstimate` rendered as `text-lg font-bold font-mono` in a grid column. Same for `revenueImpactEstimate`.
- **Root cause**: The LLM returns the estimate + full reasoning as one string (e.g., "80-160 minutes per 50 leads (medium confidence). Reasoning: Manual lead triage typically requires 2-3 minutes per lead..."). The entire string is rendered in large bold monospace, causing overflow.
- **Fix**: 
  1. Only the numeric estimate should be in `font-mono font-bold` — the reasoning text should be in normal `text-sm text-text-secondary` body style
  2. Either parse the estimate from the reasoning (regex for the first numeric range), or have the LLM output them as separate fields
  3. Add `overflow-hidden` or `break-words` as a safety net on the card/grid container
- **Quick fix**: Add `overflow-x-hidden` to the detail page container or the Business Case card. Then address the text styling separately.

### 15. Detail page — Time Savings and Revenue Connection show full LLM reasoning
- **Issue**: The Business Case columns show massive text walls because the LLM prompt asks for `"timeSavingsEstimate": "string — range with reasoning and confidence label"` — it tells the LLM to pack the estimate + full reasoning into ONE field. Result: "80-160 minutes per 50 leads (medium confidence). Reasoning: Manual lead triage typically requires 2-3 minutes per lead..." all rendered in bold monospace.
- **Contrast**: Dashboard/Opportunities cards show `impactEstimate` from Recommendations which is short ("$1K-5K monthly cost savings"). Different model, different field, much shorter by design.
- **Location**: `src/lib/llm-pipeline.ts` line 240 (prompt), `src/components/detail-view.tsx` lines 218-222 (rendering)
- **Fix options**:
  1. **Prompt change (proper)**: Split into `timeSavingsAmount` + `timeSavingsReasoning` as separate fields. Display amount in bold mono, reasoning in collapsible section.
  2. **Client-side parse (quick)**: Split at "Reasoning:" or first period. First sentence in bold mono, rest in normal text behind "Show details" toggle.
  3. **Truncate (quickest)**: Show first sentence only, "Show full reasoning" to expand.
- **Recommendation**: Option 2 for now (client-side parse), option 1 in future LLM pipeline iteration.

### 16. Detail page — ALL text fields are too long / unstructured for display
- **Issue**: Every text section on the detail page dumps raw LLM output without any truncation, parsing, or progressive disclosure:
  
  **a) Header step pill**: Shows `"Lead intake and intelligent triage (Step 1 of lead lifecycle management) — Lead Acquisition and Initial Qualification"` — the LLM's `stepName` field packs description + position + context into one string, then it's concatenated with the process name. Way too long for a pill/badge.
  - **Location**: `detail-view.tsx` lines 142-149
  - **Quick fix**: Show only a short step label (parse before first parenthesis, or truncate to ~30 chars). Process name can be separate or on hover.

  **b) Business Narrative**: Full LLM paragraph with no truncation. Can be 5+ sentences.
  - **Location**: `detail-view.tsx` lines 154-163
  - **Quick fix**: Show first 2 sentences, "Read more" to expand. Or max-height with fade + expand.

  **c) Failure Impact**: Full LLM text dump in a constrained column.
  - **Location**: `detail-view.tsx` lines 171-198
  - **Quick fix**: Same — truncate to first 2 sentences, expandable.

  **d) Time Savings**: Estimate + full reasoning in one string, all in bold mono.
  - **Location**: `detail-view.tsx` lines 218-225
  - **Quick fix**: Parse at "Reasoning:" — estimate in bold mono, reasoning in collapsed section.

  **e) Revenue Connection**: Same problem as Time Savings.
  - **Location**: `detail-view.tsx` lines ~235-250
  - **Quick fix**: Same parse + collapse pattern.

- **Root cause**: LLM prompt fields like `"timeSavingsEstimate": "string — range with reasoning and confidence label"` tell the LLM to pack everything into one string. The implementation renders these raw strings directly.
- **Systemic fix (future)**: Split prompt fields into amount + reasoning. e.g. `timeSavingsAmount`, `timeSavingsReasoning`, `stepLabel`, `stepDescription`.
- **Quick fix (this spike)**: Client-side parse + truncate + collapse for ALL long text fields on the detail page:
  1. Step pill: truncate at first `(` or to 30 chars
  2. Business Narrative: show first 2 sentences, "Read more" toggle
  3. Failure Impact: show first 2 sentences, "Read more" toggle
  4. Time Savings: split at "Reasoning:", estimate in bold mono, reasoning collapsed
  5. Revenue Connection: same as Time Savings

### 17. Detail page — stepName contains conflicting process name from different LLM call
- **Issue**: The header pill shows `stepName` (from LLM call 1) + `process.name` (from LLM call 2) concatenated. But call 1 invents its own process name inside stepName (e.g., "Step 1 of lead lifecycle management") which conflicts with the actual process name from call 2 ("Lead Acquisition and Initial Qualification"). Two different names for the same thing, generated independently.
- **Location**: `src/lib/llm-pipeline.ts` line 228 — call 1 prompt: `"stepName": "string — position label in business process"`. `detail-view.tsx` lines 142-149 — concatenates `stepName` + `process.name`.
- **Root cause**: Call 1 (per-automation) doesn't know about the processes that call 2 (workspace) will create. It guesses a process context. Call 2 then creates the real process names. The stepName field is overloaded — it tries to describe BOTH the step function AND its position in a process.
- **Quick fix**: Strip the process context from stepName before display — parse out everything after the first `(` or just show the functional part ("Lead intake and intelligent triage"). The process name comes from the actual process relationship, no need to repeat it.
- **Future fix**: Split prompt field into `stepLabel` (what this automation does in the process, e.g., "Lead intake and triage") and remove the position/process context — that comes from call 2's process mapping.
- **How this happened**: Research spike had short examples ("Order Confirmation", "Lead Classification") anchoring the field. Production prompt dropped the examples, kept only `"stepName": "string — position label in business process"`. Without examples, the LLM drifts to long descriptive strings with invented process names. The fix includes restoring few-shot examples in the prompt.

---

## Patch Brainstorming — Quick Fixes Implementation

### Codebase Verification (2026-04-06)

All 10 quick fixes verified against current code. Key findings:

**Confirmed change points:**
1. `dashboard-data.ts:207` — new workflows type is `"negative"` → change to `"neutral"`
2. `dashboard-data.ts:283` — new recommendations type is `"neutral"` → change to `"info"`
3. `dashboard-data.ts:289,293` — resolved recommendations type is `"info"` → change to `"positive"`
4. `dashboard-data.ts:574` — uses `totalValueAtRisk` → change to `totalOpportunityValue`
5. `dashboard-view.tsx:123-137` — firstRec UnifiedCard has no Link wrapper → add it
6. `dashboard-view.tsx:160-170` — totalOpportunityValue regex parse needed for number highlight
7. `dashboard-view.tsx:174-208` — 5-card grid needs restructuring to 3-card (merged facts + 2 estimates)
8. `estimate-card.tsx` — explanation is a prop passed from `dashboard-view.tsx:197-198`, methodology button at line 42 is dead. Need to: remove explanation prop usage in dashboard-view, remove methodology button, hardcode both badges to "benchmark-based"
9. `detail-view.tsx:142-149` — stepName + process.name concatenated in pill
10. `detail-view.tsx:154-250` — all long text sections need parse + truncate + collapse
11. `process-map-view.tsx:212` — gap border is `border-text-tertiary/30` → change to `border-primary/30`
12. `opportunities-data.ts:87` — confidence passed raw without `normalizeConfidence()` — needs clamping too

**Bonus find:** `opportunities-data.ts` line 87 passes raw `rec.confidence` without normalization. This is where fix #13 (clamp data-driven) should also apply.

### Questions

None — all decisions were made during the spike walkthrough. The quick fixes table is the implementation spec.

### Recommendation

Proceed to Phase 2. All changes are well-defined with exact line numbers. No ambiguity.

---

---

## Implementation Applied (2026-04-06)

**Commit:** `69bd1fc` — `fix: design spike v2 — dashboard, detail, and process map visual fixes`

**Files modified:**
- `src/lib/dashboard-data.ts` — delta colors, totalOpportunityValue fix, confidence clamp
- `src/components/dashboard-view.tsx` — facts bar merge, next move link, impact parse, estimate cleanup
- `src/components/estimate-card.tsx` — removed explanation, methodology button; badge below value
- `src/components/detail-view.tsx` — overflow fix, step pill truncate, all text parse+collapse
- `src/components/process-map-view.tsx` — gap card border gray → teal
- `src/lib/opportunities-data.ts` — confidence clamp in normalizeConfidence, applied to recommendations
- `src/__tests__/detail-utils.test.ts` — updated expectations for data-driven → benchmark-based clamp

**Verification:**
| Check | Result |
|-------|--------|
| `npm run test` | Pass (307 tests) |
| `npm run lint` | Pass (1 pre-existing error in opportunities-view.tsx) |
| `npm run build` | Pass |
| Playwright: Dashboard | Pass — merged facts card, cleaned estimate cards, clickable next move, correct total impact |
| Playwright: Detail page | Pass — no overflow, truncated text with Read more toggles, short step pill |
| Playwright: Process Map | Pass — toggle works, border code verified |
| Console errors | 0 across all pages |

---

### 19. Dashboard — "2 moves, total impact" splitting and color
- **Issue**: The total impact line splits the value incorrectly and inconsistently. Since we now use `totalOpportunityValue` (a different, shorter LLM field), there's no need to regex-parse it. Show the count "2" (or "2 moves") in teal, and the FULL opportunity value string in teal bold mono. No splitting needed.
- **Fix**: Remove `splitEstimate()` logic. Render count in teal, full value in teal bold mono. Simple.

### 20. Dashboard — Combined KPI card: reorder, relabel, remove redundant "of 14 total"
- **Issue**: 
  - Order should be: Processes, Workflows, Active (top to bottom) — not Workflows, Processes, Active
  - "of 14 total" on Active is redundant — Workflows count (14) is shown right above
  - Card needs a label/title like "Process Summary" or similar
- **Fix**: Reorder rows, remove "of 14 total" delta text for active, add a card title.

### 21. Dashboard — Needs Attention cards don't show the affected workflow name
- **Issue**: Attention cards show the process name but not which specific workflow the issue applies to. The card should show the workflow name prominently since the attention is about a specific automation.
- **Investigate**: Check what `attentionItems` contains — is the workflow name in `name` field? If so, is it being shown? Or is the process name being shown instead of the workflow name?

### 22. Dashboard — "5 items" label in Needs Attention is pointless
- **Issue**: The section header shows "5 items" next to "NEEDS ATTENTION" — but there are visually 5 cards, so the count adds nothing. Should either show "5 of N total" (how many attention items exist vs how many are shown, since it caps at 5) or be removed.
- **Fix**: Show "X of Y" if there are more than 5 attention items total (Y > 5), otherwise remove the count entirely.

### 23. Dashboard — Process Coverage cards missing "Time Saved" and opportunity potential
- **Issue**: Same as finding #12 — process cards only show "At Risk" but not "Time Saved" or opportunity potential. This was recorded as deferred (depends on structured recommendation fields, finding #11), but Per is flagging it again.
- **Status**: Still blocked by finding #11 (schema change needed). Record as high-priority for next iteration.

### 24. Detail page — STILL has horizontal scrollbar
- **Issue**: The `overflow-x-hidden` fix from the patch did not fully resolve the horizontal scrollbar. Something else is still overflowing.
- **Fix**: Must find and fix the actual overflow source. Add `overflow-x-hidden` to EVERY card container, or use `max-w-full break-words` on the long text elements. Also check if the Business Case grid columns have min-width issues. THIS MUST BE FIXED — no horizontal scrollbar under any circumstances.

### 25. Detail page — Revenue Connection has explanation text but Time Savings does not
- **Issue**: In the Business Case section, Revenue Connection shows both the estimate AND an explanation paragraph (`data.impact.revenueConnection`), but Time Savings only shows the estimate with no equivalent explanation. This is inconsistent.
- **Investigate**: Check if there's a `timeSavingsExplanation` or equivalent field. The asymmetry may come from the LLM prompt — `impact` JSON has `revenueConnection` but no `timeSavingsExplanation` field.
- **Fix**: Either add explanation to Time Savings (prompt/schema change) or remove it from Revenue Connection (quick fix for consistency).

### 26. Dashboard — "View all" links are inconsistent between Attention and Opportunities
- **Issue**: Needs Attention has "View all on Process Map" at the BOTTOM. Top Opportunities has "View all →" at the TOP RIGHT. Different placement, different wording, different destinations (Process Map vs Opportunities).
- **Fix**: Make both consistent — both at top right, both saying "View all in {destination}" (e.g., "View all in Process Map", "View all in Opportunities").

### 27. Dashboard — All opportunity cards show "BENCHMARK BASED" badge
- **Issue**: After the confidence clamp (finding #13), ALL confidence badges on opportunity/recommendation cards show "BENCHMARK BASED" because `normalizeConfidence()` now clamps "data-driven" to "benchmark-based". This means every card looks the same — the badge adds no information.
- **Root cause**: The clamp was too aggressive. It clamps ALL confidence values, not just revenue/time estimates. Recommendation confidence (which is about the recommendation quality, not a dollar estimate) arguably COULD be data-driven if backed by error rates.
- **Fix options**: (a) Only clamp on `timeSavingsConfidence` and `revenueConfidence` fields, not on `Recommendation.confidence`. (b) Remove badges entirely from dashboard cards since they all say the same thing. (c) Accept for now.

### 28. Dashboard — Needs Attention cards show process name but not workflow name
- **Issue**: The attention cards show the business process name (e.g., "Lead Acquisition and Initial Qualification") in the bottom right, but the card title (`item.name`) shows the n8n workflow name which can look like a step description rather than a recognizable workflow name. The user can't easily tell WHICH workflow needs attention.
- **Investigate**: Check if the `name` field is actually the workflow name from n8n. If so, the issue is that n8n workflow names are sometimes vague. The process name is shown but the specific workflow is unclear.
- **Possible fix**: Show both — workflow name as title (already done), and process name + step position in the scope area. Or make the workflow name more prominent.

### 29. Dashboard — Process Coverage cards still missing "Time Saved"
- **Issue**: Same as findings #12 and #23. Process cards only show At Risk, not Time Saved. Per is flagging this again.
- **Status**: Still blocked by finding #11 (Recommendations need structured time/revenue fields). But per-automation `timeSavingsEstimate` DOES exist and could be aggregated per process even without recommendation changes. This could be a partial fix.

### 30. Detail page — Horizontal scrollbar STILL present
- **Issue**: Despite `overflow-hidden` on Card component and `overflow-x-hidden` on outer container, the scrollbar persists. Root cause identified: Connected Automations section Link elements use `-mx-6 px-6` (negative margin pattern for full-width hover), and the `truncate` class on the business narrative `<p>` inside doesn't clip because the negative margin extends the element beyond the overflow boundary.
- **Fix**: Must either (a) remove the `-mx-6 px-6` pattern from Connected Automations links, or (b) add `overflow-hidden` directly on each Link element, or (c) add `overflow-x-hidden` on the `<main>` element in the app layout. The fix MUST work — this has been flagged 3 times now.

### 31. Detail page — Step pill shows two confusing names
- **Issue**: Per sees "Lead intake and intelligent triage — Lead Acquisition and Initial Qualification" and asks why there are two names after each other for the workflow "AI-Powered Lead Distribution System". This is finding #17 — stepName (from LLM call 1) concatenated with process.name (from LLM call 2). Despite the truncation fix (strip after parenthesis), the remaining text is still confusing: a step description + a process name that look like two names for the same thing.
- **Fix**: Either (a) show ONLY the process name in the pill (remove stepName entirely since it's unreliable), or (b) show stepName as the pill text and process name as a separate element, or (c) reformat as "Step: {shortStepName} in {processName}" to make the relationship clear.

---

## Discussion (Round 2)

### Q: Why are the "View all" links named differently and placed differently?
**A:** Sloppy implementation. One says "View all on Process Map" (bottom), the other says "View all →" (top right). They should both say "View all in {Page Name}" and be in the same position (top right). Simple fix.

**Per:** then do it!
**Decision:** Fix. Both links top-right, "View all in {Page Name}".

### Q: Why do all opportunities now show "BENCHMARK BASED"?
**A:** The confidence clamp in `normalizeConfidence()` was too aggressive — it clamps ALL "data-driven" to "benchmark-based" globally. But `Recommendation.confidence` is about the recommendation quality, not a dollar estimate. It CAN legitimately be "data-driven" when backed by real error rates. The fix: only clamp on `timeSavingsConfidence` and `revenueConfidence` fields, NOT on `Recommendation.confidence`. Need to undo the global clamp and make it targeted.

**Per:** do it!
**Decision:** Fix. Revert the global clamp in `normalizeConfidence()`. Instead, add a separate `clampEstimateConfidence()` that only applies to `timeSavingsConfidence` and `revenueConfidence` fields in the data layers.

### Q: Why do needs attention cards show process name but not workflow name?
**A:** They DO show the workflow name — it's the card title (e.g., "Automate lead scoring step", "HubSpot → Gmail Cold Outreach"). The process name is in the bottom-right corner. But some n8n workflow names look like step descriptions, making it confusing.

**Per:** ah, oke. but why do the needs attention cards not have their own "issue" name like the opportunities?
**A:** Good point. Opportunities show a recommendation name (LLM-generated, action-oriented like "Fix broken Slack channel configurations"). Attention cards show the workflow name from n8n, then the `businessNarrative` as description, then the metric ("Needs review", "31% error rate"). There's no separate "issue name" — the card relies on the metric + narrative to explain what's wrong. The workflow name IS the title. The difference is that opportunities have a human-readable action name from the LLM, while attention items use the raw n8n workflow name. To fix this we'd need the LLM to generate an "issue summary" per attention item — that's a prompt change, deferred.
**Decision:** Deferred — needs LLM prompt change to generate issue names per automation.

### Q: Why is there no time saved on the process cards?
**A:** The data doesn't exist per-process. Per-automation `timeSavingsEstimate` is an LLM string we can't easily sum. Blocked by finding #11.

**Per:** but a "at risk" exists per-process?
**A:** Yes — `BusinessProcess.valueAtStake` is a single LLM string from call 2 (workspace analysis). The LLM generates it per process directly. But there's no equivalent `timeSavings` field on BusinessProcess. The LLM was only asked for `valueAtStake`, not `timeSavings`. To fix: add `timeSavings` field to BusinessProcess model and LLM workspace prompt. That's a schema + prompt change.
**Decision:** Deferred — needs schema migration + prompt change. Add to the same future iteration as finding #11.

### Q: Why is the horizontal scrollbar STILL there?
**A:** Connected Automations Link elements use `-mx-6 px-6` negative margin. This extends beyond overflow boundaries.

**Per:** fucking fix it!
**Decision:** Fix. Add `overflow-hidden` on each Link element in Connected Automations AND Recommendations sections. If that still doesn't work, add `overflow-x-hidden` to the `<main>` element in the app layout as a nuclear option.

### Q: What do "Lead intake and intelligent triage — Lead Acquisition and Initial Qualification" mean?
**A:** stepName from LLM call 1 + process.name from LLM call 2 concatenated.

**Per:** why dont you simply delete the process name from call 1 ie dont show it!?
**Decision:** Fix. Show ONLY `process.name` in the pill, drop `stepName` entirely from the detail page header. The process name from call 2 is the authoritative one. stepName is unreliable and redundant.

---

### 18. Process Map — Gap cards should have teal dashed border, not gray
- **Issue**: Gap cards use `border-dashed border-2 border-text-tertiary/30` (gray). Gaps represent opportunities (missing automations that could be built). Opportunities = teal throughout the app. The border should be teal.
- **Location**: `src/components/process-map-view.tsx` line 212
- **Current**: `border-dashed border-2 border-text-tertiary/30`
- **Fix**: Change to `border-dashed border-2 border-primary/30 hover:border-primary/50`
- **Effort**: Trivial — one line.

is already resolved

---

## Round 2 Patch — Codebase Status (2026-04-06)

Some fixes were partially applied during the spike. Here's what's done vs what still needs work:

**Already applied (from earlier edits):**
- ✅ #19: splitEstimate removed, total impact renders count + full value in teal
- ✅ #20: KPI card reordered (Processes/Workflows/Active), "Overview" label added, "of 14 total" removed from Active
- ✅ #22: "5 items" label removed from Needs Attention
- ✅ #24/#30: overflow-hidden added to Card component and Link elements in detail-view.tsx (needs verification after cache clear)
- ✅ #25: revenueConnection explanation text removed from Revenue Connection section

**Still needs fixing:**
- ❌ #26: "View all" links inconsistent — Attention says "View all on Process Map" (bottom), Opportunities says "View all →" (top right). Need: both at top right, both "View all in {destination}".
- ❌ #27: Confidence clamp still global in `normalizeConfidence()` — need to revert global clamp, add targeted `clampEstimateConfidence()` for timeSavingsConfidence/revenueConfidence only.
- ❌ #31: Step pill still shows `shortStepName(data.stepName) — process.name`. Decision: drop stepName, show ONLY process.name.
- ❓ #30: Horizontal scrollbar — overflow-hidden was added but not verified (cache was stale when last checked). Must verify.

**No questions remaining — all decisions made. Ready for implementation.**

---

## Findings

### 1. Login Page — No Expliq logo asset
- **Issue**: "Expliq" is plain bold text. No actual logo (SVG/PNG) exists in the repo.
- **Location**: `src/app/(auth)/login/page.tsx` line 44, also `src/components/app-sidebar.tsx` line 45
- **Current**: `<h2 className="text-xl font-bold text-foreground">Expliq</h2>`
- **Impact**: Looks unbranded. Every SaaS login has a proper logo mark.
- **Fix**: Need a logo asset (SVG preferred) in `public/` — used on auth pages and sidebar.
- **Decision**: Keep text for now, address later.

### 2. Dashboard — Delta banner color inconsistency
- **Issue**: Colors in the delta banner don't follow a consistent meaning system.
- **Location**: `src/lib/dashboard-data.ts` lines 191-295 (segment generation), `src/components/dashboard-view.tsx` lines 43-48 (color map)

**Current segment types and their colors:**

| Delta event | Segment type | Color | Problem |
|---|---|---|---|
| "3 new recommendations" | `neutral` | black | Recommendations are teal throughout the app (opportunities). Should be teal. |
| "10 recommendations resolved" | `info` | teal | Resolved = positive outcome. But teal = opportunities/interactive elsewhere. Confusing. |
| "+2 new workflows detected" | `negative` (number) + `neutral` (text) | amber + black | New workflows aren't inherently negative — they're informational. |
| "2 workflows removed" | `negative` | amber | Correct — removal is attention-worthy. |
| "improved 31% → 12%" | `positive` | green | Correct — improvement is green. |
| "error rate worsened" | `negative` | amber | Correct — worsening is amber. |
| "workflow now active/inactive" | `neutral` | black | OK — status change is informational. |

**App-wide color meanings (from design guidelines §1):**

| Color | Meaning | Used for |
|---|---|---|
| Teal (#0d9488) | Interactive, opportunity, positive action | Links, CTAs, opportunity cards, recommendations, "methodology →" |
| Green (#22c55e) | Healthy, improved, success | Governance dots, coverage bars, act-now tier, improved metrics |
| Amber (#f59e0b) | Attention, at-risk, warning | Governance dots, investigate tier, worsened metrics |
| Red (#ef4444) | Critical, error, failure | Governance dots, error rates, critical impact |

**Proposed fix — consistent delta color mapping:**

| Delta event | Should be | Reasoning |
|---|---|---|
| New recommendations | **teal** (`info`) | Recommendations = opportunities = teal throughout the app |
| Resolved recommendations | **green** (`positive`) | Resolved = positive outcome, improvement |
| New workflows detected | **neutral** (black) | Informational, not negative |
| Workflows removed | **amber** (`negative`) | Attention-worthy change |
| Error rate improved | **green** (`positive`) | Correct as-is |
| Error rate worsened | **amber** (`negative`) | Correct as-is |
| Active/inactive toggle | **neutral** (black) | Correct as-is |

**Code changes needed:**
1. `dashboard-data.ts` line 281: `"3 new recommendations"` → change type from `"neutral"` to `"info"` (teal)
2. `dashboard-data.ts` lines 287-294: `"resolved"` → change type from `"info"` to `"positive"` (green)
3. `dashboard-data.ts` lines 205-208: `"+N new workflows"` number → change from `"negative"` to `"neutral"` (not inherently bad)
4. Design guidelines line 23: "Resolved/positive change = teal" conflicts with this fix (we'd use green). Update guideline.

### 3. Dashboard — Confidence badge meaning is fuzzy
- **Issue**: The "DATA DRIVEN" / "BENCHMARK BASED" / "AI SUGGESTED" badges on recommendation cards have no deterministic criteria. The LLM picks the label based on its own judgment.
- **Location**: `src/lib/llm-pipeline.ts` lines 242-243 (prompt fields), `src/components/confidence-badge.tsx` (display)
- **Intended distinction** (from PRD):
  - Data-driven: estimate derived from the user's actual execution data (error rates, run counts)
  - Benchmark-based: estimate based on industry knowledge, not user-specific data
  - AI-suggested: pure inference, may be wrong
- **Reality**: The LLM receives the same data (workflow JSON + execution stats) for all automations. No rubric or criteria in the prompt tells it when to use which label. The distinction is the LLM's subjective call.
- **Impact**: Users can't trust the badge as a reliable signal. A "data-driven" estimate may not be meaningfully more grounded than an "ai-suggested" one.
- **Status**: Known limitation. Potential future fix: add deterministic rules (e.g., if errorRate > 0 and runsPerWeek > 10 → data-driven, else ai-suggested) or remove the badge entirely.

### 4. Dashboard — "Then" follow-up card is visually inconsistent
- **Issue**: In "Your Next Move", the second recommendation ("Then" row) is a stripped-down link with gray background (`bg-surface-raised`), no tier badge, no confidence badge. Looks like a different component type than the first recommendation (full UnifiedCard).
- **Location**: `src/components/dashboard-view.tsx` lines 139-158
- **Current**: Name + brief + impact estimate in a flat row. No tier badge, no white card background.
- **Spec says**: Design guidelines mention "follow-up card" — so reduced is intentional. Epic 13 spec originally described nextMoveText as a narrative paragraph, not individual cards.
- **Options considered**: (a) Make it a full UnifiedCard — too heavy. (b) Add tier badge to the reduced row — lightweight improvement.
- **Decision**: Leave as-is for now. Revisit if it bothers demo audience.

### 5. Dashboard — "N moves, total impact" line has two problems
- **Issue A — Too much highlighting**: The count "2" is bold mono foreground, the impact value is bold mono teal. But the label text "moves, total impact:" is also styled (tertiary), making the whole line feel heavy. Only the numbers should stand out.
- **Location**: `src/components/dashboard-view.tsx` lines 160-170
- **Current**:
  ```
  <span className="font-bold font-mono text-foreground">2</span> moves, total impact:
  <span className="font-bold font-mono text-primary">{totalOpportunityValue}</span>
  ```
- **Fix**: The label text is already `text-text-tertiary` which is correct. The real issue is that `totalOpportunityValue` is a long LLM-generated string like "$500K-1.5M+ annually if critical automation failures occur" — the entire string is rendered in bold teal mono. Only the dollar amount should be highlighted, not the explanatory text. But since the value comes as a single string from the LLM, we can't easily split it. Possible fixes:
  - (a) Remove `font-bold font-mono` from the impact span, keep only `text-primary` — less heavy
  - (b) Parse the dollar amount from the string and highlight only that
  - (c) Ask the LLM to return amount and explanation separately (schema change)

- **Issue B — No methodology link**: The total impact value comes from `CompanyProfile.aggregateEstimates.totalValueAtRisk`, which is an LLM-generated string from `analyzeWorkspace()` (call 2). There is no methodology link or explanation of how this number was derived. The design guidelines say "Every estimate shows confidence + methodology" but this one has neither.
- **Source**: `src/lib/llm-pipeline.ts` line 388 — the workspace analysis prompt asks for `"totalValueAtRisk": "string"` with no guidance on methodology or confidence.
- **Fix options**:
  - (a) Add "methodology →" link pointing to a tooltip or the detail page
  - (b) Add a confidence badge to this summary line
  - (c) Accept as-is since the individual recommendation cards already have confidence badges
- **Decision**: Numbers MUST stay bold mono teal — design guidelines "numbers rule" is non-negotiable. The fix is to separate the value from the explanation so they can be styled independently. Two approaches:
  - (a) **Schema change**: Split `totalValueAtRisk` into `totalValueAtRiskAmount` ("$500K-1.5M+") and `totalValueAtRiskExplanation` ("annually if critical automation failures occur"). Requires LLM prompt update + migration.
  - (b) **Client-side parse**: Regex extract the dollar/euro amount from the string, render amount in bold mono teal, remainder in normal text-text-secondary. Fragile but no schema change.
  - Recommendation: (b) for now, (a) in a future LLM pipeline iteration. Methodology link deferred.

### 6. Dashboard — "Your Next Move" top card is not clickable
- **Issue**: The first recommendation UnifiedCard in "Your Next Move" has `cursor-pointer` and hover effects (from the UnifiedCard component) but is NOT wrapped in a link or onClick handler. It looks clickable but does nothing. The "Then" card below it IS a link to `/opportunities?highlight={id}`.
- **Location**: `src/components/dashboard-view.tsx` lines 123-137 (no Link wrapper), `src/components/unified-card.tsx` line 53 (`cursor-pointer` baked into the component)
- **Expected behavior**: Clicking the card should navigate to `/opportunities?highlight={firstRec.id}` (same as the "Then" card pattern).
- **Fix**: Wrap the UnifiedCard in a `<Link href={/opportunities?highlight=${firstRec.id}}>` tag. Same pattern as the "Then" card at line 140.

### 7. Dashboard — Facts Bar cards have mismatched sizes
- **Issue**: All 5 cards share equal width (`grid-cols-5`), but the first 3 (KpiCard: Workflows, Processes, Active) contain only a label + single number + optional delta — they're mostly empty space. The last 2 (EstimateCard: Time Saved, At Risk) contain a label + long LLM value + explanation paragraph + confidence badge + methodology link — they're cramped.
- **Location**: `src/components/dashboard-view.tsx` lines 175-208, grid is `grid grid-cols-2 lg:grid-cols-5 gap-4`
- **Components**: `src/components/kpi-card.tsx` (simple), `src/components/estimate-card.tsx` (rich)
- **Visual effect**: Three large empty cards on the left, two cramped cards on the right. The estimates text wraps heavily and looks squeezed.
- **Fix options**:
  - (a) **Unequal columns**: Use `grid-cols-[1fr_1fr_1fr_2fr_2fr]` or similar so estimate cards get more space
  - (b) **Two rows**: KpiCards in a row of 3 (smaller), EstimateCards in a row of 2 (wider) below
  - (c) **Compact KpiCards**: Make the 3 fact cards narrower/shorter, let estimates fill remaining space
- **Decision**: Merge the 3 KpiCards into one "Facts" card with vertical stacked rows. Then 3 cards total in a single `grid-cols-3` row: Facts card (compact, vertical list of Workflows/Processes/Active with label + value per row) + Time Saved EstimateCard + At Risk EstimateCard. Equal width, matched content density.
- Also: "methodology →" buttons on both EstimateCards are dead (`<button>` with no handler). Record as separate finding.

### 8. Dashboard — "methodology →" buttons are non-functional
- **Issue**: Both EstimateCards (Time Saved, At Risk) have a "methodology →" button that does nothing — `<button>` with no onClick, no link.
- **Location**: `src/components/estimate-card.tsx` lines 42-44
- **Impact**: Looks like a broken link. Either implement it (tooltip/modal explaining how the estimate was derived) or remove it.
- **Decision**: TBD — needs a design decision on what methodology display looks like.

### 9. Dashboard — Aggregate estimates have no real basis
- **Issue**: The "Time Saved" and "At Risk" EstimateCards show LLM-generated aggregate values (`totalTimeSavings`, `totalValueAtRisk`) that are NOT computed from real data or per-automation rollups. The LLM invents a range string based on the per-automation summaries it received, with no formula, no verification, no consistency check against individual estimates.
- **What IS computed from real data**: runsPerWeek, errorRate, avgDurationMs, lastExecutedAt (from n8n execution history), governance dots (deterministic rules in risk-engine.ts)
- **What is pure LLM**: All aggregate estimates, all per-automation time/revenue estimates, all confidence labels on per-automation cards
- **Confidence badges are hardcoded**: `dashboard-view.tsx` lines 198-199 hardcode "benchmark-based" for Time Saved and "ai-suggested" for At Risk — these don't come from the LLM
- **Explanation text is also hardcoded**: "Manual effort replaced by existing automations..." and "Revenue exposure from current error rates..." are static strings in the dashboard component, not LLM output
- **No methodology section exists for aggregates**: The "methodology →" button is dead (finding #8), and even if it worked, there's no methodology to show — the LLM just produced a string
- **PRD says**: "Every estimate shows confidence + methodology" — this is violated for aggregates
- **Fundamental questions**:
  1. Should aggregates be computed by summing/averaging per-automation values instead of asking the LLM?
  2. Should there be a methodology page/modal explaining how estimates are derived?
  3. Should the hardcoded confidence badges be removed or made dynamic?
  4. Are these cards even trustworthy enough to show so prominently on the dashboard?
- **Decision**: Two-part fix:

**Part A — Quick fix (this spike):**
  - Change both EstimateCard confidence badges to hardcoded "benchmark-based" — honest minimum (LLM has execution stats but no real business data, so never "data-driven", but not pure guesswork either)
  - Remove hardcoded explanation text — it's not from the LLM and adds false authority
  - Remove dead "methodology →" buttons — they link to nothing
  - Keep the LLM aggregate values

**Part B — Future architecture fix:** Replace LLM aggregates with computed rollups:
  1. Parse per-automation `timeSavingsEstimate` and `revenueImpactEstimate` strings (regex extract numeric ranges)
  2. Sum ranges across all automations: totalLow = sum of lows, totalHigh = sum of highs
  3. Derive confidence from per-automation confidence values (worst-of-inputs, not hardcoded)
  4. Build real methodology section showing per-automation breakdown
  5. Remove `aggregateEstimates` from LLM workspace call prompt — no longer needed
  - This makes aggregates transparent, verifiable, and honestly grounded

**Important context:** The LLM workspace call (call 2) does MORE than just aggregates — it produces recommendations, business process clusters, connected automations, and process suggestions based on cross-automation analysis. Those are legitimate workspace-level LLM outputs — qualitative judgments are what LLMs are good at. The aggregate numbers are different because they're quantitative claims that users expect to be grounded in math.

**However:** The per-automation estimates are also LLM-invented. If we trust those on individual cards, the aggregate isn't fundamentally worse — the real problem is presenting them with fake authority (hardcoded badges, dead methodology links). If shown honestly as "AI estimate" they may be acceptable.

**Can the LLM produce trustworthy per-automation numbers?**
- **Time saved**: LLM has half the equation — `runsPerWeek` from real execution data — but guesses manual effort per run based on workflow name/node types. Rough but directional.
- **Revenue at risk**: Weaker — LLM has no revenue data. Infers from system names ("touches Salesforce + Stripe → probably revenue-related"). A workflow called "Invoice Processing" gets a high estimate simply because of its name.
- **What would make them trustworthy**: User-provided business inputs (average deal size, hourly rate, revenue per process). Then formula: `deal_size × error_rate × runs/week = actual risk`. Without user inputs, it's always inference from names and patterns.
- **Bottom line**: LLM estimates are useful as **directional signals** ("this is roughly more valuable than that") but not trustworthy as **absolute numbers**. Aggregates amplify this uncertainty.

**Three-tier fix path:**
1. **Now (this spike)**: Strip fake authority — remove hardcoded badges, explanations, dead methodology links. Show aggregate values as plain cards.
2. **Near-term**: Add honest framing — "AI estimate based on cross-automation analysis" label. Compute aggregates by summing parsed per-automation values for consistency.
3. **Future**: Let users provide business inputs (deal size, hourly rate per process). Use formula-based computation where inputs exist, LLM estimates as fallback. Confidence badge becomes deterministic: has user inputs → "data-driven", has execution data only → "benchmark-based", name-only inference → "ai-suggested".

### 10. Dashboard — "total impact" in Next Move is wrong data, wrong color
- **Issue A — Same value shown twice**: The "total impact" under Your Next Move shows `totalOpportunityValue`, which is mapped to `aggregateEstimates.totalValueAtRisk` in `dashboard-data.ts` line 574. This is the SAME value as the "At Risk" EstimateCard. User sees "$500K-1.5M+ annually if critical automation failures occur" in two places.
- **Issue B — Wrong color**: The value is shown in teal (`text-primary`) because it's framed as "total impact" (opportunity). But the content is about failure/risk. Teal = opportunity, amber = risk per the design system. Either the color should be amber, or the value should be `totalOpportunityValue` (the actual opportunity field from the LLM), not `totalValueAtRisk`.
- **Issue C — Missing time saved**: The LLM outputs three aggregate fields: `totalTimeSavings`, `totalValueAtRisk`, `totalOpportunityValue`. But `totalTimeSavings` is never shown in the Next Move section. If the recommendations save time, that should be surfaced here too.
- **Location**: `src/lib/dashboard-data.ts` line 574 (`totalValueAtRisk` used as `totalOpportunityValue`), `src/components/dashboard-view.tsx` lines 160-170
- **Fix**: 
  1. Use the actual `totalOpportunityValue` field from the LLM (not `totalValueAtRisk`) for the Next Move total impact
  2. If `totalOpportunityValue` is null/empty, fall back to `totalValueAtRisk` but show in amber
  3. Consider showing `totalTimeSavings` alongside if available

### 11. Schema — Recommendations lack separate time/revenue estimates
- **Issue**: Automations have separate `timeSavingsEstimate` + `revenueImpactEstimate` fields (with individual confidence), but Recommendations only have a single `impactEstimate` string that mixes everything ("Complete routing failure for all incoming leads" or "~€1.2K/mo"). This makes it impossible to compute separate time-saved vs revenue-at-risk aggregates for recommendations.
- **Location**: `prisma/schema.prisma` — Automation model (lines 92-95) has split fields, Recommendation model (line 161) has only `impactEstimate`
- **Root cause**: LLM workspace prompt (call 2) asks for `"impactEstimate": "string"` per recommendation, not structured time/revenue. Per-automation prompt (call 1) asks for separate fields.
- **Fix (future)**: 
  1. Add `timeSavingsEstimate`, `revenueImpactEstimate`, `timeSavingsConfidence`, `revenueConfidence` to Recommendation model
  2. Update LLM workspace prompt to output structured impact per recommendation
  3. Enables proper aggregate rollups: "total time saved by recommendations" vs "total revenue protected"
  4. Schema migration + prompt change + UI update

### 12. Dashboard — Process Coverage cards only show "At Risk", missing time saved and opportunity value
- **Issue**: ProcessCard metrics row shows Reliability + At Risk + Recommendations count. Missing: time saved per process and total opportunity value from linked recommendations.
- **Location**: `src/components/process-card.tsx` lines 80-98 (metrics row), `src/lib/dashboard-data.ts` (processCoverage builder)
- **Root cause**: Same as finding #11 — per-automation `timeSavingsEstimate` is never aggregated per process, and recommendations lack structured time/revenue fields to sum.
- **What would be needed**:
  1. Aggregate per-automation `timeSavingsEstimate` for automations belonging to each process
  2. Aggregate per-recommendation `impactEstimate` (or future split fields) for recommendations linked to each process
  3. Show both alongside "At Risk" in the metrics row: Reliability | Time Saved | At Risk | Recommendations
- **Depends on**: Finding #11 (structured impact fields on Recommendations) + client-side parsing of estimate strings
- **Decision**: Future fix, blocked by finding #11.

### 13. App-wide — Revenue/time estimates must never be "data-driven"
- **Issue**: The LLM sometimes assigns "data-driven" confidence to `timeSavingsConfidence` and `revenueConfidence` fields, but it has no actual revenue data or manual process timings. It only has execution stats (runsPerWeek, errorRate) and workflow structure. These estimates are always inferred, never computed from real business data.
- **Rule**: Until users can provide business inputs (deal size, hourly rate), revenue and time estimates can only be:
  - **"benchmark-based"** — when backed by execution stats (runsPerWeek, errorRate exist)
  - **"ai-suggested"** — when inferred from workflow names/node types alone
  - **Never "data-driven"** — that requires actual business data we don't have
- **Fix**: Clamp confidence in the data layer — if `timeSavingsConfidence` or `revenueConfidence` comes back as "data-driven" from the LLM, downgrade to "benchmark-based". Apply in `dashboard-data.ts`, `detail-data.ts`, `opportunities-data.ts` wherever these values flow to the UI.
- **Scope**: Minor code fix, can do in this spike's patch.



