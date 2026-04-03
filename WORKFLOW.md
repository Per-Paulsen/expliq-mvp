# Expliq Development Workflow

> Updated 2026-04-03. Spec-driven development workflow for Expliq R2 (Automation Intelligence).

## Overview

```
PRD 2.0 --> /spec --> Epic Specs --> /dev --> Implementation --> Commit
  ^                                    |
  |                                    v
  |                          Figma MCP (component mechanics only)
  |                          Design system in prd-2.0-decisions.md §15
  |
  PRD Brainstorming (append-only, 15 rounds of decisions)
  PRD Decisions (clean extraction, authoritative reference)
```

## Reference Map

| Document | What it is | When to read |
|----------|-----------|-------------|
| `prd-2.0.md` | Product vision, screen overview, data architecture | Start here |
| `prd-2.0-decisions.md` | All detailed decisions (screens, navigation, entities, schema, design system, prompts) | For spec derivation and implementation — the authoritative reference |
| `prd-2.0-brainstorming.md` | 15 rounds of discussion with reasoning | When you need to understand WHY a decision was made |
| `n8n-api-examples/README.md` | Directory index of all API schemas and real data | For understanding available data |
| `n8n-api-examples/fairtix/reference/ANALYSIS-FINAL.md` | Target LLM output quality | For prompt design and output validation |
| `CLAUDE.md` | Codebase conventions and dev commands | For implementation |
| `tech-stack-idea.md` | Tech stack reference | For implementation |

## Step 1 — Spec Derivation

**Command:** `/spec prd-2.0.md`

The `/spec` skill reads: PRD + decisions + data reference + tech stack. Brainstorms in a new file. Produces numbered epic specs continuing from Epic 10+.

For individual epics: `/spec_ind <number> <name> <description>`

## Step 2 — Spec Refinement

**Commands:** `/refine_all_ind` (within-epic checks) → `/refine_all` (cross-epic consistency) → `/refine <spec>` (individual discussion)

## Step 3 — Implementation

**Command:** `/dev specs/{nr}-{name}.md`

The `/dev` skill reads: spec + PRD + decisions (including design system §15) + all prior results + Figma MCP for component mechanics.

### Figma MCP — Component Mechanics Only

The Figma Make prototype at file key `3bG7mlpucVffGMdoAFPcgc` contains React + Tailwind components. Use for MECHANICS (props, state, interactions). Do NOT use for styling — the design system in `prd-2.0-decisions.md` §15 is authoritative.

**Read component source:**
```
ReadMcpResourceTool(server: "figma", uri: "file://figma/make/source/3bG7mlpucVffGMdoAFPcgc/src/app/components/{Name}.tsx")
```

**Read theme/styles (for reference, not to copy):**
```
ReadMcpResourceTool(server: "figma", uri: "file://figma/make/source/3bG7mlpucVffGMdoAFPcgc/src/styles/theme.css")
```

### Figma Component Index

| Component | Figma Source | Use for |
|-----------|-------------|---------|
| DeployModal | `components/DeployModal.tsx` | Modal mechanics (open/close, JSON preview, copy, deploy action) |
| StatusDot | `components/StatusDot.tsx` | Status indicator component |
| SystemFlow | `components/SystemFlow.tsx` | Source → destination display |
| ExpliqBadge | `components/ExpliqBadge.tsx` | Badge component (adapt to confidence pattern) |
| ProcessSuggestionsModal | `components/workflows/ProcessSuggestionsModal.tsx` | Modal for AI-suggested processes |
| Layout | `components/Layout.tsx` | Sidebar structure |
| Data types | `data/shared/types.ts`, `data/workflows/types.ts`, `data/recommendations-types.ts` | Type reference |

## What Stays from the Current MVP

**Keep as-is:** Auth, n8n connector foundation, Prisma setup, test infrastructure, sidebar shell, login/signup, settings page.

**Extend:** `prisma/schema.prisma` (new models), `llm-pipeline.ts` (massively extended), `n8n-client.ts` (new API endpoints + deploy).

**Replace:** Dashboard page, automations page → Process Map, detail page → business-first, all page-specific types/utilities.

**New:** Process Map page, Priorities page, 4 new Prisma models, workspace-level LLM analysis.

## 4 Screens

| Screen | Route | Purpose |
|--------|-------|---------|
| Dashboard | `/` | Executive summary: next move, facts, priorities, process overview |
| Process Map | `/processes` | Processes with workflows, coverage, maturity. Toggle to show gaps. |
| Priorities | `/priorities` | All recommendations ranked by impact. Deploy from here. |
| Detail | `/automation/[id]` | Per-workflow business narrative, business case, evidence. |

Plus: Settings (`/settings`) and Login/Signup (existing).

## Design System

Authoritative source: `prd-2.0-decisions.md` section 15.

Key rules:
- **Dark mode default** — near-black backgrounds, high-contrast white text
- **Color = meaning only** — green (healthy), amber (attention), red (critical), accent (interactive)
- **Tables/lists for data, NOT cards** — aligned rows for comparison
- **Confidence visual pattern** — solid/dashed/outline decreasing with certainty

## Suggested Epic Sequence

| Phase | Epic | Scope |
|-------|------|-------|
| 0 | Research spike | Test LLM prompts against fairtix data |
| 1 (parallel) | 10: LLM Pipeline V2 + Schema + n8n API | Extended sync, new models, LLM enrichment + workspace analysis, deploy |
| 1 (parallel) | 11: Design System + Layout | Dark theme, sidebar, shared components |
| 2 | 12: Dashboard | Next move, facts, attention/opportunities, process coverage |
| 2 | 13: Process Map | Process rows, workflow rows, show-gaps toggle, search |
| 2 | 14: Priorities | Recommendation tiers, rows, slide-over panels, deploy modal |
| 2 | 15: Detail | Business narrative, business case, connections, evidence |
| 3 | 16: Settings + Auth Polish | Loading states, explanations |

## Historical Context

- Epics 01-08 built from `archive/expliq_prd.md` (original 3-screen PRD) with screenshot references in `archive/designs/`
- Product pivot brainstorming in `archive/brainstorming-roadmap-r2.md` and `archive/_TODO.md`
- Initial API research in `archive/n8n-api-findings.md`
- Figma prototype evaluated and partially superseded — component mechanics kept, styling/structure replaced by design system
