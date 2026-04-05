---
tags:
  - type/spec
  - status/draft
  - phase/3
---

# Epic 14 — Process Map

> Upstream: [PRD 2.0](../prd-2.0.md) | [Decisions §4](../prd-2.0-decisions.md) | [Brainstorming](brainstorming.md)
> Phase: 3 (after Epics 11 + 12, parallel with 13/15/16)
> Dependencies: Epic 11 (LLM data), Epic 12 (design system + route shell), Epic 13 (dashboard-data.ts utilities)

## Scope

Process-centric view answering "What do I have?" Primary entity is the business process, not the workflow. Workflows are evidence inside processes.

**Process accordion (CollapsibleRow with ProcessCard-style header):**
- **CollapsibleRow** (from Epic 12) per BusinessProcess — accordion pattern
- Header renders ProcessCard-style content: name, maturity badge, coverage bar, coverage %, reliability %, at-risk value (valueAtStake), recommendation count. Same visual style as Dashboard ProcessCards.
- Sorted by BusinessProcess.order
- Chevron to expand/collapse with smooth animation

**Expanded process — workflow cards (children of CollapsibleRow):**
- **UnifiedCard (type=attention)** per Automation linked to this process (via processId) — same card component as Dashboard attention items
- Each card shows: severity dot (governance), name, businessNarrative (description, line-clamp-2), metric (error rate or "Inactive"), scope (step position), process name
- Single-column layout, cards stacked vertically below the process header (not nested inside a card)
- Click → `/automations/[id]`

**Expanded process — gap cards:**
- Visible only when "Show gaps" toggle is ON
- Gaps are process steps where `isGap: true` in the BusinessProcess.steps Json
- Displayed as dashed-border cards between workflow cards (or at the end), showing: step name + "Gap" label + recommendation count + "View opportunities →" link
- Gap card click → `/opportunities?process={processId}`

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

### Process Cards
1. One **ProcessCard** per BusinessProcess (same component as Dashboard process coverage grid), sorted by `order`
2. Each ProcessCard displays: name, maturityLevel badge (Prototype/Emerging/Developing/Production/Optimized), coverage bar (h-3, teal fill), coverage % (large mono), reliability % (mono), at-risk value (valueAtStake, amber mono), recommendation count (teal mono). ProcessCard component is reused from Epic 13 — no new component needed.
3. Expand/collapse chevron on ProcessCard — click to expand with smooth animation

### Workflow Cards
4. Inside expanded process: one **UnifiedCard (type=attention)** per Automation where processId matches — same card component as Dashboard attention items
5. Each workflow card: severity dot (governance), name, businessNarrative (line-clamp-2), metric (error rate from `formatAttentionMetric()` or "Inactive"), scope (step position from `resolveStepScope()`), process name
6. Click on workflow card navigates to `/automations/[id]`
7. Cards displayed in single-column layout, stacked vertically with space-y-4 gap

### Gap Cards
8. Gaps derived from BusinessProcess.steps Json entries where `isGap` is true. The steps Json is an array of objects with at minimum `{ name: string, isGap: boolean }` — the LLM workspace call populates this structure.
9. Gap cards only visible when "Show gaps" toggle is ON
10. Gap card shows: dashed border, step name + "Gap" label + recommendation count for this process + "View opportunities →" link
11. Gap card click navigates to `/opportunities?process={processId}`

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
19. Queries: BusinessProcess (with order, valueAtStake, maturityLevel), Automation (with processId, governance fields, errorRate, stepName), Recommendation count per process
19a. Per-process reliability and coverage computed on-read. Reuse `buildProcessCoverage()` and `formatAttentionMetric()` from `src/lib/dashboard-data.ts` (Epic 13) to avoid duplicating computation logic already used by the Dashboard.
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

1. ~~Resolved: "Value at stake" shown on the ProcessCard (collapsed view) — it's a key scanning metric that helps prioritize. ProcessCard already includes valueAtStake from Epic 13 card-layout patch.~~

---

## Related

- [Epic 11: LLM Pipeline V2](11-llm-pipeline-v2.md) (data source: BusinessProcess, Automation)
- [Epic 12: Design System](12-design-system.md) (components: CollapsibleRow, StatusDot, CoverageBar, etc.)
- [Epic 13: Dashboard](13-dashboard.md) (reusable utilities: `dashboard-data.ts` — buildProcessCoverage, formatAttentionMetric, resolveStepScope)
- [Epic 15: Opportunities](15-opportunities.md) (gap indicators link here)
- [Decisions §4: Process Map](../prd-2.0-decisions.md)
