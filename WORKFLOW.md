# Expliq Development Workflow

> Established 2026-04-02. This document describes the spec-driven development workflow for the Expliq MVP, including the Figma MCP integration for the R2 product pivot.

## Overview

```
PRD 2.0 --> /spec --> Epic Specs --> /dev --> Implementation --> Commit
  ^                                    |
  |                                    v
  |                          Figma MCP (design reference)
  |                          ReadMcpResourceTool for component code
  |
  PRD Brainstorming (append-only, decisions captured here first)
```

## Step 0 — PRD Brainstorming

**File:** `prd-2.0-brainstorming.md` (repo root)

All product decisions are discussed and captured here before the PRD is written. This file is append-only. It includes:
- Per-screen design evaluation (what to keep/change/cut from Figma prototype)
- Data model decisions
- LLM task scoping
- Scope cuts and trade-offs
- User answers to all questions

When brainstorming is complete, the PRD 2.0 is derived from it.

## Step 1 — PRD 2.0

**File:** `prd-2.0.md`

Extension PRD that captures the product pivot from governance dashboard to opportunity engine. References the Figma Make file for design context. Describes each screen, its data requirements, and what's new vs. reused from the current MVP.

## Step 2 — Spec Derivation

**Command:** `/spec prd-2.0.md`

Brainstorms in a new file (not the original `specs/brainstorming.md`). Produces numbered epic specs continuing from the existing sequence (Epic 10+).

## Step 3 — Implementation

**Command:** `/dev specs/{nr}-{name}.md`

Same workflow as epics 01-08, with one addition: team members use the Figma MCP as a design reference during implementation.

### Figma MCP Integration

The Figma Make prototype at file key `3bG7mlpucVffGMdoAFPcgc` contains reference React + Tailwind implementations for all screens.

**During `/dev`, team members should:**

1. Read the relevant Figma page source via `ReadMcpResourceTool`:
   - `file://figma/make/source/3bG7mlpucVffGMdoAFPcgc/src/app/pages/{PageName}.tsx`
   - `file://figma/make/source/3bG7mlpucVffGMdoAFPcgc/src/app/components/{ComponentName}.tsx`
   - `file://figma/make/source/3bG7mlpucVffGMdoAFPcgc/src/app/data/{data-file}.ts`

2. **Adapt, don't copy.** The Figma code is a React Router SPA with hardcoded data. Adapt to:
   - Next.js App Router (server components, server actions, async params)
   - Real data from Prisma (not hardcoded arrays)
   - Project conventions from `CLAUDE.md`
   - shadcn/ui components from `src/components/ui/`

3. **Only implement what the spec says.** The Figma prototype contains features we explicitly cut. The spec is the authority, not the prototype.

### Figma MCP Resource Index

| Screen | Page Source | Key Components |
|--------|-----------|----------------|
| Dashboard | `pages/Dashboard.tsx` | `StatusDot`, `MetricCard` |
| Workflows | `pages/Workflows.tsx` | `workflows/WorkflowCard`, `workflows/AISummary`, `workflows/BusinessProcessGroup`, `workflows/FilterPanel`, `workflows/ProcessSuggestionsModal` |
| Roadmap | `pages/Roadmap.tsx` | `recommendations/BusinessView`, `recommendations/RecWorkflowCard`, `recommendations/RecProcessCard`, `DeployModal` |
| Company | `pages/Company.tsx` | (self-contained) |
| Detail | `pages/AutomationDetail.tsx` | `AutomationDetailBusinessView`, `AutomationDetailSidebar` |
| Layout | `components/Layout.tsx` | `ExpliqCard`, `ExpliqBadge`, `SystemFlow`, `ROIMetric`, `DependencyBadge` |
| Data Types | `data/shared/types.ts`, `data/workflows/types.ts`, `data/recommendations-types.ts`, `data/workflow-details-types.ts` | — |

## What Stays from the Current MVP

**Infrastructure (keep as-is):**
- Auth system (`auth.ts`, `auth.config.ts`, `session.ts`, `middleware.ts`)
- n8n connector (`n8n-client.ts`, `encryption.ts`, `actions/connector.ts`)
- Prisma setup (`prisma.ts`, singleton, driver adapter pattern)
- Test infrastructure (vitest config, seed scripts)
- `(app)/layout.tsx` shell with sidebar (nav items will change)
- `(auth)/` login/signup pages
- Settings page

**Extend:**
- `prisma/schema.prisma` — new models added, existing models get new fields
- `llm-pipeline.ts` — massively extended with new LLM tasks
- `risk-engine.ts` — stays as governance foundation, deprioritized in UI

**Replace:**
- `(app)/page.tsx` (Workspace Snapshot) -> new Dashboard
- `(app)/automations/` (Portfolio) -> new `/workflows` route
- `(app)/automations/[id]/` (Detail) -> business-first rewrite
- `snapshot-metrics.ts`, `snapshot-types.ts` -> new dashboard logic
- `portfolio-filters.ts`, `portfolio-types.ts` -> new workflows logic
- `automation-detail-types.ts`, `badge-colors.ts` -> new types

**New:**
- `/company` page
- `/roadmap` page
- New Prisma models (BusinessProcess, Recommendation, CompanyProfile, TechnicalImprovement)
- ~25 new UI components (adapted from Figma prototype)
- Deploy modal with n8n JSON generation

## Scope Cuts (Agreed 2026-04-02)

These features exist in the Figma prototype but are NOT built:
- Governance toggle (business view only for all screens)
- Technical improvements inline on Workflows page
- Editable process names
- Full filter system (search only)
- Sort by revenue toggle
- Node-level workflow visualization on detail page

These ARE included despite being complex:
- Business process suggestions (new process recommendations)
- Connected automations (upstream/downstream on detail page)
- Deploy modal with n8n JSON preview

## Historical Context

- Epics 01-08 were built from `expliq_prd.md` (3-screen mini-PRD) with screenshot references
- Brainstorming for the product pivot lives in `archive/brainstorming-roadmap-r2.md` and `archive/_TODO.md` — these files are historical context, not active inputs
- The Figma prototype was created via Figma Make (AI-generated) and requires critical evaluation before use as design reference
