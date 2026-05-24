---
tags:
  - type/reference
  - status/done
---

# Automated PR Checks & AI Code Review — State of the Art (2026-05-24)

> Generated via /explore. 5 sub-questions investigated in parallel by Explore + claude-code-guide subagents.
> Context: solo dev / portfolio project (Next.js, TypeScript, Vitest). Code is implemented locally with Claude Code (`/dev` skill), then PRs are opened against `main` and "checked" on GitHub. Question: which checks belong on a PR, what role does an AI reviewer play, and does it make sense to have Claude review code that Claude wrote?

## Executive Summary

In 2026, AI PR review is **mainstream but additive** — it sits on top of, never replaces, deterministic CI (lint/test/build) and human judgment. Adoption is real (~44-47% of professional devs; GitHub Copilot review is now ~1 in 5 reviews on GitHub), yet every authoritative source frames the layering the same way: **deterministic checks are the hard gate, AI review is an asynchronous second opinion, the human is the director.** The single most decision-relevant finding for this setup: a **fresh-context** AI review of AI-written code is *not* redundant self-review — separating production and review into different contexts measurably catches more bugs (≈+4 F1 points / 15-25% more issues) because it removes the anchoring bias a model has toward its own output. So a GitHub-Actions Claude review of `/dev`-written code adds genuine value, *provided tests remain the real gate.* For a solo dev already on Claude, the cheapest high-signal stack is: **standard CI (eslint + vitest + next build) as the blocking gate + one AI reviewer as a non-blocking commenter.** The AI-reviewer choice is between Anthropic's own GitHub Action (free action, pay-per-token), Anthropic's newer hosted "Code Review" product (~$15-25/review), or a flat-rate dedicated tool (CodeRabbit ~$24/mo, Greptile ~$30/seat) — or simply GitHub Copilot's free 50 reviews/month.

## Sub-Topic 1: Is AI PR review the established standard, or still CI + human review?

**Verdict: AI review is widely adopted but explicitly *complementary*. Deterministic CI + human review remain table stakes.**

- Adoption climbed steeply: **47% of professional developers** used AI-assisted code review in the past year (Stack Overflow 2025), up from 22% in 2024. ~1.3M repositories use AI review (≈4x YoY). GitHub Copilot review alone is **~1 in 5 reviews on GitHub**, 60M+ reviews done, run by 12,000+ orgs on every PR.
- But trust lags adoption hard: **96% don't fully trust AI output** (SonarSource), only ~29% "trust" it (down 11pts YoY), and developers report spending *more* time reviewing AI code than writing it. CodeRabbit (Dec 2025) measured ~1.7× more defects in AI-coauthored PRs without new review patterns.
- Consensus framing is "**AI-augmented, not AI-automated**": deterministic linters/types/tests/build are non-negotiable outer constraints; AI handles the "grunt work" (syntax, common bugs, security patterns); humans own architecture, trade-offs, business logic.
- Measured upside when layered correctly: ~32% faster merges and ~28% fewer post-merge defects vs human-only review; two-pass AI+human cuts review cycle time 30-50%.

## Sub-Topic 2: AI review vs classic CI — replace or complement? Scope & limits

**Complement, with a clean division of labor.** Deterministic CI catches objectively verifiable, reproducible failures (lint, types, tests, build, secret scans) and is suitable as a *hard blocking gate*. AI review reasons about intent, logic, and context — and should run *non-blocking* (comments, not red X) because it is probabilistic.

**What AI review can/should check:**
- Correctness: null derefs, logic errors, missing error handling, edge cases (>90% on common patterns).
- Security: injection, authz/authn flaws, secret exposure, cross-file dataflow — AI is notably good at *context-dependent* vulns not yet codified as lint rules.
- Architecture & consistency with existing patterns; performance hot paths (N+1, complexity); test-coverage gaps; doc quality.

**Limits / failure modes (why it must stay non-blocking):**
- **False positives / noise:** Greptile ~22% FP in one benchmark (~11 per scan) vs CodeRabbit ~2 per scan. Rule of thumb: if you dismiss >20% of alerts, scope is too broad.
- **Hallucinated issues / fabricated APIs;** mitigated by RAG + AST validation in newer tools, not eliminated.
- **No runtime:** AI can't run the code — only tests/integration catch real runtime bugs. This is exactly why tests stay the gate.
- **Limited repo-wide context** without full indexing; weak on very long functions / large diffs (token limits).

**Config best practice:** exclude generated code/tests/vendor/auto-PRs; filter by path; set a confidence threshold (report ≥~75%); run deterministic checks blocking + AI enrichment async.

## Sub-Topic 3: Tool comparison (small Next.js/TS repo on GitHub)

| Tool | Pricing / free tier | Setup | Trigger | Output | Reputation |
|------|--------------------|-------|---------|--------|------------|
| **GitHub Copilot review** (native) | **Free: 50 reviews/mo**; Pro $10/mo unlimited | ~2 min (repo setting) | auto on PR / `@github-copilot` | inline + summary, Autofix (Pro+) | mainstream, no public benchmark; **from 2026-06-01 private-repo reviews burn Actions minutes + AI credits** |
| **claude-code-action** (`@v1`) | **Free action**; cost = Claude tokens (own `ANTHROPIC_API_KEY`, pay-as-you-go) | ~10-20 min (app + secret + YAML) | `@claude`, PR opened/synchronize, cron, dispatch | inline comments (via MCP) + summary | strong model reasoning; you control the prompt; cost scales with diff size |
| **Claude Code "Code Review"** (Anthropic hosted, research preview) | ~**$15-25/review** as usage credits (spend cap settable) | minimal (REVIEW.md + enable) | auto every PR / `@claude review` | severity-tagged 🔴/🟡/🟣 findings, check-run + file annotations | Anthropic's multi-agent fresh-context grader; <1% FP claimed |
| **CodeRabbit** | $24/mo Pro, $48 Pro+; **free summarization tier forever after 14-day trial** | ~5 min (GitHub App) | auto on PR/commits | inline w/ severity + summary + autofix | conservative, low FP (~2/scan), caught ~44% bugs in one independent test |
| **Greptile** | $30/seat/mo (50 reviews); OSS/startup discounts | ~10 min (needs indexing, 3-5 min) | auto on PR / `@greptile` | inline w/ full-codebase context | high catch (82% own benchmark) but higher FP (~11/scan) |
| **Vercel Agent** (beta) | **$0.30 + tokens/review** (~$0.50-2); Pro $100 promo credit | ~5 min (Vercel project) | auto on PR/commit / `@vercel` | inline w/ **sandbox-validated** fixes, click-to-apply | validates fixes against real build/test before posting; no independent benchmark yet |

**Solo-dev free picks:** GitHub Copilot Free (50/mo, zero setup) or CodeRabbit's permanent free tier. **"Already on Claude" pick:** claude-code-action with your own API key (~$5 for 50 reviews on a cheap model). Greptile = highest recall if you want depth and tolerate noise.

## Sub-Topic 4: How `anthropics/claude-code-action` works (+ the separate "Code Review" product)

Two distinct Anthropic offerings — don't conflate them:

**(A) `anthropics/claude-code-action@v1` (GA)** — a GitHub Action you wire yourself.
- **Setup:** `/install-github-app` in the CLI does app install + secret + workflow copy; or manual (install the `claude` GitHub App, add `ANTHROPIC_API_KEY` secret, copy `examples/claude.yml`). Needs Contents + Issues + PRs read/write.
- **Triggers:** `@claude` mention, `pull_request: [opened, synchronize]`, `schedule` cron, `workflow_dispatch`.
- **Output:** inline diff comments via MCP (`mcp__github_inline_comment__create_inline_comment`) **and/or** summary via `gh pr comment`. *(Resolves a contradiction between workers: the official repo confirms inline comments ARE supported in v1; the "posts to thread only" claim is pre-v1.)*
- **Config:** reads `CLAUDE.md`; `claude_args` passes `--model`, `--max-turns`, `--allowedTools`, `--append-system-prompt`; `prompt` can invoke a repo skill (`/skill-name`) — i.e. you could point it at a custom review skill.
- **Minimal review workflow:**
  ```yaml
  name: Claude Auto Review
  on:
    pull_request:
      types: [opened, synchronize]
  jobs:
    review:
      runs-on: ubuntu-latest
      permissions:
        contents: read
        pull-requests: write
      steps:
        - uses: actions/checkout@v4
        - uses: anthropics/claude-code-action@v1
          with:
            anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}
            prompt: "Review this PR for logic errors and security issues"
            claude_args: "--max-turns 5"
  ```

**(B) Claude Code "Code Review"** (research preview) — Anthropic-hosted, multi-agent, runs the fresh-context grader pattern automatically on every PR, posts severity-tagged findings, configured via a `REVIEW.md` (scope/severity/skip paths). Billed ~$15-25/review as usage credits (separate from plan-included usage; set a spend cap).

**Billing (the 2026-06-15 change):** before 2026-06-15 all Claude Code usage (incl. Actions) draws from the subscription's included pool; **after, GitHub Actions usage on subscription plans moves to a separate Agent SDK credit pool** (Pro $20 / Max5x $100 / Max20x $200 per month, no rollover, billed at full API list prices). **Using a direct `ANTHROPIC_API_KEY` (pay-as-you-go) is unaffected** and does not consume those credits — relevant for choosing how to authenticate the action.

## Sub-Topic 5: Does AI reviewing AI-written code add value? ("reviewt sich Claude selbst?")

**Yes — *fresh-context* review is not self-review, and it measurably helps.**

- Same-session self-review suffers anchoring/confirmation bias: the model defends its original choices. A **fresh context** (no memory of writing the code) reviewing only the output + rubric performs better: a 2026 "Cross-Context Review" study reports F1 28.6% (fresh) vs 24.6% (same-session self-review) vs 21.7% (repeated self-review). Practitioner accounts cite ~15-25% more bugs caught.
- This is exactly the pattern Anthropic's hosted Code Review implements (separate grader agent, fresh context, sees output not reasoning): internally <1% FP, ~7.5 actionable findings on 1000+ line diffs.
- **A different model family catches different failure modes** — so an independent reviewer (Greptile/CodeRabbit/Copilot using non-Claude models, or even Claude in fresh context) adds orthogonal coverage to `/dev`'s output.
- **What does NOT add value:** asking the same agent to review what it just wrote in-session; AI review *without* tests; AI-generated tests validating AI-generated code (tautological — they test what the code does, not what it should).

**Recommended solo-dev stack (when code is AI-written):**
1. **Spec first** — the spec is the source of truth (you already do this via `/spec` + epic files).
2. **Tests are the hard gate** — vitest in CI, blocking. Prefer behavior specs written *before/independently* of the implementation over post-hoc tautological tests.
3. **Independent AI review** — a *different context* (ideally different model) as a **non-blocking** PR commenter.
4. **10-min human spot-check** — scope → CI changes → duplicate utilities → critical paths → security boundaries → test evidence; run the feature for higher-stakes UI.

## Applied Recommendation for expliq-mvp

Given the repo (Next.js/TS/Vitest, has a GitHub remote at `Per-Paulsen/expliq-mvp`, code written via `/dev`, solo, portfolio/demo on Vercel):

- **Blocking gate = standard CI** (`.github/workflows/ci.yml`): `eslint`, `vitest run`, `next build`. Cheap, deterministic, free, catches the things AI review can't (runtime/build). This is the part that makes a PR "green or red."
- **Non-blocking AI reviewer:** one of —
  - **Cheapest to start & most aligned with your stack:** `anthropics/claude-code-action@v1` with your own `ANTHROPIC_API_KEY` (pay-as-you-go, unaffected by the 2026-06-15 credit-pool change), prompt scoped to "logic + security + spec-adherence." Fresh context ≠ self-review, so it's legitimate even though `/dev` wrote the code.
  - **Lowest-effort, zero-cost:** GitHub Copilot review (free 50/mo) — but note the 2026-06-01 Actions-minute billing change on private repos.
  - **Most independent signal:** a non-Claude tool (CodeRabbit free tier / Greptile) so the reviewing model differs from the authoring model.
- **Optional, complementary:** gitleaks secret-scan (already on the vault TODO) as a blocking CI step; Vercel preview deploy likely already runs per-PR.
- **`/dev` gap to close:** `/dev` currently implements + commits *locally*; to get PR-triggered checks you need a **push → open PR** step (extend the skill or do it manually). The checks only fire once a PR exists.

## Consolidated Sources

**Primary / official:**
- [Claude Code GitHub Actions — code.claude.com](https://code.claude.com/docs/en/github-actions)
- [Claude Code "Code Review" — code.claude.com](https://code.claude.com/docs/en/code-review)
- [anthropics/claude-code-action (repo)](https://github.com/anthropics/claude-code-action) · [solutions.md](https://github.com/anthropics/claude-code-action/blob/main/docs/solutions.md)
- [GitHub Octoverse 2025](https://github.blog/news-insights/octoverse/what-986-million-code-pushes-say-about-the-developer-workflow-in-2025/)
- [Stack Overflow Developer Survey 2025 — AI](https://survey.stackoverflow.co/2025/ai) · [Dec 2025 writeup](https://stackoverflow.blog/2025/12/29/developers-remain-willing-but-reluctant-to-use-ai-the-2025-developer-survey-results-are-here/)
- [2025 DORA Report](https://cloud.google.com/blog/products/ai-machine-learning/announcing-the-2025-dora-report)
- [JetBrains State of Developer Ecosystem 2025](https://devecosystem-2025.jetbrains.com/)
- [SonarSource State of Code 2026 (PDF)](https://www.sonarsource.com/state-of-code-developer-survey-report.pdf)
- [GitHub: 60M Copilot reviews](https://github.blog/ai-and-ml/github-copilot/60-million-copilot-code-reviews-and-counting/)
- [GitHub Copilot review billing change 2026-06-01](https://github.blog/changelog/2026-04-27-github-copilot-code-review-will-start-consuming-github-actions-minutes-on-june-1-2026/)
- [GitHub Copilot plans/pricing](https://github.com/features/copilot/plans)
- [CodeRabbit pricing](https://www.coderabbit.ai/pricing) · [Greptile pricing](https://www.greptile.com/pricing) · [Greptile benchmarks](https://www.greptile.com/benchmarks)
- [Vercel Agent PR review docs](https://vercel.com/docs/agent/pr-review) · [on-demand reviews changelog](https://vercel.com/changelog/on-demand-vercel-agent-code-reviews)
- [GitHub: Agent PRs — how to review them](https://github.blog/ai-and-ml/generative-ai/agent-pull-requests-are-everywhere-heres-how-to-review-them/)

**Research / analysis:**
- [Cross-Context Review (arXiv 2026)](https://arxiv.org/pdf/2603.12123)
- [LLM Critics Help Catch LLM Bugs (OpenAI, arXiv 2024)](https://arxiv.org/abs/2407.00215)
- [The Specification as Quality Gate (arXiv 2026)](https://arxiv.org/html/2603.25773)
- [Detecting/Correcting Hallucinations via AST (arXiv 2026)](https://arxiv.org/html/2601.19106v1)
- [Anthropic agent-based code review (InfoQ, Apr 2026)](https://www.infoq.com/news/2026/04/claude-code-review/)
- [Cloudflare: orchestrating AI code review at scale (2026)](https://blog.cloudflare.com/ai-code-review/)
- [Addy Osmani: my LLM coding workflow into 2026](https://addyosmani.com/blog/ai-coding-workflow/)
- [Agent SDK credits explainer (The New Stack)](https://thenewstack.io/anthropic-agent-sdk-credits/)
- [Greptile vs CodeRabbit](https://www.greptile.com/greptile-vs-coderabbit)
- [Qodo: best AI code review tools 2026](https://www.qodo.ai/blog/best-ai-code-review-tools-2026/) · [CodeAnt ranking](https://www.codeant.ai/blogs/best-ai-code-review-tools)
- [Graphite: AI review vs static analysis](https://graphite.com/guides/ai-code-review-vs-static-analysis)
- [State of AI Code Review 2026 (DEV)](https://dev.to/rahulxsingh/the-state-of-ai-code-review-in-2026-trends-tools-and-what-s-next-2gfh)

## Open Questions / Gaps

- **Exact 2026-06-15 Agent SDK credit-pool mechanics** (claim flow, refresh, overage) are from Anthropic's announcement + community interpretation, not yet fully in the official docs.
- **Vercel Agent** has no independent benchmark yet (beta) — sandbox-validated fixes are promising but unproven externally.
- Benchmark catch-rates (Greptile 82% / CodeRabbit 44%) are partly vendor-published; treat as directional, not absolute.
- No data specific to "reviewing Claude-`/dev` output with Claude-action" — the fresh-context findings generalize but aren't measured for this exact pairing.

## Revisit Triggers

- After **2026-06-15** (Agent SDK billing) and **2026-06-01** (Copilot Actions-minute billing) land — confirm real costs.
- When Claude Code "Code Review" leaves research preview (pricing/feature surface will firm up).
- When Vercel Agent exits beta or gets an independent benchmark.
- Every ~6 months — this tool category moves fast.
