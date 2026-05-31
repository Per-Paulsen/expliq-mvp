---
tags:
  - type/handoff
  - status/ephemeral
---

# Handoff: Expliq core-features re-examination → portfolio-first v1 LOCKED

**Generated**: 2026-05-31 19:30  ·  **Branch**: `main`  ·  **Status**: Ready for next session

## Repo Snapshot

> Script-collected at handover time. Source of truth — `/pickup` compares against fresh git.

- **Branch**: `main` (ahead 1, behind 0 of `origin/main`) — the docs commit `9ec8a8e`, UNPUSHED. (+ this handover commit, also local.)
- **HEAD**: `9ec8a8e` — docs: Expliq core-features re-examination + offering exploration
- **Working tree**: 1 untracked, 0 modified, 0 staged
- **Stash**: 1 entry (old, pre-existing, unrelated)
- **Uncommitted paths**:
  - Memory: — (memory files updated this session but live in `~/.claude`, not the repo)
  - Docs: —
  - Code/WIP: —
  - Other: `{9C4E024D-...}.png` (the n8n Overview screenshot Per pasted as F4/F5 grounding; 190KB; decision pending)

## Goal

Decide what Expliq's core product actually IS (the prd-2.0 "business opportunity engine" felt like an overshoot), and lock a concrete, grounded v1 feature set for a portfolio showcase (the n8n AI Product Builder application).

## Current State

- **DECISION LOCKED (portfolio-first).** Full reasoning: `specs/patches/expliq-core-mcp-vision-brainstorming.md` Parts 6-14 + `specs/patches/expliq-offering-exploration.md` Sections 0-14.
- **Refined v1** = "automation estate intelligence / a repo-walkthrough for your n8n estate": core = **F2 business-meaning** + **F5 black-box-risk**; **F4 dependency map = canvas** (n8n shipped a basic dep-graph Feb 2026, so the bare map is table-stakes); **F1 sync** scaffold; **F7 ask-your-estate** = optional wow. **Hero** = black-box-risk callout on the map.
- **OUT**: opportunity-engine, LLM impact-PREDICTION (infeasible mirage on dynamic n8n), security-posture (Zenity's lane), monitoring (n8n's turf).
- **9 research files** in `Dev/_resources/` (dated 2026-05-31) committed in the **vault repo `757d798`**.
- **Commits LOCAL + UNPUSHED**: expliq-mvp `9ec8a8e` (2 docs) + this handover commit; Dev-vault `757d798` (9 research + index).
- **Memory** updated: `project_expliq_core_features_rethink.md` + MEMORY.md pointer.

## Key Decisions

| Decision | Rationale |
|----------|-----------|
| Portfolio-first hat | Real showcase for the n8n application; demand/willingness-to-pay does NOT gate it (unvalidated = acceptable) |
| v1 = comprehension + black-box-risk (F2+F5), map as canvas | Validated problem-signal (n8n community), feasible, demo-able; n8n already ships a dep-graph so the map alone is table-stakes |
| Opportunity-engine + impact-prediction + security = OUT | Overshoot / infeasible mirage / Zenity's lane (all evidenced) |
| "Explain a workflow" is NOT a commodity | The product around it (sync / join exec-data / persist / estate-context) is the value |

## Open Questions / Pending

- **Screenshot `{9C4E024D-...}.png`** (n8n Overview, 190KB, repo root, untracked): Per to decide — commit-as-evidence / gitignore / delete. Pasted this session as F4/F5 grounding.
- **Push the local commits to main?** (docs-only, demo-safe; deliberately left UNPUSHED pending Per's word.)
- 1 old stash (pre-existing, unrelated).

## Next Step

Resolve the screenshot + push questions above, then turn the locked v1 into a **build/spec plan** for the showcase (F1 sync + F2 business-meaning + F5 black-box-risk on the F4 map + F7 ask-your-estate), per `expliq-offering-exploration.md` Section 14.

## References

- **Files**: `specs/patches/expliq-offering-exploration.md` (Sections 0-14 = the locked v1), `specs/patches/expliq-core-mcp-vision-brainstorming.md` (Parts 6-14 = the reasoning arc)
- **Research**: 9 files in `Dev/_resources/` dated 2026-05-31 (indexed in `_resources/_research-index.md`)
- **Memory**: `project_expliq_core_features_rethink.md`; method lesson `feedback_adversarial_research_pass.md`
- **Recent commits**: expliq-mvp `9ec8a8e` (local), Dev-vault `757d798` (local)
