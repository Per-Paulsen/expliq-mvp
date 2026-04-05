---
tags:
  - type/results
  - status/done
  - epic/15
---

# Epic 15 — Opportunities: Results

> Upstream: [Epic 15: Opportunities](15-opportunities.md)

## What Was Built

Opportunities page with all recommendations grouped by tier (ACT NOW, INVESTIGATE, EXPLORE), slide-over panel with full recommendation detail (business case, evidence, honest framing, implementation notes, systems), deploy modal for new_workflow recommendations (LLM generation → JSON preview → n8n deployment), process suggestion collapsible sections, deep-linking via highlight URL param, and process filtering via process URL param.

## Key Files Created/Modified

### New Files (6)

| File | Purpose |
|------|---------|
| `prisma/migrations/20260405212742_add_recommendation_automation_id/migration.sql` | Adds `automationId` FK to Recommendation model |
| `src/lib/opportunities-data.ts` | `prepareOpportunitiesData(workspaceId)` — queries recommendations split by tier + process suggestions. Normalizes tier strings, extracts evidence chain from JSON. |
| `src/components/opportunities-view.tsx` | "use client" component. Tier sections with styled headers, UnifiedCard per recommendation, slide-over panel on click, deploy modal (4-state flow), process filter bar, deep-link highlight with accent pulse. |
| `src/lib/actions/deploy.ts` | Two server actions: `generateDeployJson()` (LLM call → cached JSON) + `deployToN8n()` (n8n client deploy + activate). |
| `src/app/(app)/opportunities/error.tsx` | Client error boundary for Opportunities route. |
| `src/__tests__/opportunities.test.tsx` | 15 tests covering AC 34-40 plus empty state and slide-over close. |

### Modified Files (5)

| File | Change |
|------|--------|
| `prisma/schema.prisma` | Added `automationId String?` + Automation relation on Recommendation. Added reverse `recommendations` relation on Automation. |
| `src/lib/llm-pipeline.ts` | Added `automationId` to `WorkspaceRecommendation` interface and workspace prompt output schema. |
| `src/lib/actions/analysis.ts` | Stores `automationId` from LLM response when creating Recommendation records. |
| `src/app/(app)/opportunities/page.tsx` | Complete rewrite from stub to async server component. Handles empty/analyzing/failed/complete states. |
| `src/__tests__/route-smoke.test.tsx` | Updated Opportunities smoke test for async server component pattern. |

## Decisions and Deviations from Spec

1. **automationId migration folded into Epic 15** — The spec called for adding `automationId` to Recommendation. This was resolved as part of the cross-epic review (OQ 3). Migration, LLM prompt update, and pipeline update all done in this epic.

2. **Tier normalization** — LLM stores tier as "act now" (with space). Data layer normalizes to "act-now" for the frontend using `tier.toLowerCase().replace(/\s+/g, "-")`.

3. **Evidence extraction** — The `evidence Json?` field stores `{ chain: string }`. Data layer extracts: `(rec.evidence as { chain?: string })?.chain ?? null`.

4. **Deploy modal as inline component** — Rather than a separate file, the DeployModal is defined within `opportunities-view.tsx` since it's only used there. 4-state flow: generate → preview → deploying → success/error.

5. **Type safety fix for deployToN8n return** — The server action returns `instanceUrl` and `workflowId` as potentially undefined. Fixed with `?? ""` fallback in the setState call.

6. **Process filter shows process ID when name unavailable** — If the process filter URL param doesn't match any recommendation's processId, the raw ID is displayed (graceful degradation rather than hiding the filter bar).

7. **No ProcessSuggestion data in current pipeline** — The analysis pipeline doesn't create ProcessSuggestion records with the current LLM prompt. The UI handles this gracefully (empty sections hidden). Process suggestions will appear when the LLM is prompted to generate them.

## Verification Results

| Check | Result |
|-------|--------|
| `npm run test` (279 tests, 24 files) | Pass (183 skipped — R1 test files) |
| `npm run build` | Pass (all routes compile, /opportunities is dynamic) |
| `npm run lint` | No new errors (pre-existing: R1 files, demo page) |
| Playwright browser verification | Pass — all features verified with real Fairtix data |

### Test Coverage (15 new tests)

- `opportunities.test.tsx`: 15 tests — AC 34 (tier sections render + ordering + empty tier hiding), AC 35 (slide-over opens with business case + implementation notes + honest framing + systems + deploy button + workflow link), AC 36 (process suggestions expand with child recs), AC 37 (deploy modal loading + preview + cached skip), AC 38 (deep-link highlight ring), AC 39 (process filter + clear filter navigation), AC 40 (generateDeployJson called with correct ID), empty state, slide-over close
- `route-smoke.test.tsx`: Updated Opportunities test (async server component with empty state)

### Playwright Browser Verification

Verified with real Fairtix pipeline data (seed-real workspace, existing analysis data):

1. **Tier sections** — 3 ACT NOW, 3 INVESTIGATE, 2 EXPLORE recommendations. All with correct tier badges (green/amber/gray), confidence badges, impact estimates, process names.

2. **Slide-over panel** — Clicked "Add error handling to lead capture". Panel opens with full business case text referencing the HubSpot → Gmail workflow, API timeout details, and €300-500 per lost opportunity estimate.

3. **Deep-linking** — `/opportunities?highlight={id}` scrolls to and highlights the target recommendation with accent ring pulse (2s).

4. **Process filter** — `/opportunities?process={id}` shows filter bar with process name and "Clear filter" button. Correctly filters to matching recommendations.

Screenshots: `epic-15-opportunities-full.png`, `epic-15-slide-over.png`, `epic-15-deep-link.png`, `epic-15-process-filter.png`

## Risks for Future Epics

1. **Deploy flow untested with real n8n** — The deploy modal and server actions are implemented but not tested end-to-end against a real n8n instance. The LLM generates a scaffold JSON, but production-quality workflow generation may need prompt tuning.

2. **automationId not populated for existing data** — Existing recommendations (from prior sync runs) don't have `automationId` set. The field will be populated on the next Sync & Analyze run since the LLM prompt now includes it in the output schema.

3. **ProcessSuggestion sections empty** — The current LLM workspace prompt generates recommendations but doesn't consistently create ProcessSuggestion records. The UI handles this gracefully (sections don't render when empty), but demo value is reduced.

4. **Confidence badge normalization** — Confidence values from the LLM (e.g., "high", "medium", "low") don't always match the expected ConfidenceBadge levels ("data-driven", "benchmark-based", "ai-suggested"). The badge falls through to the default styling when unmatched.

## Open Questions

None.

## Commit

`673adf0` — `feat: implement epic 15 — opportunities`

---

## Post-commit: Deploy E2E test + type fix (2026-04-05)

**Issue found:** Deploy button only showed for `type === "new_workflow"` but the LLM outputs types like `automate`, `new-automation`, `fix`, `optimize`, `enhance`. Same issue for the "View workflow" link checking `type === "technical_fix"`.

**Fix:** Broadened type checks in `opportunities-view.tsx` to match actual LLM output:
- Deploy button: `new_workflow` OR `new-automation` OR `automate`
- Workflow link: `technical_fix` OR `fix` OR `optimize` OR `enhance`

**Deploy E2E test result:**
1. Clicked "Automate lead scoring step" → slide-over opened with business case + Deploy button
2. Clicked Deploy → modal showed "Generating workflow scaffold..." with spinner
3. LLM generated "HubSpot Lead Scoring Automation" — 9-node workflow with scheduler trigger, HubSpot contact fetch, lead scoring function, HubSpot update, summary aggregation, Gmail notification, Slack error handler, webhook trigger
4. JSON preview displayed with Copy + "Deploy to n8n" buttons
5. Clicked "Deploy to n8n" → **400 error** from n8n API — the generated JSON structure doesn't perfectly match what the n8n version expects
6. Error state rendered correctly with message + "Try again" button

**Conclusion:** The full deploy flow infrastructure works end-to-end. The 400 is a prompt quality issue — the LLM scaffold needs tuning to match the exact n8n workflow import format. The Copy button provides a manual fallback (user can paste + adjust in n8n). Per spec: "Production-ready deployed workflows (scaffolds are sufficient)."

**Commit:** `b26b406` — `fix: broaden recommendation type checks for deploy/detail actions`

Screenshots: `epic-15-deploy-button.png`, `epic-15-deploy-generating.png`, `epic-15-deploy-preview.png`, `epic-15-deploy-result.png`

---

## Post-commit: Deploy fixes — prompt, sanitization, graceful activation (2026-04-05)

**Root causes of initial 400 errors:**
1. LLM prompt too vague — didn't specify exact n8n API format, so LLM included read-only fields (`active`, `meta`, `tags`)
2. No JSON sanitization — LLM output sent directly to n8n without stripping invalid fields
3. Activation treated as required — fails when workflow references unconfigured credentials

**Fixes:**
- Detailed LLM prompt with exact JSON structure + RULES (only `name`, `nodes`, `connections`, `settings`)
- Post-processing strips `active`, `id`, `meta`, `tags`, `createdAt`, `updatedAt`, `description`; ensures `settings` exists
- Activation is best-effort — workflow created even if activation fails; UI shows "Activation skipped — configure credentials in n8n first"
- n8n error responses now include response body for debugging

**E2E result:** "HubSpot Lead Scoring Automation" deployed to `perpaulsen.app.n8n.cloud/workflow/fqT8TnddQpyRW5zA` — workflow created successfully, activation skipped (credentials needed).

**Commit:** `784c7be` — `fix: deploy to n8n — improved prompt, sanitize JSON, graceful activation`

Screenshot: `epic-15-deploy-success-final.png`

---

## Post-commit: Deploy for technical fix recommendations (2026-04-06)

**Enhancement:** Deploy button now available for ALL recommendation types, not just new workflows.

For fix/optimize/enhance types with an existing workflow (`automationId` set):
- Fetches the existing workflow JSON from `Automation.rawWorkflowJson`
- LLM prompt switches to "improve existing" mode: receives the full workflow and applies the recommended change
- Deploys as a NEW workflow with "v2" suffix alongside the original — original stays untouched
- Button shows "Deploy improved version" + "View current workflow →" link

For new workflow types: behavior unchanged ("Deploy" button, creates from scratch).

**Commit:** `2f658d5` — `feat: deploy improved versions for technical fix recommendations`

---

## Post-commit: Slide-over → inline collapsible detail (2026-04-06)

**Problem:** The slide-over panel felt disconnected from the card list. User requested inline collapsible detail matching the Process Map pattern.

**Change:** Replaced the SlideOverPanel with inline expand/collapse on card click. Each recommendation card now expands below its header to show structured detail content:

- **Business Case** — full-width prose section
- **Evidence** — LLM's evidence chain reasoning
- **Honest Framing** — amber callout box (only for investigate/explore with uncertainty)
- **Implementation** — left column, specific technical guidance
- **Systems** — right column, system pills with arrow (e.g., "External system → HubSpot")
- **Impact** — bold monospace teal metric
- **Actions** — bottom-anchored: "Deploy" / "Deploy improved version" + "View current workflow →"

Chevron rotates on expand, card shadow elevates. Deep-link (`?highlight=`) now also auto-expands the highlighted card. Only one card expanded at a time.

**Commit:** `373fee2` — `style: replace slide-over with inline collapsible detail for recommendations`

---

## Post-commit: Duplicate process name fix (2026-04-06)

**Problem:** Every recommendation card showed the process name twice — "Lead Management · Lead Management" — because `affectedScope` and `processName` were identical values.

**Fix:** UI now suppresses `scope` when it equals `processName`, showing just "Lead Management" once. Applied to both the Opportunities page and the Dashboard's Top Opportunities cards.

**Commit:** `35cdf95` — `fix: deduplicate process name in recommendation cards`

---

## Post-commit: LLM pipeline robustness — tier, FK, process linking, scope (2026-04-06)

**Problems discovered during re-sync verification:**

1. **Wrong tier values:** LLM outputted `immediate`, `high`, `medium`, `low` instead of `act now`, `investigate`, `explore` — the prompt gave no guidance on valid values
2. **automationId FK crash:** LLM hallucinated automation IDs that don't exist → Prisma FK constraint violation crashed the entire analysis pipeline
3. **All detail fields null:** Previous recommendations were generated before the prompt included fields like `evidenceChain`, `honestFraming`, `implementationNotes`, `systemSource`, `systemDestination`
4. **processId always null:** Pipeline matched `affectedScope` to process names via exact match, but the LLM used different phrasing (e.g., "Lead Generation & Qualification process" vs "Lead Management")
5. **affectedScope = process name:** LLM defaulted to process name for scope, providing no differentiation

**Fixes applied:**

| Fix | File | What changed |
|-----|------|-------------|
| Tier constraint | `llm-pipeline.ts` | Prompt now specifies `"tier": "act now \| investigate \| explore"` |
| Tier normalization | `opportunities-data.ts` | Maps LLM variants: `immediate/critical/high` → `act-now`, `medium` → `investigate`, `low` → `explore` |
| Tier sorting | `analysis.ts` | `TIER_ORDER` expanded to handle all LLM tier variants |
| FK validation | `analysis.ts` | `automationId` validated against `validAutomationIds` Set before DB insert — invalid IDs silently dropped |
| Process linking | `analysis.ts` | Added partial match fallback (checks if process name is contained in scope or vice versa) + derivation from `automationId`'s process |
| Scope guidance | `llm-pipeline.ts` | Prompt now specifies: "for technical fixes: the specific workflow name. For new automations: the process name or '3 workflows affected'" |

**Verification (full re-sync with Fairtix):**

After re-sync, 12 recommendations generated with:
- Correct tiers: 5 ACT NOW, 4 INVESTIGATE, 3 EXPLORE
- `automationId` populated on 4 technical fix recommendations (validated against real IDs)
- `affectedScope` now specific: "HubSpot Lead Scoring Automation", "AI-Powered Lead Distribution System", "5 lead qualification workflows"
- All detail fields populated: businessCase, evidence, honestFraming, implementationNotes on all recs
- Systems populated where applicable (e.g., "External system → HubSpot")
- 3 ProcessSuggestions with child recommendations
- No FK violations, no pipeline crashes

**Expanded detail verified:** "Fix Lead Scoring Webhook Path Configuration" shows full structured detail:
- Business Case referencing specific workflow and webhook path
- Evidence citing specific node ID and configuration value
- Honest Framing amber callout
- Implementation notes with concrete fix instructions
- System pills (External system → HubSpot)
- "Deploy improved version" + "View current workflow →" actions

**Commit:** `dd121e6` — `fix: robust tier normalization, FK validation, process linking, scope guidance`

Screenshots: `epic-15-final-collapsed.png`, `epic-15-final-expanded-detail.png`

---

## All Epic 15 Commits

| Commit | Description |
|--------|-------------|
| `673adf0` | `feat: implement epic 15 — opportunities` — initial implementation |
| `b26b406` | `fix: broaden recommendation type checks for deploy/detail actions` |
| `784c7be` | `fix: deploy to n8n — improved prompt, sanitize JSON, graceful activation` |
| `2f658d5` | `feat: deploy improved versions for technical fix recommendations` |
| `373fee2` | `style: replace slide-over with inline collapsible detail for recommendations` |
| `35cdf95` | `fix: deduplicate process name in recommendation cards` |
| `dd121e6` | `fix: robust tier normalization, FK validation, process linking, scope guidance` |

---

## Related

- [Spec](15-opportunities.md)
- [Epic 11: LLM Pipeline V2](11-llm-pipeline-v2.md) (data source)
- [Epic 12: Design System](12-design-system.md) (components)
- [Epic 13: Dashboard](13-dashboard.md) (UnifiedCard pattern)
- [Epic 14: Process Map](14-process-map.md) (gap card links)
