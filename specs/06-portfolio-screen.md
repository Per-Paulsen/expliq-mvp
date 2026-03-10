# 06 — Portfolio Screen

## Scope

Build the Portfolio screen (`/automations`) — the primary list view where Emma browses, searches, filters, and triages automations. This screen is the main navigation hub and the most frequently used view.

### Dependencies

This epic depends on epic 05 (Risk Engine) for computing governance signals displayed as attention badges on cards and in the Attention filter row.

### Layout (based on prototype screenshots)

- **Header area**: search bar ("Search automations..."), sync status indicator
- **Filter section** (collapsible — collapsed by default, auto-expands when any filter is active via URL params or user interaction; can be manually collapsed at any time, even with active filters — filters remain applied, only the filter UI is hidden). All chip and badge counts across all filter rows are global — they always show total workspace counts regardless of other active filters:
  - **Systems** row: clickable chips showing each system with automation count (e.g., "Slack (10)", "Salesforce (10)"). Multiple can be selected. "Clear" button resets.
  - **Platform** row: clickable chips showing each platform with count (e.g., "n8n (5)"). Only n8n has data for MVP.
  - **Owner** row: clickable chips showing each owner with automation count (e.g., "Alice (5)", "Bob (3)", "No owner (2)"). Multiple can be selected. "Clear" button resets.
  - **Attention** row: clickable badges for governance signals (e.g., "No owner assigned (3)", "Automation stale (4)", "Documentation outdated (7)", "Overdue review (5)", "Inactive (2)")
  - **Impact** row: clickable chips for each impact level with count (e.g., "Critical (3)", "High (7)", "Medium (10)", "Low (3)"). Uses effective impact (`impactOverride ?? impactProposal`). Multiple can be selected. "Clear" button resets.
  - **Risk** row: clickable chips for each risk level with count (e.g., "High (5)", "Medium (12)", "Low (6)"). Uses computed risk level from epic 05. Multiple can be selected. "Clear" button resets.
- **URL-only filters** (no visible chip row — used by Snapshot "View all" links): `updatedAfter` (filters to automations updated within a time window, e.g., `?updatedAfter=7d`) and `minSystems` (filters to automations touching N+ systems, e.g., `?minSystems=3`). When active, a small dismissible "active filter" tag is shown above the results (e.g., "Filtered: recently changed ×" or "Filtered: 3+ systems ×").
- **Sort bar**: sort by "Automation Last Updated", "Documentation Last Updated", "Name" — with ascending/descending toggle
- **Result count**: "X automations" label that updates with filters
- **Automation cards**: each card shows:
  - Name (LLM-generated)
  - Status badge (Active / Inactive / Deprecated)
  - Platform badge (n8n)
  - Systems touched (as small tag chips)
  - Owner name
  - 1-2 sentence description (LLM-generated)
  - Governance attention badges (documentation outdated, no owner, etc.)
  - Automation Last Updated timestamp
  - Documentation Last Updated timestamp
- **Card interaction**: clicking a card navigates to `/automations/[id]`

### Search

Full-text search across automation name and description using Prisma `contains` queries with `mode: 'insensitive'` for case-insensitive matching.

### Filters

Filters are combinable (AND logic across categories, OR logic within a category). URL query parameters reflect active filters for shareability and browser back/forward support. Filter parameters use repeated query params (e.g., `?system=Slack&system=Salesforce&owner=Alice&attention=no-owner`) parsed with `useSearchParams`. Available param names: `system`, `owner`, `attention`, `platform`, `impact`, `risk`, `search`, `sort`, `order`, `updatedAfter`, `minSystems`.

Canonical param values for `attention` (map to governance signals from epic 05): `no-owner`, `documentation-outdated`, `automation-stale`, `overdue-review`, `inactive`. Canonical values for `sort`: `automationLastUpdated` (default), `documentationLastUpdated`, `name`. Values for `order`: `asc`, `desc`.

## Acceptance criteria

- [ ] All automations in the workspace are listed as cards with: name, effective status badge (`statusOverride ?? status`), platform badge, system tags, owner, description, governance badges, and timestamps
- [ ] Search filters automations by name and description (case-insensitive, partial match)
- [ ] System filter chips show each system with count; selecting one or more filters the list to automations touching those systems
- [ ] Owner filter chips show each owner (and "No owner") with count; selecting one or more filters the list to automations with those owners
- [ ] Attention filter badges show all five governance signal counts (including "Overdue review"); selecting one filters to automations with that signal active
- [ ] Platform filter chips show each platform with count; selecting one or more filters the list to automations on those platforms
- [ ] Impact filter chips show each impact level (Critical, High, Medium, Low) with count using effective impact (`impactOverride ?? impactProposal`); selecting one or more filters the list to automations with those impact levels
- [ ] Risk filter chips show each risk level (High, Medium, Low) with count; selecting one or more filters the list to automations with those risk levels
- [ ] URL-only filters `updatedAfter` and `minSystems` filter the list when present in URL params, showing a dismissible "active filter" tag above results (e.g., "Filtered: recently changed ×")
- [ ] The filter section is collapsible — collapsed by default, auto-expands when any filter is active, and can be manually collapsed even with active filters (filters remain applied)
- [ ] Sort works by automation last updated (default), documentation last updated, and name — with asc/desc toggle
- [ ] Result count updates dynamically with active filters and search
- [ ] Clicking an automation card navigates to `/automations/[id]`
- [ ] Filter state is reflected in URL query parameters
- [ ] Sync status indicator in the header shows the `lastSyncAt` from the workspace's n8n ConnectorConfig (for MVP, at most one connector per workspace), e.g., "Last synced: 2 hours ago", or "Never synced" if no sync has occurred
- [ ] Automations with `status = removed` are excluded from the list (regardless of `statusOverride`)
- [ ] When no automations exist (or all are removed), the Portfolio shows an empty state message guiding the user to connect and sync an automation platform

## Out of scope

- Pagination or infinite scroll (load all automations for MVP; expected volume is tens, not thousands)
- Bulk actions (multi-select, bulk assign owner, etc.)
- Manual "Add Automation" button (data comes from n8n sync only)
- Risk level column/badge on the card (governance badges serve this role on the list view)
- Export or download functionality

## Domain terms

| Term | Definition |
|------|-----------|
| **Portfolio** | The list view showing all automations in the workspace with filtering and search capabilities |
| **Automation card** | A summary card in the list showing key metadata, description, and governance badges for one automation |
| **Attention badges** | Visual indicators of governance gaps (documentation outdated, no owner assigned, automation stale, overdue review, inactive) shown on cards |
| **System chips** | Clickable filter elements showing external systems (Slack, Salesforce, etc.) with automation counts |

## Open questions

- ~~Resolved: Platform filter row is shown for MVP even with only n8n. Communicates multi-platform support is coming, shows the count, and has zero implementation cost.~~
- ~~Resolved: Added Impact and Risk as visible filter chip rows. Added `updatedAfter` and `minSystems` as URL-only params with dismissible tags. Filter section is collapsible (collapsed by default, auto-expands when filters are active). See cross-epic review pass 4.~~
- ~~Resolved: Filter badge counts are global — always show total workspace counts regardless of other active filters. Simpler to implement and matches standard faceted search UX.~~
