---
tags:
  - type/spec
  - status/draft
  - phase/3
---

# Epic 13 — Dashboard

> Upstream: [PRD 2.0](../prd-2.0.md) | [Decisions §3](../prd-2.0-decisions.md) | [Brainstorming](brainstorming.md)
> Phase: 3 (after Epics 11 + 12)
> Dependencies: Epic 11 (LLM data), Epic 12 (design system + route shell)

## Scope

Executive summary page answering "What needs my attention?" Following the McKinsey pyramid: answer first, evidence second.

**Sections (top to bottom):**

1. **Delta Banner** — Only on re-sync (CompanyProfile.deltaSummary is non-null). Compact 1-2 lines, accent-left border, dismissible (session-only X button). Position: top of page, below title, above Your Next Move.

2. **Your Next Move** — AI-generated banner from CompanyProfile.nextMoveText. Accent-left border. Narrative paragraph referencing workflow names and chaining actions. Links to Opportunities page. CompanyProfile.nextMoveReasoning available but not shown (used for transparency if needed).

3. **Facts Bar** — Single row of FactCard components:
   - Workflow count (from Automation where !isRemoved)
   - Process count (from BusinessProcess)
   - System count (from CompanyProfile.systemLandscape length)
   - Active count (from Automation where isActive && !isRemoved)
   - Recommendation count (from Recommendation)
   - Aggregate estimates secondary: "est. ~X hrs/wk saved" and "~€X/mo at risk" from CompanyProfile.aggregateEstimates, with "(methodology →)" expandable or link

4. **Two-column section:**
   - Left: **Attention** — Automations with governance dot = critical or attention. Each row: StatusDot + name + brief. Click → `/automations/[id]`. Cap at 5, "View all on Process Map" link.
   - Right: **Top Opportunities** — Top 3 recommendations by priorityOrder. Each row: TierBadge + title + business case one-liner + impactEstimate badge. Click → `/opportunities?highlight={id}`.

5. **Process Coverage** — Table: process name, existing workflow count / total step count, CoverageBar, reliability % (monospace), recommendation count. Rows sorted by BusinessProcess.order. Click → `/processes`.

6. **Systems Compact** — Single row: system names from CompanyProfile.systemLandscape with workflow count badges. Compact, not full narratives.

**Empty state:** When no CompanyProfile exists (no sync yet). Centered message: "Connect your n8n instance in Settings to get started." CTA button → `/settings`.

**Analyzing state:** When CompanyProfile.analysisStatus is not "complete". Skeleton layout with "Analyzing your automation landscape..." message. Not a spinner — a contextual message.

## Acceptance Criteria

### Data Loading
1. Page is a server component using `getRequiredSession()` to get workspaceId
2. Queries: CompanyProfile, Automation (with governance dot), BusinessProcess, Recommendation (top 3) for the workspace
3. Empty state rendered when CompanyProfile is null
4. Analyzing state rendered when CompanyProfile.analysisStatus !== "complete"

### Delta Banner
5. Rendered only when deltaSummary is non-null
6. Compact: 1-2 lines of text, accent-left border
7. Dismissible via X button (client-side state, session-only — reappears on page reload is acceptable for MVP)

### Your Next Move
8. Renders CompanyProfile.nextMoveText as a narrative paragraph
9. Accent-left border, section header "YOUR NEXT MOVE" (11px uppercase)
10. Contains a link/button to the Opportunities page

### Facts Bar
11. Renders 5+ metrics in a single row using FactCard components
12. All numbers in monospace font
13. Aggregate estimates shown secondary with "(methodology →)" text (expandable or tooltip acceptable for MVP)

### Attention + Opportunities
14. Attention section: lists up to 5 automations with critical/attention governance dot, each with StatusDot + name + businessBrief
15. Click on attention item navigates to `/automations/[id]`
16. Top Opportunities section: lists top 3 recommendations by priorityOrder
17. Each opportunity shows TierBadge + name + businessCase + impactEstimate
18. Click on opportunity navigates to `/opportunities?highlight={recommendationId}`

### Process Coverage
19. Table with columns: process name, coverage ratio (e.g., "3 of 5"), CoverageBar, reliability %, recommendation count
20. Rows sorted by BusinessProcess.order
21. Click on process row navigates to `/processes`

### Systems Compact
22. Single row displaying system names with workflow count (e.g., "Gmail (8)" "Google Sheets (6)")
23. Data from CompanyProfile.systemLandscape

### Tests
24. Render test: empty state when no CompanyProfile
25. Render test: analyzing state when analysisStatus !== "complete"
26. Render test: full dashboard with mock data (all sections populated)
27. Navigation test: attention item click → correct detail URL
28. Navigation test: opportunity click → correct opportunities URL with highlight param

## Out of Scope

- Sync trigger from Dashboard (sync is on Settings page)
- Editable content on Dashboard
- Real-time updates / polling for analysis status changes (page reload to see updates)
- Mobile layout
- Full methodology explanation page (MVP: expandable text or tooltip)

## Domain Terms

| Term | Definition |
|------|-----------|
| **McKinsey pyramid** | Answer first (Your Next Move), evidence second (Facts, Attention, Opportunities, Coverage). The user gets the "so what" before the supporting data. |
| **Delta banner** | Summary of changes since last analysis. Only appears on re-sync. Demonstrates the Expliq product loop: sync → analyze → act → re-sync → see what changed. |
| **Facts bar** | Single-row metric display: counts are primary (monospace), estimates are secondary with methodology attribution. |
| **Governance dot** | StatusDot derived from risk engine (Epic 11). On this page, used to identify which automations need attention. |

## Open Questions

1. Should the "methodology" link on aggregate estimates expand inline (accordion) or link to a separate section/page? (Recommendation: inline accordion for MVP — keeps the user on the Dashboard.)

---

## Related

- [Epic 11: LLM Pipeline V2](11-llm-pipeline-v2.md) (data source)
- [Epic 12: Design System](12-design-system.md) (components)
- [Decisions §3: Dashboard](../prd-2.0-decisions.md)
