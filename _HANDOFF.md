---
tags:
  - type/handoff
  - status/ephemeral
---

# Handoff: Expliq identity — evidence-based re-examination → narrowed to "estate black-box-risk layer"

**Generated**: 2026-06-01 ·  **Branch**: `main` ·  **Status**: Ready for next session

## Repo Snapshot

> Script-collected (Step 2a). Source of truth. The 3 Docs below are committed in THIS handover's checkpoint (tree will be clean after).

- **Branch**: `main` (ahead 0, behind 0 of `origin/main`)
- **HEAD**: `a7ee8d0` — docs: session handover (2026-05-31) — finalize + push checkpoint
- **Working tree** (at generation): 2 untracked, 1 modified, 0 staged
- **Stash**: 1 (old, pre-existing, unrelated)
- **Uncommitted paths**:
  - Docs: `specs/patches/expliq-offering-exploration.md` (M, §15 from last session), `specs/patches/expliq-decision-audit.md` (new), `specs/patches/expliq-identity-exploration.md` (new)
  - (all other buckets: —)
- **NOTE:** the bulk of this session's output is research files in the **Dev vault repo** (`Dev/_resources/`, separate repo, no remote) — committed separately this session.

## Goal

Decide what Expliq's core product actually IS — evidence-based, not argued — and lock a defensible identity/feature direction for the n8n-Product-Builder portfolio showcase. This session pressure-tested the 2026-05-31 conclusions instead of building on them.

## Current State

- **Decision audit done + web-verified** (`expliq-decision-audit.md`): 60 atoms; the F4-dependency-map demotion (D8) was built on a FALSE fact (n8n did NOT ship a dep-graph; PR #22371 is an unmerged community fork) — re-opened.
- **Real-world research done** (`Dev/_resources/automation-real-world-usage-research-2026-06-01.md` + targeted follow-up): real automation = mundane ETL plumbing; "agent" mostly a label; comprehension pain bites the **price-anchored squeezed middle** (~90x cost wall); n8n absent from market data; RevOps-operator uncorroborated.
- **Competitor discovery + teardown done** (`Dev/_resources/expliq-competitor-discovery-census-2026-06-01.md`, 29 players verified): white-space HOLDS but NARROW — business-meaning / cross-substrate / trust / ask-your-estate are OPEN; sync-inventory + structural-security OCCUPIED/commoditizing; dep-map/black-box/biz-impact CONTESTED in adjacent object cells. Biggest threat = **Make Grid** (AI descriptions "soon"). Found an n8n-native micro-cluster we'd missed (n8nViewer, FlowLint, Audit8n, n8n Sentinel, zie619 AI-BOM, Document My Workflow).
- **Identity re-grounded** (`expliq-identity-exploration.md`): C-in-thesis / A-in-showcase; comprehension+trust layer ABOVE native inventory; trust = BEHAVIORAL not security (D16 blade).
- **Business-translation thread KILLED** (`Dev/_resources/expliq-business-comprehension-verdict-2026-06-01.md`, adversarial, ~11 refutes-to-1): an automation is CODE-like not data-like; every comprehension consumer is technical/regulatory, not business. Audience corrects from "business" → technical inheritor + AI agents.
- **Final narrowing (end of session):** single-workflow "explain/doc" is a COMMODITY (free n8n templates + Claude Code + n8n MCP). What survives BOTH the verdict and the commodity challenge = **estate-level black-box-RISK (F5, the hero) + cross-substrate moat + comprehension-as-substrate (not headline)**, for the technical estate-owner/inheritor.

## Key Decisions

| Decision | Rationale |
|----------|-----------|
| "Business translation for non-builders" = DROP | Adversarially refuted ~11:1; automation resolves CODE-like; consumers are technical/regulatory |
| Audience = technical inheritor + AI agents (NOT business) | The validated "repo-walkthrough for your automation estate" framing |
| Single-workflow explain/doc = commodity, don't claim it | Free n8n templates (2173/2669/9746) + Claude Code+MCP already do it |
| Surviving core = estate black-box-risk (F5) + cross-substrate; comprehension = substrate | The only thing neither verdict nor commodity kills; nobody does it for automations |
| Don't compete on security/inventory; trust = behavioral | Occupied/commoditizing (teardown); D16 blade |

## Open Questions / Pending

- **The demand-intensity gate is now the ONLY thing left** and is unvalidated — does the narrowed "estate black-box-risk over your automation estate" wedge have real demand? Needs real n8n-operator conversations, not more desk research.
- Size of the price-anchored squeezed middle: unquantifiable from desk research.
- Hat consequence: under PORTFOLIO this narrowed wedge is a fine demo-able showcase; under VENTURE it's thin + unvalidated.
- 1 old stash (pre-existing, unrelated).

## Next Step

Open `specs/patches/expliq-identity-exploration.md` §6b + `Dev/_resources/expliq-business-comprehension-verdict-2026-06-01.md`, and decide with Per: **LOCK the narrowed identity** (estate black-box-risk layer, cross-substrate, for technical inheritors + agents — comprehension as substrate, NOT business-translation, NOT single-workflow-explain) **or first validate demand** with real n8n operators (the standing gate). Do NOT re-open the business-translation thread (killed) or claim the commoditized single-workflow-explain.

## References

- **Decision/identity (expliq-mvp)**: `specs/patches/expliq-identity-exploration.md`, `expliq-decision-audit.md`, `expliq-offering-exploration.md`
- **Research (Dev vault `_resources/`)**: `automation-real-world-usage-research-2026-06-01.md`, `expliq-competitor-landscape-harvest-2026-06-01.md`, `expliq-competitor-discovery-census-2026-06-01.md` (incl. Stage-2 teardown), `expliq-business-comprehension-verdict-2026-06-01.md`; index in `_research-index.md`
- **Memory**: `project_expliq_core_features_rethink.md`; method lesson `feedback_adversarial_research_pass.md` (the verdict killed our OWN mid-session idea — the discipline working)
- **Recent commits**: `a7ee8d0`, `243ecf1`, `9ec8a8e`
