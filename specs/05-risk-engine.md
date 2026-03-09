# 05 — Risk Engine

## Scope

Implement the governance signal computation, risk level derivation, and exposure score calculations. This is the analytical core that powers the dashboard and badges.

### Governance Signals

Computed per automation using global default thresholds:

| Signal | Rule | Default |
|--------|------|---------|
| **Documentation outdated** | `documentationLastUpdated IS NULL` (never generated) OR `automationLastUpdated > documentationLastUpdated` | Triggered when LLM generation has never run or the workflow changed after the last generation |
| **Automation stale** | `automationLastUpdated IS NOT NULL` AND `automationLastUpdated < now - threshold` | 14 days (if `automationLastUpdated` is null, signal is inactive) |
| **Overdue review** | `lastReviewDate + reviewCadenceDays < now` | 30-day cadence (or never reviewed) |
| **No owner assigned** | `owner IS NULL` | — |
| **Inactive** | effective status = `inactive` (where effective status = `statusOverride ?? status`) | Derived from n8n workflow active/inactive flag or user override |

### Risk Level

Each automation gets a computed risk level (High / Medium / Low) derived from the combination of active governance signals:

- **High**: 3+ active signals, OR no owner + documentation outdated, OR inactive (by effective status) + any other signal
- **Medium**: 1-2 active signals
- **Low**: 0 active signals

Note: The rules above use governance signal counts only. See open question below about whether impact classification should also factor into risk level elevation.

### Scope Precondition

All computations in this epic (governance signals, risk levels, exposure scores) apply only to non-removed automations — those where `status != removed`. Automations with `status = removed` are excluded regardless of `statusOverride`.

### Effective Impact

The effective impact classification for an automation is `impactOverride ?? impactProposal`. All downstream calculations (exposure scores, dashboard metrics) use this derived value.

### Exposure Scores

- **System exposure**: for each system (Slack, Salesforce, etc.), aggregate a weighted score from all automations touching that system. Weights factor in effective impact and risk level.
- **Owner exposure**: for each owner, aggregate a weighted score from all automations they own. Same weighting approach.

Weight mapping (proposed):
- Effective impact: Critical = 4, High = 3, Medium = 2, Low = 1
- Risk: High = 3, Medium = 2, Low = 1
- Exposure score per automation = effective impact weight × risk weight
- System/owner total = sum of exposure scores for their automations

### Implementation Approach

Governance signals and risk levels are computed on-read (derived at query time) rather than stored. This ensures they are always current without requiring background recomputation. Exposure scores may be computed on-read or cached, depending on performance.

## Acceptance criteria

- [ ] Each governance signal is computed correctly per the rules defined above
- [ ] Each automation has a derived risk level (High/Medium/Low) based on its active governance signals
- [ ] System exposure scores are computed, weighted by impact and risk, for all systems across all automations in the workspace
- [ ] Owner exposure scores are computed, weighted by impact and risk, for all owners across all automations in the workspace
- [ ] Governance signal thresholds are defined as named constants (not magic numbers) for easy future configurability
- [ ] A utility/service module exposes functions like `getGovernanceSignals(automation)`, `getRiskLevel(automation)`, `getSystemExposure(workspaceId)`, `getOwnerExposure(workspaceId)` for use by UI epics
- [ ] Unit tests cover edge cases: automation with all signals active, automation with none, null owner, null lastReviewDate (treated as never reviewed → overdue)

## Out of scope

- User-configurable thresholds (using hardcoded global defaults for MVP)
- Historical risk trending or change tracking over time
- Notification or alerting based on risk levels
- Persisted/cached risk scores (compute on-read for MVP)
- Risk weighting customization

## Domain terms

| Term | Definition |
|------|-----------|
| **Governance signal** | A boolean indicator that an automation has a specific governance gap (e.g., missing owner, stale docs) |
| **Risk level** | A computed High/Medium/Low classification derived from the count and severity of active governance signals |
| **Exposure score** | A weighted aggregate measuring how much risk a given system or owner is exposed to across their automations |
| **Impact weight** | Numeric value assigned to each impact level for exposure calculation: Critical=4, High=3, Medium=2, Low=1 |
| **Effective impact** | The resolved impact classification: `impactOverride ?? impactProposal`. Used for exposure score weighting and dashboard metrics |
| **Compute on-read** | Deriving values at query time rather than storing them, ensuring they are always up-to-date |

## Open questions

- ~~Resolved: Risk level is derived from governance signal counts only. Impact classification is a separate dimension that factors into exposure scores (impact_weight × risk_weight) but does not elevate risk level. This follows standard risk matrix practice — governance health and business impact are independent axes.~~
