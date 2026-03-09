# 08 — Workspace Snapshot

## Scope

Build the Workspace Snapshot dashboard (`/`) — the landing page that gives Emma an executive summary of automation health across her workspace. This screen is designed freely (no prototype screenshot exists) in the spirit of the Portfolio and Detail screens: clean, data-dense, operational dashboard aesthetic.

### Layout (proposed)

- **Top metrics row**: 5 summary cards
  - Total automations (count)
  - High-impact automations (count where effective impact = Critical or High; effective impact = `impactOverride ?? impactProposal`)
  - High-risk automations (count where risk level = High)
  - Missing owners (count where owner is null)
  - Overdue reviews (count where overdue review signal is active)

- **System exposure ranking**: ranked list/bar chart of systems sorted by exposure score (highest first). Each row shows system name, exposure score, automation count, and a visual bar. Clicking a system navigates to Portfolio filtered by that system.

- **Owner exposure ranking**: ranked list of owners sorted by exposure score. Each row shows owner name, exposure score, automation count, and a visual bar. Clicking an owner navigates to Portfolio filtered by that owner.

- **Structural indicators section**: two subsections
  - **Recently changed**: automations updated in the last 7 days (showing name, last updated date, change indicator)
  - **Multi-system automations**: automations touching 3+ systems (showing name, system count, systems list) — these represent higher blast radius if they fail

All sections link through to the Portfolio with appropriate filters applied.

### Data Source

All data is derived from existing Automation records and the risk engine (epic 05). No new data fetching or storage is needed — this screen is a read-only aggregation view.

## Acceptance criteria

- [ ] Top metrics cards display: total automations, high-impact count, high-risk count, missing owners count, overdue reviews count
- [ ] System exposure ranking shows systems sorted by weighted exposure score with a visual bar indicating relative exposure
- [ ] Owner exposure ranking shows owners sorted by weighted exposure score with a visual bar indicating relative exposure
- [ ] Recently changed section lists automations updated in the last 7 days
- [ ] Multi-system section lists automations touching 3+ systems
- [ ] Clicking a system in the exposure ranking navigates to Portfolio filtered by that system
- [ ] Clicking an owner in the exposure ranking navigates to Portfolio filtered by that owner
- [ ] When no automations exist in the workspace, the dashboard shows a guided empty state with a message and a call-to-action linking to the settings page to connect n8n
- [ ] Dashboard data refreshes on page load (no caching needed for MVP)
- [ ] Automations with `status = removed` are excluded from all metrics (regardless of `statusOverride`). All other metrics use effective status (`statusOverride ?? status`).

## Out of scope

- Customizable dashboard layout, widgets, or drag-and-drop
- Time-range selectors or historical comparison ("last week vs this week")
- Export, PDF generation, or reporting
- Real-time auto-refresh or WebSocket updates
- Charts beyond simple bar indicators
- Drill-down views beyond navigating to the Portfolio

## Domain terms

| Term | Definition |
|------|-----------|
| **Workspace Snapshot** | The executive summary dashboard showing aggregate health metrics for all automations in the workspace |
| **System exposure ranking** | A sorted list of external systems ordered by their aggregate exposure score across all automations |
| **Owner exposure ranking** | A sorted list of automation owners ordered by their aggregate exposure score |
| **Structural indicator** | A signal based on the automation's structure (recently changed, multi-system) rather than governance gaps |
| **Multi-system automation** | An automation that touches 3 or more external systems, indicating higher blast radius |

## Open questions

- Should the "Recently changed" threshold (7 days) match the "Automation stale" threshold (14 days), or is it intentionally a shorter window to surface recent activity? (Proposed: keep 7 days — it's about surfacing recent activity, not staleness)
- Should metrics cards be clickable (navigating to a filtered Portfolio view), or is the click-through only on exposure rankings? (Recommended: make metrics cards clickable too for consistency)
- ~~Resolved: When no automations are synced, the dashboard shows a guided empty state with a call-to-action linking to settings.~~
