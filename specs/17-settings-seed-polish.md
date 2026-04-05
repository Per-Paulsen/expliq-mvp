---
tags:
  - type/spec
  - status/draft
  - phase/4
---

# Epic 17 — Settings + Seed + Polish

> Upstream: [PRD 2.0](../prd-2.0.md) | [Decisions §15](../prd-2.0-decisions.md) | [Brainstorming](brainstorming.md)
> Phase: 4 (after Epics 13-16)
> Dependencies: All prior R2 epics (this is the polish pass)

## Scope

Final polish, seed data, and loading states for demo readiness.

**Settings page — sync progress UI:**
- Replace basic progress indicator (from Epic 10) with step-by-step named stages
- Stages: "Fetching workflows..." → "Fetching execution data..." → "Analyzing workflows..." → "Clustering processes..." → "Generating recommendations..." → "Complete"
- Each stage shows a checkmark when done, current stage shows spinner/animation
- Progress reads from CompanyProfile.analysisStatus and per-automation completion tracking
- Important for the demo: audience sees the intelligence being built in real time

**Loading / skeleton states:**
- Dashboard: skeleton layout with "Analyzing your automation landscape..." message while analysisStatus is not "complete" (scaffolded in Epic 13 — polish here)
- Process Map: skeleton or "Analysis in progress..." message
- Opportunities: skeleton or "Generating recommendations..." message
- Detail: per-automation data may be available before workspace analysis completes — show available sections, skeleton for process/recommendation sections

**R2 seed script:**
- Deterministic seed (no API keys): creates a test workspace with all R2 models populated using hardcoded data modeled after research spike results
  - ~8 Automation records with all v8 fields populated (businessNarrative, impact, detectability, etc.)
  - 4 BusinessProcess records with steps, coverage, maturity
  - ~10 Recommendation records across all 3 tiers with impactEstimate badges
  - 3 ProcessSuggestion records with child recommendations
  - 1 CompanyProfile with systemLandscape, nextMoveText, aggregateEstimates, deltaSummary
  - Governance dots: mix of healthy, attention, critical
- LLM-powered seed (needs API keys): imports research spike v8 result files (`specs/research-spike-results/v8/`) into the database as a realistic demo workspace
- Both seeds create a login account with known credentials (documented in .env.example)

**Login page polish:**
- Dark theme already applied in Epic 12
- Add: product tagline or brief description below the Expliq logo
- Ensure error states (wrong password, etc.) render cleanly in dark theme

**Remaining UX gaps:**
- Any broken links, missing empty states, or visual inconsistencies caught during integration testing
- Sidebar "Synced X ago" shows actual relative time
- All page transitions smooth (no flash of unstyled content)

## Acceptance Criteria

### Sync Progress
1. Settings page shows named stages during sync + analysis
2. Each stage transitions to "done" (checkmark) as it completes
3. Current stage shows active indicator (spinner or pulse)
4. Stages reflect actual pipeline progress (reads from CompanyProfile.analysisStatus)
5. "Complete" state shown with green checkmark and "Sync & Analyze" button re-enabled

### Loading States
6. Dashboard shows skeleton + contextual message while analysis is in progress
7. Process Map shows loading state while analysis is in progress
8. Opportunities shows loading state while analysis is in progress
9. Detail page shows available per-automation data even if workspace analysis is still running

### Seed Script — Deterministic
10. `scripts/seed-r2-data.ts` creates a full R2 workspace with hardcoded data
11. Includes: 8 Automations, 4 BusinessProcesses, ~10 Recommendations, 3 ProcessSuggestions, 1 CompanyProfile
12. Data variety: all 3 governance dot levels, all 3 recommendation tiers, all 3 confidence levels, mix of impact levels
13. Login credentials for seed workspace documented in `.env.example`
14. Script is idempotent (can be re-run without creating duplicates)
15. Runs with `npx tsx scripts/seed-r2-data.ts`

### Seed Script — LLM-Powered
16. `scripts/seed-r2-from-spike.ts` reads research spike v8 result files and inserts them into the database
17. Creates a demo workspace with realistic LLM output
18. Requires OPENROUTER_API_KEY only if re-running LLM (result files are pre-generated)

### Login Polish
19. Login page shows Expliq tagline or brief description
20. Error states render correctly in dark theme
21. Signup page consistent styling

### Integration
22. All cross-page navigation works end-to-end (Dashboard → Detail → Process Map → Opportunities → back)
23. Deep-links work: `/opportunities?highlight={id}`, `/opportunities?process={id}`
24. Sidebar "Synced X ago" updates correctly
25. No console errors on any page with seed data loaded

### Tests
26. Seed script test: script runs without errors, all models populated
27. Smoke test: all 5 routes render with seed data without errors
28. Navigation test: full demo flow (Dashboard → Process Map → Opportunities → Detail → back)

## Out of Scope

- New features or pages beyond what's specified in Epics 10-16
- Mobile responsiveness
- Performance optimization (acceptable for <50 workflows)
- CI/CD pipeline setup
- Automated e2e Playwright tests (manual demo verification sufficient)

## Domain Terms

| Term | Definition |
|------|-----------|
| **Sync progress** | Step-by-step UI showing the pipeline stages during sync + analysis. Important for demo — audience sees intelligence being built in real time. |
| **Deterministic seed** | Test data with no external dependencies (no API keys, no network). Hardcoded values modeled after real LLM output. For tests and local development. |
| **LLM-powered seed** | Demo data imported from research spike results. Realistic quality for presentations. |

## Open Questions

1. Should the sync progress UI poll for status updates (client-side polling every 2-3s), or use server-sent events / streaming? (Recommendation: polling for MVP — simpler, sufficient for a sync that takes 2-5 minutes. SSE is a future enhancement.)
2. Should the deterministic seed data match the FairTix scenario (so it's recognizable in demos), or use a different fictional company (to avoid confusion with the live FairTix sync)? (Recommendation: different fictional company — avoids confusion when demo shows both seed data and live FairTix sync.)

---

## Related

- [All prior R2 epics](10-schema-sync.md) (this epic polishes their output)
- [Research Spike Results](research-spike.md) (v8 result files for LLM-powered seed)
