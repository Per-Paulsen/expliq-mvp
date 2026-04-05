---
tags:
  - type/spec
  - status/draft
  - phase/3
---

# Epic 16 — Detail

> Upstream: [PRD 2.0](../prd-2.0.md) | [Decisions §6](../prd-2.0-decisions.md) | [Brainstorming](brainstorming.md)
> Phase: 3 (after Epics 11 + 12, parallel with 13/14/15)
> Dependencies: Epic 11 (LLM data), Epic 12 (design system + route shell), Epic 13 (dashboard-data.ts utilities for step scope, metric formatting)

## Scope

Per-automation deep dive answering "Tell me everything about this one." Existing route `/automations/[id]` — complete page rewrite with business-first content.

**Header:**
- Automation name (from n8n — the `name` field synced from the workflow)
- StatusDot + status label (e.g., "Critical — 31% error rate" or "Healthy — active, monitored")
- Platform badge ("n8n")
- SystemFlow (source → destination systems)
- Process step label (stepName + process name, clickable → `/processes`)

**Business Narrative:**
- Full businessNarrative text (3-5 sentences from LLM per-automation output)
- Body text style (15px minimum per design guidelines, text-secondary, regular weight)

**Business Case Card:**
- Three-column layout:
  - **Failure Impact**: impact.failureScenario — cascading consequences in plain language
  - **Time Savings**: timeSavingsEstimate — range with reasoning and confidence label
  - **Revenue Connection**: impact.revenueConnection + revenueImpactEstimate — revenue impact with reasoning and confidence label
- Each column has a section header + body text. Confidence labels shown as ConfidenceBadge inline.

**Recommendations for This Workflow:**
- List of Recommendation records that reference this automation (via processId matching this automation's process, or direct scope reference)
- Each row: TierBadge + name + brief (one-liner from Recommendation.brief) + impactEstimate badge
- Displayed in-page (no navigation needed to see recommendations)
- Click → `/opportunities?highlight={recommendationId}` (opens on Opportunities page)

**Process Position:**
- Shows which step in which process this automation handles
- Visual: process name + ordered step list with the current automation's step highlighted
- Clickable process name → `/processes` (scrolled to process)

**Connected Automations:**
- Two sections: "Upstream" (feeds this) and "Downstream" (this feeds)
- From Automation.upstreamIds and downstreamIds, resolved to Automation records
- Each row: name + connection type label (error handler / sub-workflow / logical) + brief
- Click → `/automations/[id]` of the connected automation

**"How We Know This" — Expandable Evidence:**
- Collapsed by default with a disclosure triangle
- Content:
  - **Execution Stats**: runsPerWeek, errorRate %, lastExecutedAt, avgDurationMs — all monospace
  - **Error Handling**: technicalEvidence.errorHandling (retry settings, error workflow link, what's missing)
  - **Credentials**: technicalEvidence.credentials (system dependencies)
  - **Detectability**: detectability.reasoning + detectability.level + detectability.evidence
  - **Key Technical Findings**: technicalEvidence.keyFindings (bulleted list of observations with business implications)
  - **Complexity**: technicalEvidence.complexity (node count, branching patterns)
- This section builds trust by showing the deductive reasoning chain — how Expliq derived its business conclusions from the workflow's technical configuration

**Back navigation:** "← Back to Process Map" link at top

## Acceptance Criteria

### Header
1. Renders automation name (from n8n `name` field), StatusDot with governance level, status label describing the dot reason
2. Platform badge shows "n8n"
3. SystemFlow renders systems from Automation.systemsTouched
4. Step label shows stepName + process name (from BusinessProcess via processId), clickable

### Business Narrative
5. Renders full businessNarrative as body text (multiple sentences/paragraphs)
6. No truncation — full narrative visible

### Business Case Card
7. Three-column layout: Failure Impact, Time Savings, Revenue Connection
8. Failure Impact shows impact.failureScenario text
9. Time Savings shows timeSavingsEstimate with ConfidenceBadge
10. Revenue Connection shows impact.revenueConnection + revenueImpactEstimate with ConfidenceBadge
11. "N/A" displayed gracefully when a field is not applicable

### Recommendations
12. Lists recommendations linked to this automation's process (Recommendation where processId = automation's processId)
13. Each row: TierBadge + name + brief (from Recommendation.brief, not businessCase) + impactEstimate
14. Click navigates to `/opportunities?highlight={id}`
15. "No recommendations" message if none exist

### Process Position
16. Shows process name + step list with current step highlighted
17. Process name clickable → `/processes`

### Connected Automations
18. Upstream section: lists automations from upstreamIds, resolved to name + brief
19. Downstream section: lists automations from downstreamIds, resolved to name + brief
20. Each clickable → `/automations/[id]`
21. Connection type label shown (error handler / sub-workflow / logical)
22. Sections hidden if no connections exist

### Evidence Section
23. Collapsed by default, expandable on click
24. Execution stats rendered in monospace (runsPerWeek, errorRate, lastExecutedAt, avgDurationMs — all stored on Automation model)
25. Error handling details from technicalEvidence.errorHandling
26. Credentials listed from technicalEvidence.credentials
27. Detectability reasoning + level + evidence displayed
28. Key findings rendered as bulleted list
29. All data from Automation model fields — no additional API calls

### Navigation
30. "← Back to Process Map" link at top navigates to `/processes`
31. Async params: `await params` for `[id]` route parameter (Next.js 15+)

### Tests
32. Render test: full detail page with all sections populated
33. Render test: sections hidden when data is null/empty (no connections, no recommendations)
34. Render test: evidence section collapsed by default, expands on click
35. Navigation test: step label click → process map
36. Navigation test: connected automation click → other detail page
37. Navigation test: recommendation click → opportunities with highlight

## Out of Scope

- Editing any fields (all LLM-generated, read-only)
- Recommendation detail (slide-over is on Opportunities page)
- Workflow node visualization / flow diagram
- "Open in n8n" link (could be added as a small enhancement — constructable from instance URL + externalId — but not spec'd)
- Version history / change tracking

## Domain Terms

| Term | Definition |
|------|-----------|
| **Business narrative** | LLM-generated 3-5 sentence description of what a workflow means for the business. The text that differentiates Expliq from reading n8n's workflow editor. |
| **Business case card** | Three-column display: failure impact, time savings, revenue connection. Each with reasoning, not just numbers. The McKinsey "per-item deep dive." |
| **"How We Know This"** | Evidence section showing the raw data and deductive reasoning behind the analysis. Renamed from "Technical Details" to emphasize trust-building over technical documentation. |
| **Connected automations** | Upstream (feeds this workflow) and downstream (this workflow feeds). From errorWorkflow links, callerIds, and LLM-identified logical connections. |

## Open Questions

1. Should we include an "Open in n8n" link in the header? It's trivially constructable (`{instanceUrl}/workflow/{externalId}`) and high-value. (Recommendation: yes, include it — low effort, immediate user value for cross-referencing.)
2. ~~Resolved: Connection type labels derived heuristically. The Detail page checks `rawWorkflowJson`: if a connected ID matches `settings.errorWorkflow` → "error handler", if matched via `settings.callerIds` → "sub-workflow", otherwise → "logical." No schema change needed.~~

---

## Related

- [Epic 11: LLM Pipeline V2](11-llm-pipeline-v2.md) (data source: Automation enriched fields)
- [Epic 12: Design System](12-design-system.md) (components: StatusDot, SystemFlow, ConfidenceBadge, ImpactBadge, TierBadge)
- [Epic 13: Dashboard](13-dashboard.md) (reusable utilities: resolveStepScope, formatAttentionMetric from dashboard-data.ts)
- [Epic 15: Opportunities](15-opportunities.md) (recommendation links)
- [Epic 14: Process Map](14-process-map.md) (back navigation, process position link)
- [Decisions §6: Detail](../prd-2.0-decisions.md)
