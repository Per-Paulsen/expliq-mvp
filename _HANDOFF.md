---
tags:
  - type/handoff
  - status/ephemeral
---

# Handoff: "Agent Simulation" standalone product idea (agent-eval, NOT Expliq)

**Generated**: 2026-06-03 ·  **Branch**: `main` ·  **Status**: Ready for next session

> **Read this first:** this whole session was a STANDALONE product-thinking thread, NOT Expliq. It ran in this repo only for research-adjacency. **The work lives in the Dev VAULT repo** (`Dev/_resources/`, separate repo, no remote), and the **source of truth is the concept file there.** This `_HANDOFF.md` overwrote the prior Expliq-identity handover (recoverable in git history, commit `9d03458`). Cross-repo anchor = the memory entry `project_agent_simulation_nocode_idea` (loads in any session).

## Repo Snapshot
- **Branch**: `main` (ahead 0, behind 0 of `origin/main`)
- **HEAD**: `e54e61a` — docs: Expliq identity re-examination ...
- **Working tree (expliq-mvp)**: clean (0 untracked / 0 modified / 0 staged), apart from this `_HANDOFF.md`.
- **Stash**: 1 (old, pre-existing, unrelated).
- **NOTE — the session's output is in the VAULT repo `C:/Users/perpa/Dev` (no remote), committed there this session:** `_resources/agent-eval-idea-concept-and-decisions.md` (new), `_resources/agent-eval-simulation-nocode-whitespace-research-2026-06-02.md` (new), `_resources/how-maxim-ai-works-mechanics-2026-06-02.md` (new), `_resources/_research-index.md` (modified).

## Goal
Define what the standalone "Agent Simulation" idea actually IS, as an ambitious / modern PORTFOLIO DEMO for an n8n Product-Builder application (not a market-validated product).

## Current State
- **Idea crystallized** (after many reframes): a capability for Claude (agent-to-agent) to **build-and-PROVE an agentic artifact from intent** — generate test cases, run, LLM-judge, derive an improved system prompt, iterate. "`skill-build` generalized." Consumer = Claude via MCP, no human UI, no hand-built dataset.
- **Floor + competitors verified-current (2026-06-03):** n8n native Evaluations = the floor — dataset-driven, **no** auto-gen / simulation / optimize-loop; turnkey AI judge; runs the REAL WF (not a sandbox), side-effects are the user's manual problem. Maxim = ADJACENT (HAS a prompt-optimize loop BUT Maxim-hosted-prompts + dataset-required, no external/n8n, no write-back). Voiceflow = DIFFERENT (CLI/YAML, in-platform conversational only).
- **Differentiation = operating model, NOT the engine** (engine is commoditized: LangWatch/promptfoo/Maxim). The wedge = **external n8n agent + zero-dataset/all-LLM + write-back into the live node**, plus the side-effect-free **auto-mock twin** (Path B) that n8n lacks.
- **Product shape:** NOT just a skill ("Claude could do it" but does rigorous scaled eval poorly + the LLM-calls are external) → **skill + offloaded harness**; the harness is the substance.

## Key Decisions
| Decision | Rationale |
|----------|-----------|
| Standalone, NOT Expliq | different object + capability; lives in the vault, runs here only for research-adjacency |
| Purpose = portfolio demo, not product | demand-gate + judge-reliability re-weight to design considerations, not blockers |
| Consumer = Claude via MCP (agent-to-agent), not a human UI | kills the "no-code-builder UI" framing |
| Differentiation = operating model, not the eval engine | engine commoditized; novelty = autonomous agent-to-agent + zero-dataset + write-back |
| "skill + harness", not skill-alone | Claude has the primitives but does rigorous eval poorly + external LLM-calls must be offloaded |

## Open Questions / Pending
- **THE cascading decision: goal-lens Demo vs Product** → resolves **Path A** (isolated-LLM-sim, substrate-agnostic, lighter, prior-art-close) vs **Path B** (n8n twin-sim + tool-mocking, n8n-coupled, higher-fidelity, more novel + on-thesis). Demo → B; substrate-agnostic Product → A.
- Q3 intent-passing · Q4 judge-reliability framing · Q5 demo wow-moment · Q6 name · Q7 eval-brain in n8n vs code · Q8 form (skill / MCP / subagent).
- **Empirical test pending:** does Claude Code + a skill alone run a rigorous loop, or does it need the harness? (test on the renamed triage WF).
- 1 old stash (pre-existing, unrelated).

## Next Step
Open the vault concept file `Dev/_resources/agent-eval-idea-concept-and-decisions.md` → section **"The strategic fork (Path A vs Path B)"**, and decide the **goal-lens (Demo vs Product)** with Per. That one decision cascades to Path A/B, the n8n-coupling, and skill-vs-harness.

## References
- **Source of truth (vault):** `Dev/_resources/agent-eval-idea-concept-and-decisions.md` (concept + full evolution + decisions + Q3-Q8).
- **Evidence (vault):** `agent-eval-simulation-nocode-whitespace-research-2026-06-02.md` (market/competitor, §9/§10 Maxim+Voiceflow verified, § Nate-Herk-video + live n8n-floor check), `how-maxim-ai-works-mechanics-2026-06-02.md`.
- **Memory:** `project_agent_simulation_nocode_idea` (standalone, cross-repo pointer); method lesson `feedback_adversarial_research_pass`.
- **Prior Expliq-identity handover:** git history, commit `9d03458` (this file overwrote it).
