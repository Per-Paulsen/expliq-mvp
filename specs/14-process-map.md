---
tags:
  - type/spec
  - status/draft
  - phase/3
---

# Epic 14 — Process Map

> Upstream: [PRD 2.0](../prd-2.0.md) | [Decisions §4](../prd-2.0-decisions.md) | [Brainstorming](brainstorming.md)
> Phase: 3 (after Epics 11 + 12, parallel with 13/15/16)
> Dependencies: Epic 11 (LLM data), Epic 12 (design system + route shell)

## Scope

Process-centric view answering "What do I have?" Primary entity is the business process, not the workflow. Workflows are evidence inside processes.

**Process rows (collapsed — top level):**
- CollapsibleRow component per BusinessProcess
- Columns: process name, summary (one line, truncated), maturityLevel badge, coverage bar, reliability % (monospace), recommendation count (value at stake placement TBD — see open question 1)
- Sorted by BusinessProcess.order
- Click chevron to expand

**Expanded process — workflow rows:**
- Table rows inside expanded process, one per Automation linked to this process (via processId)
- Columns: StatusDot (governance), name + stepName label, businessNarrative (truncated), SystemFlow, ImpactBadge
- Click → `/automations/[id]`
- Rows use subtle border-bottom (#262626), no card chrome

**Expanded process — gap indicators:**
- Visible only when "Show gaps" toggle is ON
- Gaps are process steps where `isGap: true` in the BusinessProcess.steps Json
- Displayed as dashed-border rows between workflow rows (or at the end), showing: step name + "Gap" label + recommendation count for this gap
- Gap indicator click → `/opportunities?process={processId}`

**Show-gaps toggle:**
- Toggle control at the top of the page
- When ON: gap indicators visible in all expanded processes
- When OFF: only existing workflow rows shown
- Client-side state (no persistence needed)

**Search bar:**
- Client-side filter at the top of the page
- Filters processes by name AND workflows by name (case-insensitive contains)
- A process is shown if its name matches OR any of its workflows match
- Instant filter (no debounce needed for <50 processes)

**Empty state:** When no BusinessProcess records exist. Message: "No processes discovered yet. Sync your n8n instance to get started." CTA → `/settings`.

## Acceptance Criteria

### Process Rows
1. One CollapsibleRow per BusinessProcess, sorted by `order`
2. Each row displays: name, summary (truncated to one line), maturityLevel badge (from BusinessProcess.maturityLevel — level names match the LLM output schema, e.g., Prototype/Emerging/Developing/Production/Optimized), CoverageBar (computed: automations.length / (automations.length + recommendations.length)), reliability % (computed on-read per AC 19a, monospace), recommendation count
3. Expand/collapse on chevron click with smooth animation

### Workflow Rows
4. Inside expanded process: one row per Automation where processId matches
5. Each workflow row: StatusDot + name + stepName label + businessNarrative (truncated) + SystemFlow + ImpactBadge
6. Click on workflow row navigates to `/automations/[id]`
7. Rows aligned in columns, subtle border-bottom between rows

### Gap Indicators
8. Gaps derived from BusinessProcess.steps Json entries where `isGap` is true. The steps Json is an array of objects with at minimum `{ name: string, isGap: boolean }` — the LLM workspace call populates this structure.
9. Gap indicators only visible when "Show gaps" toggle is ON
10. Gap row shows: step name + "Gap" indicator + recommendation count for this process
11. Gap click navigates to `/opportunities?process={processId}`

### Toggle
12. "Show gaps" toggle at page top, defaults to OFF
13. Toggling ON/OFF immediately shows/hides gap indicators (client-side, no reload)

### Search
14. Search input at page top
15. Filters processes by name (case-insensitive contains)
16. Also filters by workflow name — a process with no name match but a matching workflow still shows (expanded to show the match)
17. Empty search shows all processes

### Data Loading
18. Server component with `getRequiredSession()` for workspaceId
19. Queries: BusinessProcess (with order, valueAtStake), Automation (with processId, governance fields, errorRate), Recommendation count per process
19a. Per-process reliability computed on-read: average `(1 - errorRate)` across automations in the process where errorRate is non-null. Processes with no execution data show "—" instead of a percentage.
20. Empty state when no BusinessProcess records exist

### Tests
21. Render test: processes display in correct order with all columns
22. Render test: expand process shows workflow rows
23. Render test: show-gaps toggle shows/hides gap indicators
24. Filter test: search by process name filters correctly
25. Filter test: search by workflow name shows parent process
26. Navigation test: workflow click → correct detail URL
27. Navigation test: gap click → correct opportunities URL with process filter

## Out of Scope

- Process flow visualization (step 1 → step 2 → step 3 diagram) — show steps as rows, not a visual flow
- Editable process names or workflow assignments
- Server-side search / pagination (client-side sufficient for <50 processes)
- Suggested processes display (shown on Opportunities page as ProcessSuggestion sections)
- Sort controls (sorted by order field from LLM)

## Domain Terms

| Term | Definition |
|------|-----------|
| **Business process** | End-to-end business flow grouping related automations (e.g., "Ticket Lottery Lifecycle"). Discovered by the LLM workspace call. |
| **Coverage** | Ratio of automated steps to total steps in a process. Higher = more complete automation. |
| **Maturity** | Composite assessment: Prototype → Emerging → Developing → Production → Optimized. Based on coverage, reliability, error handling quality, monitoring presence. |
| **Gap** | A process step that has no automation handling it. Identified by the LLM. Links to recommendations on the Opportunities page. |
| **Show gaps toggle** | Contextual overlay revealing where recommendations exist in each process. Not the primary recommendation experience (that's Opportunities). |

## Open Questions

1. Should the "value at stake" per process be shown on the collapsed process row, or only visible when expanded? (Recommendation: on the collapsed row — it's a key scanning metric that helps the user prioritize which process to explore.)

---

## Related

- [Epic 11: LLM Pipeline V2](11-llm-pipeline-v2.md) (data source: BusinessProcess, Automation)
- [Epic 12: Design System](12-design-system.md) (components: CollapsibleRow, StatusDot, CoverageBar, etc.)
- [Epic 15: Opportunities](15-opportunities.md) (gap indicators link here)
- [Decisions §4: Process Map](../prd-2.0-decisions.md)
