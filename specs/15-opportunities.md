---
tags:
  - type/spec
  - status/draft
  - phase/3
---

# Epic 15 — Opportunities

> Upstream: [PRD 2.0](../prd-2.0.md) | [Decisions §5, §9, Amendment P](../prd-2.0-decisions.md) | [Brainstorming](brainstorming.md)
> Phase: 3 (after Epics 11 + 12, parallel with 13/14/16)
> Dependencies: Epic 11 (LLM data), Epic 12 (design system + route shell)

## Scope

All recommendations ranked by business impact, answering "What should I do?" Includes the deploy feature — from recommendation to running workflow in one click.

**Recommendation rows grouped by tier:**
- Three tier sections with section headers: "ACT NOW" (green accent), "INVESTIGATE" (amber accent), "EXPLORE" (gray accent)
- Within each tier, rows sorted by Recommendation.priorityOrder
- Row columns: TierBadge (on first row of section only), title, business case (one line), ConfidenceBadge, affected scope, impactEstimate badge, action button
- Action button varies by type: "Deploy" (new_workflow), "→" arrow to Detail (technical_fix), text only (platform_connection)
- Visual weight decreases with tier: Act Now has solid left border, Investigate has dashed left border, Explore has no left border

**Slide-over panel (on row click):**
- SlideOverPanel component opens from right
- Content: full business case (reasoning), evidence chain (bulleted list citing sources), key assumptions, honest framing (for investigate/explore — amber callout box), implementation notes, systems involved (SystemFlow), deploy button (if applicable)
- Close on Escape, click-outside, or X button

**Process suggestion sections:**
- ProcessSuggestion records rendered as collapsible sections
- Header: process name + description + "X recommendations" count
- Expanded: child recommendation rows (linked via processSuggestionId)
- Positioned after the three tier sections

**Deploy modal (for new_workflow recommendations):**
- Triggered by "Deploy" button (on row or in slide-over)
- Step 1: Generate — triggers on-demand LLM call to produce n8n workflow JSON
  - LLM receives: recommendation details (name, businessCase, implementationNotes, affectedScope) + related workflow JSONs (existing workflows in the same process) + system information (credentials from sync, connected systems)
  - Shows loading state: "Generating workflow scaffold..."
  - On success: shows JSON preview
  - On failure: error message + "Try again" button
- Step 2: Review — JSON preview with syntax highlighting, copy-to-clipboard button
- Step 3: Deploy — "Deploy to n8n" button → calls `POST /workflows` (from Epic 10 n8n client) + `POST /workflows/{id}/activate`
  - On success: confirmation message with link to workflow in n8n
  - On failure: error message, JSON still available for manual copy
- Generated JSON cached on Recommendation.deployableJson (so re-opening the modal doesn't regenerate)

**Deep-linking:**
- URL parameter: `/opportunities?highlight={recommendationId}`
- On load: scroll to the referenced recommendation and briefly highlight it (2s accent background pulse)
- Used by: Dashboard "Top Opportunities" links, Process Map gap indicator links

**Filtering:**
- URL parameter: `/opportunities?process={processId}`
- Filters to show only recommendations linked to the specified process
- Used by: Process Map gap indicator links
- Clear filter button to show all

## Acceptance Criteria

### Tier Sections
1. Three sections rendered: Act Now, Investigate, Explore — each with styled section header
2. Recommendations sorted by priorityOrder within each tier
3. Left border accent: solid green (Act Now), dashed amber (Investigate), none (Explore)
4. Empty tiers hidden (if no Act Now recommendations, that section doesn't render)

### Recommendation Rows
5. Each row shows: name, brief (one-liner from Recommendation.brief — not the full businessCase, which is shown in the slide-over panel), ConfidenceBadge (solid/dashed/outline), affectedScope, impactEstimate badge, action button
6. Action button: "Deploy ▶" for new_workflow, "→" link for technical_fix, none for platform_connection
7. Click on row (not action button) opens slide-over panel

### Slide-Over Panel
8. Renders: full businessCase, evidenceChain (bulleted), key assumptions (from Recommendation.evidence Json), honest framing (amber callout if non-null), implementationNotes, systems (SystemFlow from systemSource/systemDestination)
9. Deploy button in panel for new_workflow recommendations
10. Technical fix panel includes link to affected workflow Detail page
11. Close on Escape, click-outside, X button

### Process Suggestions
12. ProcessSuggestion sections rendered after tier sections
13. Each collapsible: header with name + description + child count
14. Expanded shows child recommendation rows (same row format as tier sections)

### Deploy Modal
15. "Deploy" button opens modal
16. Modal triggers LLM call to generate n8n JSON (if Recommendation.deployableJson is null)
17. Loading state shown during generation
18. JSON preview with syntax highlighting (monospace, dark theme)
19. Copy button copies JSON to clipboard
20. "Deploy to n8n" button calls deployWorkflow + activateWorkflow from n8n client
21. Success: confirmation message with "Open in n8n" link (constructed from instance URL + workflow ID)
22. Failure: error message + retry button, JSON still copyable
23. Generated JSON cached on Recommendation.deployableJson (subsequent opens skip generation)
24. LLM call receives: recommendation record + related workflow JSONs + credential/system info

### Deploy LLM Call
25. Separate prompt from analysis pipeline: focused on generating valid n8n workflow JSON
26. Retry with backoff (3 attempts) on failure
27. JSON fence stripping applied
28. Response validated as parseable JSON before storing

### Deep-linking
29. `/opportunities?highlight={id}` scrolls to and highlights the referenced recommendation (brief accent pulse)
30. Works for recommendations in any tier section

### Filtering
31. `/opportunities?process={processId}` filters to recommendations linked to that process
32. Clear filter button returns to full list
33. Filter + highlight can combine: `/opportunities?process={pid}&highlight={rid}`

### Tests
34. Render test: three tier sections with correct styling and sorted recommendations
35. Render test: slide-over opens with full recommendation detail
36. Render test: process suggestion sections with child recommendations
37. Render test: deploy modal loading → preview → success states
38. Navigation test: deep-link scrolls to correct recommendation
39. Navigation test: process filter shows only relevant recommendations
40. Unit test: deploy LLM prompt construction (correct context assembled)

## Out of Scope

- Editing recommendations (LLM-generated, read-only)
- Dismissing/hiding recommendations
- Sorting controls (sorted by impact via priorityOrder)
- Full filter system beyond process filter (search only in future)
- Production-ready deployed workflows (scaffolds are sufficient — per decisions §5)
- Workflow node visualization in deploy preview

## Domain Terms

| Term | Definition |
|------|-----------|
| **Opportunity** | A recommendation — something to build, fix, or connect. Ranked by business impact. |
| **Tier** | Urgency level: Act Now (high impact + confident), Investigate (high impact + can't fully verify), Explore (lower urgency or needs expansion). |
| **Honest framing** | Transparent acknowledgment of uncertainty for Investigate/Explore recommendations. Three frames: clearly automation domain, may be elsewhere, connect for visibility. |
| **Deploy modal** | End-to-end flow: LLM generates n8n JSON scaffold → user reviews → POST to n8n API → activate. The "one-click deployment" differentiator. |
| **Impact estimate badge** | Condensed value indicator on the recommendation row (e.g., "~€2K/cycle", "~15 hrs/month", "Strategic"). Enables scan-level value assessment. |
| **Process suggestion** | Entirely new recommended process (e.g., "Payment & Billing") that doesn't exist yet. Container for child recommendations. |

## Open Questions

1. Should the deploy LLM call use the same model as the analysis pipeline (Sonnet default), or always use a specific model optimized for code generation? (Recommendation: same model via OPENROUTER_MODEL — keep it simple, Sonnet generates adequate n8n JSON.)
2. Should the "Deploy to n8n" button also trigger a re-sync after deployment, so the new workflow appears in the analysis? (Recommendation: no — show a message "Re-sync to see this workflow in your analysis" with a link to Settings. Automatic re-sync after deploy is a future enhancement.)

---

## Related

- [Epic 11: LLM Pipeline V2](11-llm-pipeline-v2.md) (data source: Recommendation, ProcessSuggestion)
- [Epic 10: Schema + Extended Sync](10-schema-sync.md) (deploy endpoint: n8n client)
- [Epic 12: Design System](12-design-system.md) (components: SlideOverPanel, ConfidenceBadge, TierBadge)
- [Epic 14: Process Map](14-process-map.md) (gap indicators link to this page)
- [Decisions §5: Priorities](../prd-2.0-decisions.md) | [Amendment P: Deploy](../prd-2.0-decisions.md)
