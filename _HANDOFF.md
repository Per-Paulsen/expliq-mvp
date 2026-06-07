---
tags:
  - type/handoff
  - status/ephemeral
---

# Handoff: Expliq direction converged on the Human-Agent Inbox (business-case system-of-record)

**Generated**: 2026-06-07 ~late  ·  **Branch**: main  ·  **Status**: Ready for next session

> This was a conceptual + research + design session. No app code touched. Output is docs + research.

## Repo Snapshot

> Script-collected at handover time. Source of truth. /pickup compares against fresh git.

- **Branch**: `main` (ahead 0, behind 0 of `origin/main`)
- **HEAD**: `047d95e` (docs: session handover 2026-06-04) , moves +2 after this handover's commits
- **Working tree (pre-commit)**: 1 untracked, 1 modified, 0 staged , both committed in Step 5 below
- **Stash**: 1 entry (old, pre-existing, unrelated: epic-18 env/seed WIP)
- **Uncommitted paths** (this expliq-mvp repo):
  - Docs: `specs/human-agent-inbox-design.md` (untracked, new), `specs/patches/expliq-offering-exploration.md` (modified, §19-29 appended)
  - Memory / Skills / Config / Code / Suspicious / Other: —
- **Note (separate repo):** 2 research files + index were written in the Dev VAULT (`Dev/_resources/`), uncommitted there, but persisted on disk + indexed.

## Goal

Decide + design Expliq's product direction for the n8n AI Product Builder portfolio. This session converged it on the **Human-Agent Inbox**: a business-case system-of-record where agents/automations and their accountable humans collaborate.

## Current State

- **New design doc:** `specs/human-agent-inbox-design.md` , the forward design surface (vision, moat, Notary, MCP-native surface, dynamic roles, AR/Dunning end-to-end, "Expliq agentic?", borrow/gap, delivery push/pull constraint, routines-as-tenant, open questions).
- **Offering-exploration extended** (`specs/patches/expliq-offering-exploration.md`) with §19-29: the full arc , §19 HR-for-agents reframe; §20 closed (Workday/Entra); §21-22 work-routing wedge; §23 bidirectional; §24-26 closed (Linear/Jira/MS cross-platform); §27 bar-test verdict; §28 cleaned Human-Agent-Inbox vision + methodological corrections; §29 analogue borrow/gap.
- **Research this session:** 2 deep-research Workflows + 3 targeted Workflows + 1 dig. Two vault files: `_resources/agent-workforce-hr-system-of-record-research-2026-06-07.md`, `_resources/agent-work-routing-handoff-layer-research-2026-06-07.md`; `_resources/_research-index.md` updated.
- **Verified (claude-code-guide):** no push from an MCP server into an idle Claude client. Delivery = doorbell (Slack/email/mobile) + answering = pull (MCP/own surface). Claude routines = headless webhook-fired cloud agents; reach humans only via side-effects.

## Key Decisions

| Decision | Rationale |
|----------|-----------|
| Direction = **Human-Agent Inbox** (business-case SoR), supersedes the §14 comprehension/risk-dashboard as the headline | The org-graph/HR (§20) and work-routing-as-mechanism (§24-26) framings are being closed by incumbents; the business-case-organized collaboration home + Expliq's pre-computed context is the open, durable layer |
| Moat = the **business-case system-of-record** (structured, auditable decision log born in Expliq) | NL surface indispensable; structured auditable record essential. "Expliq as Notary" = LLM distills the NL exchange into the decision log |
| Expliq core = **NON-agentic** (SoR + deterministic routing + the Notary LLM function) | Agency lives in the agents (n8n WFs, Claude routines = just another tenant); §16: be the durable deterministic layer |
| Research = design **orientation**, NOT a verdict on a not-yet-built idea | Avoid the revealed-preference fallacy ("Slack users want Slack" != no demand); research finds only what exists |

## Open Questions / Pending

- **The Business-Case DATA STRUCTURE is unspecified** (this is the Next Step).
- Non-dev owner's answer surface besides MCP/Claude Code (web/voice/mobile).
- Demand deliberately a portfolio bet, not gated.
- Old stash (1, pre-existing, unrelated) still parked.
- Vault research files uncommitted in the Dev vault (separate repo); persist on disk + in `_research-index.md`.

## Next Step

Sketch the **Business-Case data structure** in `specs/human-agent-inbox-design.md`: fields, entry types, the decision-log schema (raw NL + structured fact + role + state + precedent), borrowing Linear's AgentSession/AgentActivity shape and gotoHuman's typed-card contract.

## References

- **Files**: `specs/human-agent-inbox-design.md`; `specs/patches/expliq-offering-exploration.md` §16-29
- **Vault research**: `Dev/_resources/agent-workforce-hr-system-of-record-research-2026-06-07.md`, `Dev/_resources/agent-work-routing-handoff-layer-research-2026-06-07.md`, `_research-index.md`
- **Memory**: `project_expliq_core_features_rethink` (Expliq direction)
- **Recent commits**: `047d95e`, `6f326a9`, `ac6eaaa`
