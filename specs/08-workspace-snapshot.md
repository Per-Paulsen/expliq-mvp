---
tags:
  - type/spec
  - status/done
  - epic/08
---

# 08 — Workspace Snapshot

> Upstream: [PRD](../expliq_prd.md) | Previous: [07 — Automation Detail](07-automation-detail.md)

## Scope

Build the Workspace Snapshot dashboard (`/`) — the landing page that gives Emma an executive summary of automation health across her workspace. This screen is designed freely (no prototype screenshot exists) in the spirit of the Portfolio and Detail screens: clean, data-dense, operational dashboard aesthetic.

### Layout (proposed)

- **Top metrics row**: 5 summary cards
  - Total automations (count)
  - High-impact automations (count where effective impact = Critical or High; effective impact = `impactOverride ?? impactProposal`; automations with null effective impact are not counted as high-impact)
  - High-risk automations (count where risk level = High)
  - Missing owners (count where owner is null)
  - Overdue reviews (count where overdue review signal is active)

- **System exposure ranking**: ranked list/bar chart of systems sorted by exposure score (highest first). Each row shows system name, exposure score, automation count, and a visual bar (scaled relative to the highest score — top item fills 100% width). Clicking a system navigates to Portfolio filtered by that system.

- **Owner exposure ranking**: ranked list of owners sorted by exposure score. Each row shows owner name, exposure score, automation count, and a visual bar (same relative scaling). Clicking an owner navigates to Portfolio filtered by that owner.

- **Structural indicators section**: two subsections (each shows up to 5 items with a "View all" link to the Portfolio filtered appropriately)
  - **Recently changed**: automations updated in the last 7 days (showing name, last updated date, change indicator)
  - **Multi-system automations**: automations touching 3+ systems (showing name, system count, systems list) — these represent higher blast radius if they fail

All sections link through to the Portfolio with appropriate filters applied.

### Dependencies

Depends on epic 05 (Risk Engine) for governance signals, risk levels, and exposure scores. Depends on epic 06 (Portfolio Screen) for click-through navigation with filters (URL param format defined in epic 06).

### Data Source

All data is derived from existing Automation records and the risk engine (epic 05). No new data fetching or storage is needed — this screen is a read-only aggregation view.

## Acceptance criteria

- [ ] Top metrics cards display: total automations, high-impact count, high-risk count, missing owners count, overdue reviews count — each card is clickable, navigating to the Portfolio with appropriate filters (Total → `/automations`, High-impact → `?impact=critical&impact=high`, High-risk → `?risk=high`, Missing owners → `?attention=no-owner`, Overdue reviews → `?attention=overdue-review`)
- [ ] System exposure ranking shows systems sorted by weighted exposure score with a visual bar scaled relative to the highest score
- [ ] Owner exposure ranking shows owners sorted by weighted exposure score with a visual bar scaled relative to the highest score
- [ ] Recently changed section lists up to 5 automations updated in the last 7 days, with a "View all" link to the Portfolio (`?updatedAfter=7d&sort=automationLastUpdated&order=desc`)
- [ ] Multi-system section lists up to 5 automations touching 3+ systems, with a "View all" link to the Portfolio (`?minSystems=3`)
- [ ] Clicking a system in the exposure ranking navigates to Portfolio filtered by that system (`?system={systemName}`)
- [ ] Clicking an owner in the exposure ranking navigates to Portfolio filtered by that owner (`?owner={ownerName}`, or `?owner=_none` for the "Unassigned" entry)
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

- ~~Resolved: "Recently changed" uses a 7-day threshold, intentionally shorter than the 14-day "Automation stale" threshold. They measure different things: recent activity vs neglect.~~
- ~~Resolved: Portfolio filter params (`impact`, `risk`, `updatedAfter`, `minSystems`) added to epic 06. All click-through URLs now have concrete param targets. See cross-epic review pass 4.~~
- ~~Resolved: All 5 metrics cards are clickable, navigating to filtered Portfolio views.~~
- ~~Resolved: When no automations are synced, the dashboard shows a guided empty state with a call-to-action linking to settings.~~

---

## Related

- [Brainstorming](08-workspace-snapshot-brainstorming.md)
- [Results](08-workspace-snapshot-results.md)
- [Next: 09 — Production Hardening](09-hardening.md)
- [Patch: Exercise 15 Features](patches/exercise-15-features.md)
