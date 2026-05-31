# AI Trust Showcase — Concrete Plan

> Status: plan, living document (revised in place; see Changelog at bottom). The deliberate, research-backed direction for the n8n AI Product Builder showcase. Build prod-safe (parallel; do not break the live widget).

## What and why (one paragraph)

Upgrade the existing live support-triage workflow (`file_support_request`, single Claude agent + MCP tools + RAG) into an "AI Trust" showcase: evals + observability + guardrails, all demonstrably closing the loop. The core is proving the agent BEHAVES correctly (classification, routing, groundedness, safety) and stays correct across changes. This targets the n8n role's "AI Trust" workstream ("turn 'works in demos' into 'works in production'") and its eval must-have, while demonstrating the role's philosophy ("knowing what belongs where"). The hook: the agent is a textbook "lethal trifecta" (RAG private data + untrusted user message + outward GitHub/Linear write), so hardening it and PROVING the hardening is a concrete trust story. Sovereignty is shown honestly through what genuinely fits locally (self-hosted n8n + local embeddings + local guardrail checks), not through a contrived local swap.

## Decisions locked

- **Infra is elastic, NOT a constraint.** A bigger / GPU box is a few minutes away. Earlier infra-driven exclusions are lifted.
- **Architecture:** keep single-agent + tools, **Claude stays the prod agent core** (the right tool for the hardest part). No multi-agent.
- **Multi-agent:** out for this demo (sequential triage; single-agent is senior per SOTA + n8n philosophy), not for infra reasons. Revisit later as a SEPARATE learning project (builds "harness literacy", a role must-have) — explicitly not this showcase.
- **Self-hosting where it genuinely fits = the honest sovereignty story:** self-hosted n8n (the role's home turf), local Ollama embeddings (already running), and **local guardrail LLM checks** (jailbreak/nsfw on a small local model, fixed into Phase 2). The principle: self-host where the workload is lightweight and lossless, use Claude where it is hard (the agentic core).
- **Local generative LLM as an eval comparison candidate (Phase 3b): kept but OPTIONAL.** A local ~32B measured vs Claude on the golden dataset. Honest note: this was originally over-weighted by our long cloud-vs-local discussion; it is a nice bonus, not the headline.
- **n8n-native first:** dogfood n8n's own Evaluation + Guardrails nodes (confirmed present on the box, 2.56.0).
- **Tracing:** self-hosted Langfuse (own / bigger box). Risk-free (observability never breaks a live demo), supports the sovereignty story.
- **Golden dataset:** CSV/JSONL in the git repo is the source of truth; a thin Google Sheet mirrors it as the input adapter n8n's native eval requires; the same CSV optionally feeds promptfoo in CI.
- **Box fact:** current box is Hetzner cx23, 2 vCPU / 4 GB; fine for n8n + Ollama embeddings. A small local guard model (1-3B) is tight but may fit; a generative ~32B or self-hosted Langfuse go on a separate/bigger box (trivial, infra is elastic).

## Minor open choice

- **Phase-3b candidate (optional):** (a) local 32B on an hourly GPU box (full sovereignty, most setup), (b) local 7-8B on the 16 GB CPU box (simplest, no GPU, weaker), or (c) open-weight 32B via Groq/DeepInfra (no hosting). The 16 GB main box runs the dauerbetrieb stack but NOT a 32B. Default: least-effort that still makes the point (b or c); a only for the full self-hosted-32B story. See Phase 3b.

## Prod-safety rule (applies throughout)

`file_support_request` (`3Mlx4jPSdle75zmW`) is the LIVE widget path. Build every change on a COPY / temp path, verify the contract is byte-equivalent, then cut over (mirror the Epic-20 parallel-build + cutover discipline; `DEPLOY-PORTFOLIO.md`). Keep the current version as rollback.

## Self-hosting ops (lightweight, but deliberate)

Verified box state (2026-05-30 via SSH): docker-compose stack (n8n + caddy + ollama), all `restart: unless-stopped` (good); Ollama NOT publicly exposed (no port mapping + firewall 22/80/443; `OLLAMA_HOST=0.0.0.0` is container-network only, fine); TLS via Caddy (good); only `nomic-embed-text` (274 MB) pulled; no swap; disk 21 GB free; images 13 GB.

**Box sizing (infra is elastic, swap anytime):**
- **Recommendation: move to a 16 GB box** (Hetzner cx42 x86, or cax31 ARM = cheaper) and run the whole stack on it: n8n + Ollama (embeddings + a small guard model) + self-hosted Langfuse. ~8 GB used, comfortable headroom, fewest moving parts for a solo builder.
- The Phase-3b ~32B eval stays a SEPARATE GPU box rented by the hour; do NOT put it on the main box (a 32B on CPU is unusably slow).
- Alternative if you prefer separation: 8 GB main box (cx32/cax21) + a separate small box for Langfuse.
- Add a 2-4 GB swap file as an OOM safety net (slow for inference, so a crash guard, not a perf tier).

**Gaps to close (each is also an "AI Trust / reliability" talking point):**
- **Backups:** the `n8n_data` volume holds workflows, credentials, execution history; add a scheduled off-box backup (extends the existing manual credential backup).
- **Pin image tags:** `n8nio/n8n:latest` and `ollama/ollama:latest` can pull breaking changes; pin versions.
- **Ollama `keep_alive`:** set a short `OLLAMA_KEEP_ALIVE` so the embedding model and the guard model are not both kept warm at once (RAM pressure), at the cost of a small reload latency.
- **Execution data pruning:** enable n8n `EXECUTIONS_DATA_PRUNE` so history does not grow unbounded.
- **Light infra monitoring (Telegram alerts):** a small bot that pings on OOM / container-down / low disk (the approach in Simon Hoiberg's 2026 self-hosted stack). Lightweight, no dashboards. Grafana + Prometheus is the optional richer upgrade if you want graphs. This is INFRA monitoring, distinct from the AI-observability in Phase 4 (Langfuse traces); both belong in the "works in production" story. Reference: `_resources/self-hosting-founder-stack-reference-2026-05-30.md`.
- Already fine, keep as-is: restart policies, Ollama not exposed, Caddy TLS.

## Phases (ordered, each independently shippable)

### Phase 1 — Deterministic formatter (small, clean)
Drafted in `formatter-deterministic-brainstorming.md`. Replace the 2nd Claude "Format response" call with a Code node parsing the agent's structured output. Foundational: later evals/metrics read a clean, deterministic contract.
- Effort: ~half day. Risk: low (copy first).

### Phase 2 — Lethal-trifecta hardening with the native Guardrails node (+ proof), local-first
- Input Guardrails node (`jailbreak` check) before the agent; on violation, short-circuit to a safe refusal + Slack audit. **The LLM-based checks (jailbreak/nsfw) run on a small LOCAL model (Ollama), not Cloud** — sovereign, zero per-check cost, and a legitimate local use (a narrow classification task a small model handles well).
- Output sanitize pass (`pii`, `secretKeys`) before anything leaves. (Pattern-based checks need no LLM at all.)
- Keep + document existing mitigations: MCP tools scoped to `issue_write`/`save_issue`, one-action cap, sandbox repo.
- Optional: a human-in-the-loop approval (n8n Wait/approval) gated only on the GitHub/Linear write.
- PROOF is the point: a small injection test set the guardrail blocks (and clean inputs pass), measured by the Phase-3 safety eval (closes the loop: local guardrail + eval that proves it works).
- Effort: ~1-1.5 days (incl. wiring a small local guard model). Risk: low-medium (test on copy).

### Phase 3 — Eval suite, n8n-native (the must-have, the CORE of the showcase)
The core is validating that the agent follows its OWN system-prompt rules and stays correct across changes. That is what n8n means by evals.
- **Golden dataset** (~50 cases): source of truth is a CSV/JSONL in the repo; mirrored into a thin Google Sheet for n8n's native eval. Build it to test the prompt's nuanced rules, especially the hard edges: "why is my automation red?" -> `question` not `bug`; "can Expliq do X?" -> `question` not `feature-request`; an automation Expliq flags "critical" -> NOT automatically `urgent`; strict groundedness ("answer ONLY from context, else the exact fallback"). Plus 5-10 adversarial/injection cases. Columns: message, expected_category, expected_action, expected_grounded.
- **Evaluation Trigger** over the sheet drives a copy of the workflow; **Check If Evaluating** SKIPS the real GitHub/Linear write in eval mode (assert intended tool + args instead of executing) so evals never create real issues.
- **Metrics** via Set Metrics (-> Evaluations tab): classification accuracy / macro-F1 (+ confusion matrix), tool-selection correctness, LLM-as-judge groundedness / hallucination rate, and a **safety score** (does the guardrail catch the injection cases from Phase 2). The safety metric is what ties Phase 2 and Phase 3 together.
- **Regression discipline:** re-run before/after any prompt or guardrail or formatter change; show the deltas. This is the loop, not a one-off test.
- **Optional code-side mirror:** the same CSV in promptfoo as a CI GitHub Action (shows code-side eval literacy alongside the n8n-native dogfood).
- Effort: ~1.5-2 days. Risk: low.

### Phase 3b — Model-comparison eval (Claude vs an open/local model) [OPTIONAL bonus]
Once the Phase-3 suite exists, this is nearly free: make the agent's chat-model a swappable sub-node (or keep an eval copy), run the SAME golden dataset with Claude (Lauf A) and an open/local model (Lauf B). Compare the Phase-3 metrics plus cost and latency. Output: a data-backed table and the conclusion ("Claude live because tool-correctness is X% higher; the open model is Y% cheaper"). The live path stays Claude. This demonstrates evals-driven model choice, not a prod switch.

**Three ways to run candidate B (the 16 GB main box does NOT run a 32B; that needs a GPU):**
- **a) Local 32B on an hourly GPU box** (RunPod/Vast, a few EUR for the run): best local candidate, full "self-hosted 32B" story. Most setup. ~20-24 GB VRAM at Q4.
- **b) Local 7-8B on the 16 GB CPU box itself**: no GPU, slow (~a few tok/s) but fine for a one-off offline eval; weaker candidate, simplest infra.
- **c) Open-weight 32B via Groq/DeepInfra** (pay-per-token): no self-hosting, minimal effort, "open vs closed" rather than "self-hosted vs cloud".
- For just showing the trade-off, b or c suffice; pick a only if you want the full self-hosted-32B narrative.
- Effort: ~half-1 day (b/c) to ~1 day (a, incl. GPU box). Risk: low (offline eval, no prod impact).

### Phase 4 — Observability (self-hosted Langfuse)
Self-hosted Langfuse on a separate/bigger box. Instrument the agent to emit traces (LLM call, tool calls, tokens, latency, cost per run, errors), grouped per session. One clean traced run + a dashboard view for the showcase.
- Effort: ~half-1 day. Risk: low.

### Phase 5 — Packaging the showcase
- 5-minute Loom: golden dataset -> native evals -> behaviour metrics -> injection blocked by the local guardrail -> a trace with cost/latency -> before/after of a change -> (optional) the Claude-vs-local table.
- GitHub README: architecture, the "why not multi-agent / why Claude for prod / what runs locally and why" judgment, dataset link, eval setup, guardrail proof, trace screenshot, one-page honest failure report.
- Workflow JSON export (credential refs only) committed, matching Epic-20 hygiene.
- Maps onto the application's "portfolio + optional Loom" ask and the two free-text blocks in `from-n8n/ashby-application-form.md`.

## What makes this senior (the narrative)

The story is judgment, not parts: "I had a working agentic support workflow; I researched making it local and multi-agent and deliberately did neither for the prod core, with reasons; instead I raised the floor on trust: evals that check my agent follows its own rules and gate every change, guardrails I can prove catch injections (running locally), traces that show cost and latency. Here is the lethal trifecta in my own system and exactly how I contained it. Sovereignty where it fits (self-hosted n8n, local embeddings, local guard checks); Claude where the task is hard." That is n8n's "knowing what belongs where", demonstrated with numbers.

## References

- Research: `_resources/ai-trust-evals-observability-guardrails-n8n-research-2026-05-30.md`, `_resources/multi-agent-orchestration-landscape-research-2026-05-30.md`, `_resources/local-llm-hosting-model-choice-agentic-n8n-research-2026-05-30.md`
- Vision + decisions: `local-agentic-multiagent-vision-brainstorming.md`
- Formatter: `formatter-deterministic-brainstorming.md`
- Application: `../../../per-paulsen-cv/applications/n8n-ai-product-builder/from-n8n/ashby-application-form.md` (AI Trust workstream, eval must-have, two free-text blocks)
- Live workflow: `file_support_request` (`3Mlx4jPSdle75zmW`); current box: Hetzner cx23, 2 vCPU / 4 GB, n8n 2.56.0
- Deploy discipline: `DEPLOY-PORTFOLIO.md`

## Changelog

- 2026-05-30 (initial): plan created from the three /explore reports.
- 2026-05-30 (revised, infra re-eval): infra recognized as elastic. Tracing -> self-hosted Langfuse. Local LLM added as eval candidate (Phase 3b). Multi-agent confirmed out (separate later project). Golden dataset source = CSV, Sheet as adapter.
- 2026-05-30 (revised, eval-focus + honest local): Phase 3 (behaviour eval against the agent's own prompt rules) is the CORE; Phase 3b (model comparison) demoted to OPTIONAL bonus. Local guardrail LLM checks fixed into Phase 2 (the genuine local use). Sovereignty story grounded in what really fits locally (self-hosted n8n + embeddings + guard checks), not a contrived swap. Safety eval added to Phase 3 to tie guardrails to evals.
- 2026-05-30 (ops): added Self-hosting ops section after an SSH box check. Already good: restart=unless-stopped, Ollama not exposed, Caddy TLS. Recommendation: 16 GB main box (cx42/cax31) for n8n + Ollama + Langfuse; 32B eval on a separate hourly GPU; + swap file. Gaps: backups, pin tags, keep_alive, execution pruning, light infra monitoring.
- 2026-05-30 (3b detail): Phase 3b candidate options spelled out (a: 32B on hourly GPU / b: 7-8B on the CPU box / c: open-weight 32B via Groq); clarified the 16 GB main box does not run a 32B (needs a GPU), so 3b is a deliberately separate, optional step.
