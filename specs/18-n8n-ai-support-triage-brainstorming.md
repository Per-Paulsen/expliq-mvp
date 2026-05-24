---

## tags:

- type/spec
- status/brainstorming
- epic/18
- exercise/19

# 18 — n8n AI Support Triage — Brainstorming

> Upstream: [PRD 2.0](../prd-2.0.md) | [Design Guidelines](design-guidelines.md) | [DEPLOY-PORTFOLIO.md](../DEPLOY-PORTFOLIO.md)
> Origin: reactivation of `dl-ai-expliq` Exercise 19 — the original *suggested* pattern (chat/support widget → n8n → AI classify → action), which Per's R1 implementation deviated from (it built a governance-edit notifier on the now-defunct `feature/exercise-19-governance-notifier` branch).
> Goal context: portfolio artifact for an n8n **Product Builder** application — show a working `Trigger → AI reasoning → action` n8n workflow wired to the live Expliq demo.

## Context (what's already decided / constrained)

- **Outbound trigger only.** A visitor clicks a help/chat icon, types a message, clicks Send. Expliq issues a server-side `fetch()` POST to an n8n webhook. **No** schema migration, **no** pipeline change, **no** new Prisma model. This is what lets it run on the live **read-only** demo (daily 03:00 UTC fixture reset, no `ConnectorConfig`).
- **n8n workflow** (Webhook → Claude classify via OpenRouter → Switch → action) is built separately in the n8n UI. The repo-side deliverable is the Expliq widget + outbound hop + env wiring + a documented n8n workflow plan.
- **Deploy reality:** `main` = Vercel auto-deploy production (every push to main goes live). Work happens on a feature branch; Vercel env vars set before merge; merge to main only when ready + demo-mode-safe.
- **Design:** must follow [design-guidelines.md](design-guidelines.md) — light theme (#f5f5f7 bg, white cards, `rounded-xl`, `shadow-sm`), Plus Jakarta Sans (UI) / JetBrains Mono (numbers), teal `#0d9488` accent for CTAs/links. The guidelines define **no** chat-widget component yet → this is net-new UI vocabulary, styled consistent with the system.
- **Reference material:** old notifier `fetch()` + header-auth + arrow-sanitize pattern (`feature/exercise-19-governance-notifier:src/lib/actions/notify-governance-change.ts`); request-body + workflow plan in `dl-ai-expliq/exercise_19/answer_19.1.md` and `answer_19.2.md`.

---

## Open Questions — Round 1

Each question has a **Recommendation**. Reply inline (confirm / adjust) under each.

### A. Widget reach & visibility

Where does the chat/help widget appear, and for whom?

- **A1 — Mount location:** Global in the `(app)` layout (floating button, bottom-right, on every authenticated page: Dashboard, Process Map, Opportunities, Detail, Settings)? Or also on the public landing `(public)`?
  - *Recommendation:* `(app)` layout only (authenticated pages). The demo visitor auto-logs in and lands on `/dashboard`, so they'll see it. Keep landing clean.

ist die frage ernst gemeint? verstehe ich sie richtig? du fragst ob sich ein user erst einloggen muss um das chat widget zu sehen? natürlich!

- **A2 — Visibility gating:** Always-on (a real product feature), or only when `DEMO_MODE=true`?
  - *Recommendation:* **Always-on.** It's a genuine feature; demo visitors simply happen to be the ones triggering it. (No demo-only gating needed because it writes nothing to the DB.)
- **A3 — Context fields in payload:** Which context to attach beyond the message text?
  - *Recommendation:* `{ message, context: { pagePath, automationId? (when on /automations/[id]), workspaceId }, user: { email }, timestamp }`. `automationId` only present on the Detail route.

**Answer: as recommended**

### B. Round-trip vs fire-and-forget (biggest UX fork)

Does the widget **await** n8n's response and show the AI's classification + reply, or fire-and-forget with a simple "Sent ✓"?

- *Option B-sync:* Widget awaits. n8n's webhook runs in "respond when last node finishes" mode and returns `{ category, reply }`. Widget renders e.g. *"Routed as **Bug report** to the team — here's what happens next: …"*. **More impressive for an n8n demo** (visibly shows the AI reasoning result), and the round-trip is the showcase.
- *Option B-async:* Fire-and-forget. Widget shows "Sent ✓". n8n posts to Slack in the background. Simpler, but the visitor sees no AI output.
- *Recommendation:* **B-sync.** The synchronous round-trip is the demo's punchline and proves `Trigger → AI reasoning → action` end-to-end in the UI. Requires: widget states (idle / sending / answered / error) + the outbound hop to `await` and parse n8n's JSON response.

**Answer: as recommended**

### C. Outbound mechanism & secret handling

The webhook URL + shared secret must **never** ship in the client bundle, so the POST must go through a server-side hop.

- *Option C-route:* A Route Handler `src/app/api/support/route.ts` (POST). Client widget `fetch('/api/support', …)`; the route attaches the secret header and forwards to n8n. Must be added to the `middleware.ts` matcher exception list (like `/api/cron`) so Auth.js doesn't redirect it — **or** kept auth-protected since the demo user has a session.
- *Option C-action:* A Server Action (`"use server"`) called from the client component. Keeps the secret server-side, no new public route, no middleware change.
- *Recommendation:* **C-action** (Server Action) — fewer moving parts, no middleware edit, secret stays server-side, returns the n8n response object directly to the client for B-sync. Falls back gracefully (returns `{ error }`, never throws) per project server-action convention.

**Answer: as recommended**

### D. Classification taxonomy & downstream action

Shapes the payload contract + the documented n8n workflow plan (even though n8n is built separately).

- **D1 — Categories** the AI classifies into?
  - *Recommendation:* `bug` | `feature-request` | `question` | `urgent` (4-way). Mirrors the exercise's "AI Support Classifier" intent.
- **D2 — Downstream action** in n8n?
  - *Recommendation:* Switch on category → Slack post to a single channel (e.g. `#all-expliq-support`) with category-colored formatting (reuse the red/amber/teal/gray convention from the old governance workflow). `urgent` → red + @-mention; others → informational. Plus the `reply` returned to the widget (B-sync).
- **D3 — AI output schema** (what n8n's Claude step returns)?
  - *Recommendation:* `{ "category": "...", "headline": "...", "reply": "user-facing 1-2 sentence acknowledgement", "slackSummary": "internal 1-liner for the team" }`. `reply` → widget; `headline`+`slackSummary` → Slack.

**Answer: as recommended**

### E. Abuse guard for a public demo

The Server Action is callable by any demo visitor. DEPLOY-PORTFOLIO accepts "no Turnstile on signup" as a known gap.

- *Recommendation:* Lightweight guards only — **max message length** (e.g. 2000 chars, enforced server-side) + **trim/empty-reject**. Skip rate-limiting/Turnstile for v1 (consistent with the existing no-anti-bot stance; cost is bounded because the n8n+OpenRouter spend is on Per's side — *flag this as the one cost-exposure to watch*). Revisit if abused.

**Answer: as recommended**

### F. Scope boundary of "done"

- *Recommendation:* The **epic spec + `/dev` implementation** cover the Expliq side: widget UI, Server Action, env vars, tests, and a **documented n8n workflow plan** (in the spec, mirroring `answer_19.2`). The **actual n8n build** (importing/wiring the workflow in the n8n UI, OpenRouter node, Slack node) + **setting Vercel prod env vars** + **deploy** are operational steps tracked in the spec's acceptance criteria but performed by Per/operationally, not as repo code. Confirm this boundary.

**Answer: lets discuss this. this is more important for my application than you think. i really would like to "host my ownn8n server"? i think this is possible with n8n. and i would really like to use the n8n mcp for implementing the n8n wf. is this possible when "hosting my ownn8n server"? the setup of all of this should be part of the epic.** 

### G. Branch & housekeeping

- **G1 — Feature branch name:** *Recommendation:* `feature/epic-18-n8n-support-triage`.
- **G2 — Old branch:** retire/delete the stale `feature/exercise-19-governance-notifier` (local + origin) once we've lifted the reusable `fetch`/auth snippet, or keep it as reference?
  - *Recommendation:* Keep it untouched for now (it's harmless and documents the R1 approach); decide deletion after Epic 18 ships.

**Answer: as recommended**

### H. Anything I'm missing?

- Open floor: any constraint, story-beat for the n8n interview, or Expliq-product angle that should shape the spec?

**Answer: s. F.**

---

## Round 2 — Self-hosted n8n + n8n-MCP (triggered by answer F)

### Acknowledged from Round 1

- **A1** — Confirmed, app-only (authenticated). The question was about *mount scope* (which route group), not about login; agreed it's obvious — widget lives in the `(app)` layout, after auth. Noted.
- **A2, A3, B, C, D, E, G** — all "as recommended", locked in.

### Factual answers to F

1. **Self-hosting your own n8n server — yes.** n8n is fair-code and self-hostable via Docker (standard). The only hard requirement *for the live demo* is that the instance is **publicly reachable over HTTPS**, because the deployed Expliq (Vercel prod) POSTs to its webhook. Local Docker alone is not reachable from Vercel without a tunnel.
2. **n8n-MCP — yes, and it pairs naturally with self-hosting.** `czlonkowski/n8n-mcp` is an MCP server for Claude Code that (a) exposes deep node documentation and (b) **creates/updates/validates workflows directly in your n8n instance** via the n8n public API. It needs `N8N_API_URL` + `N8N_API_KEY`. Self-hosting gives you both with full access (n8n Cloud gates the API on paid tiers). So: **self-host → get API key → wire n8n-MCP → have Claude Code build the workflow via MCP.** Building the workflow *through the MCP with an AI agent* is itself a strong Product-Builder talking point.

### What this does to the epic — two tracks

The epic is no longer "Expliq code + a documented n8n plan." It becomes:

- **Track 1 — Expliq repo code** (unchanged from Round 1): chat widget, Server Action, env vars, tests.
- **Track 2 — n8n infra + workflow** (now IN scope, not just documented):
  1. Provision a publicly-reachable self-hosted n8n instance.
  2. Wire `czlonkowski/n8n-mcp` into Claude Code (`.mcp.json`, repo already has one) pointed at that instance.
  3. Build the support-triage workflow (Webhook → Claude/OpenRouter classify → Switch → Slack + Respond-to-Webhook) **via the MCP**.
  4. Export the workflow JSON and commit it for reproducibility.

**New dependency / sequencing:** Track 2 must produce the webhook URL + shared secret **before** Track 1's `N8N_SUPPORT_WEBHOOK_URL` can point at it and before any end-to-end test. So infra-first, then code wiring.

### Open Questions — Round 2

#### F2-1. Hosting target (the crux — needs your call on cost vs. effort vs. signal)


| Option                                           | Effort     | Cost                                                   | Public HTTPS                | Self-host signal                 | Demo reliability                       |
| ------------------------------------------------ | ---------- | ------------------------------------------------------ | --------------------------- | -------------------------------- | -------------------------------------- |
| **a) Railway / Render one-click**                | ~5–15 min  | free tier → low; Render free tier sleeps (cold starts) | yes                         | medium ("deployed a container")  | good (paid) / mediocre (free, sleeps)  |
| **b) Hetzner VPS + Docker Compose + Caddy**      | ~30–60 min | ~€5/mo                                                 | yes (Caddy + Let's Encrypt) | **highest** ("I run my own box") | best (always-on)                       |
| **c) Local Docker + tunnel (cloudflared/ngrok)** | ~15 min    | free                                                   | only while tunnel up        | low                              | poor — breaks when your machine sleeps |


- *Recommendation:* **(b) Hetzner** if you want the strongest "I self-host n8n" story for an n8n interview and an always-on demo, accepting ~€5/mo + a one-time setup. **(a) Railway** if you'd rather avoid server admin and want it live in minutes (use a paid hobby tier so it doesn't sleep). I'd avoid (c) for anything you demo live.
- **Your pick (a / b / c)?**

**Answer: as recommended**

#### F2-2. n8n-MCP wiring details

- *Recommendation:* Add `czlonkowski/n8n-mcp` to the repo `.mcp.json` in **workflow-management mode** (`N8N_API_URL`, `N8N_API_KEY`, plus its own auth token). Secrets stay in a gitignored env (the API key must NOT be committed). We build + iterate the workflow through Claude Code via this MCP.
- Confirm: build the workflow **via the MCP** (recommended, great talking point) vs. hand-build in the n8n UI and only use the MCP for node docs?

**Answer: as recommended**

#### F2-3. Reproducibility / where the n8n side is documented

- *Recommendation:* Commit (1) the **exported workflow JSON** (e.g. `n8n/support-triage.workflow.json`) and (2) a **setup runbook** (host provisioning, env vars, MCP config, how to re-import) — either as a section in the spec or a sibling `specs/18-...-runbook.md`. This makes the n8n side portable + reviewable, mirroring how `dl-ai-expliq/exercise_19` documented it.
- Prefer the runbook as a separate doc, or folded into the epic spec?

**Answer: as recommended**

#### F2-4. Secrets & cost exposure (flagging, not blocking)

The hosted n8n will hold an **OpenRouter key** (Claude classify node) + **Slack credentials**. The **n8n API key** lives in local `.mcp.json` env (gitignored). The **webhook URL + secret** go into Vercel prod env. Recurring cost = host (~€5/mo Hetzner, or Railway usage) + OpenRouter spend per demo message (bounded only by message volume; see E — no rate limit in v1).

- Confirm this cost/secret footprint is acceptable, or do you want a rate-limit/kill-switch in v1 after all?

**Answer: as recommended ie acceptable**

#### F2-5. Phasing for `/dev`

- *Recommendation:* Sequence as: **Phase 0** provision n8n + wire MCP → **Phase 1** build + export workflow via MCP → **Phase 2** Expliq widget + Server Action + env (point at the live webhook) → **Phase 3** end-to-end test on a preview deploy → **Phase 4** merge to `main` (goes live) + set Vercel prod env. Confirm or reorder.

**Answer: as recommended**

### References

- n8n-MCP: [https://github.com/czlonkowski/n8n-mcp](https://github.com/czlonkowski/n8n-mcp) (+ `docs/N8N_DEPLOYMENT.md`)
- n8n self-host on Hetzner (official): [https://docs.n8n.io/hosting/installation/server-setups/hetzner/](https://docs.n8n.io/hosting/installation/server-setups/hetzner/)
- n8n on Render (Docker): [https://render.com/deploy-docker/n8n](https://render.com/deploy-docker/n8n)

---

## Round 3 — Refinement Review (/refine)

All Round 1 + Round 2 answers are resolved ("as recommended"); nothing from you is left open to debate. The substance below is the **proactive review**: two parallel investigators verified the spec's assumptions against the actual codebase + Claude Code docs. Findings grouped by issue type, each with a recommendation. Confirm or push back per item; on confirmation I apply them to the spec in Phase 2.

### Investigation summary

- **Track 1 (Expliq code):** server-action convention, OpenRouter default, widget mount, and Vitest scaffolds all CONFIRMED against real source. One real MISMATCH (session email). 
- **Track 2 (config/integration):** middleware claim and gitignore handling CONFIRMED. One CRITICAL MCP-config nuance, one naming inconsistency, DEPLOY-PORTFOLIO sections pinpointed.

### Flagged: ungrounded assumptions (must fix)

**R3-1. `user.email` is NOT on the session.** `src/lib/auth.ts` session callback sets only `session.user.id` and `session.user.workspaceId` (lines ~45–48), not `email`. The spec's payload (AC14) includes `user.email`, so `sendSupportMessage` can't read it off the session as implied.

- *Recommendation:* fetch it in the action via `prisma.user.findUnique({ where: { id: session.user.id }, select: { email: true } })` (exactly what the old notifier did). Avoid modifying the global auth session callback just for this. Update Scope + AC14 to state email is fetched, not read from session.
- **Confirm? yes**

**R3-2. `.mcp.json` `${ENV_VAR}` expansion does NOT work for HTTP-server headers** (Claude Code issues #51581, #3239, #9427). It DOES work in the `env` block of a **stdio** server. AC2 as written ("reference `${N8N_API_KEY}`") is only achievable if we run n8n-MCP as a **stdio** server (npx or docker) and put `N8N_API_URL` / `N8N_API_KEY` in its `env` block — not as an HTTP server with the key in a header.

- *Recommendation:* pin the spec to **stdio transport** for n8n-MCP, key in the `env` block via `${N8N_API_KEY}`, expanded from the shell environment (documented in the runbook; the value lives in gitignored `.env` and must be present in the env Claude Code runs in). Rewrite AC2 + the MCP-wiring scope to specify stdio + env block. This keeps the committed `.mcp.json` secret-free as intended.
- **Confirm? i dont know what that means**

### Flagged: inconsistent domain language

**R3-3. Env-var naming.** Old notifier: `..._WEBHOOK_SECRET_NAME` (the header name) + `..._WEBHOOK_SECRET` (value). New spec: `..._WEBHOOK_SECRET_HEADER` + `..._WEBHOOK_SECRET`. The header-name-as-env-var indirection adds config for no clear benefit.

- *Recommendation:* drop the header-name env var entirely; **hardcode the header `x-webhook-secret*`* in the action. Config shrinks to `N8N_SUPPORT_WEBHOOK_URL` + `N8N_SUPPORT_WEBHOOK_SECRET`. Update Scope "Config" + `.env.example` AC.
- **Confirm? yes**

### Flagged: hidden scope creep (small, worth naming)

**R3-4. Net-new client component.** The widget can't live inline in the async server `(app)/layout.tsx`; it needs a separate `"use client"` file (e.g. `src/components/support-widget.tsx`) imported into the layout. Fixed-position is unaffected by the layout's `overflow-x-hidden` (position:fixed is viewport-relative). Minor, but the spec should name the new component file so `/dev` doesn't treat the layout as the only touch.

- *Recommendation:* add `src/components/support-widget.tsx` to Scope explicitly. **Confirm? yes**

**R3-5. Fetch-mock test scaffolding is net-new.** Existing tests mock Prisma and `next-auth/react`, and `getRequiredSession()` mocking exists (connector-actions tests), but **no test currently mocks global `fetch`**. ACs 19–23 require it (achievable via `vi.stubGlobal("fetch", vi.fn())`, standard). Not a blocker, just unbudgeted.

- *Recommendation:* note in the spec that the support-action tests introduce a `fetch` stub pattern. **Confirm (informational)? yes**

### Flagged: untestable / manual-verification ACs (label them as such)

**R3-6.** ACs 1, 5, 6, 17, 18 (n8n reachable over HTTPS; AI returns valid JSON; Slack post; end-to-end reply on preview; production flow) are **integration / manual** checks, not unit-testable. That's inherent to the infra track, but the spec currently lists them alongside unit ACs without distinction.

- *Recommendation:* split the Acceptance Criteria into "Automated (Vitest)" vs "Manual / integration verification" so done-ness is honest. **Confirm? yes**

**R3-7. AC11 ("no secret in client bundle") needs a concrete check.** As written it's a claim, not a verification.

- *Recommendation:* restate as structural: the secret is read only inside the `"use server"` action and never imported into a `"use client"` module (verifiable by inspection / a grep that the env var name appears only in server files). **Confirm? yes**

### Flagged: oversized slice / phasing reality (decision)

**R3-8. Phases 0–1 are not `/dev`-automatable.** Provisioning a Hetzner box, DNS, Caddy/HTTPS, n8n env, Slack + OpenRouter credentials in n8n, and building the workflow through the MCP are **interactive ops + MCP work you and I do together**, not something the `/dev` team-delegation flow runs autonomously. Track 1 (Phases 2–4: widget, action, tests, deploy) IS a clean `/dev` slice.

- *Recommendation:* treat the epic as **two delivery units**: (i) Phases 0–1 done interactively (guided by the runbook, MCP-driven), (ii) Phases 2–4 via `/dev` on `feature/epic-18-n8n-support-triage`. Also: the operational prerequisites (Slack workspace + channel, an n8n subdomain) are **hard blockers** for Phase 0 — keep them as Open Questions until you have them. **Confirm the split? yes**

### DEPLOY-PORTFOLIO update (confirming AC26 specifics)

**R3-9.** Stale note confirmed at `DEPLOY-PORTFOLIO.md` lines 54–55 ("manual `vercel --prod`… auto-deploy-on-push state is unknown"). We verified deploys ARE GitHub auto-deploy from `main`. Sections to update: env-var state (lines ~25–29, add the new `N8N_SUPPORT_`* vars), Touchpoints (lines ~120–129, add an outbound-integration entry), and correct the stale note to "auto-deploy from main, confirmed". No change needed to the recommendation; just confirming the edit targets. **Confirm? yes**

### Proposed spec changes on confirmation (Phase 2 preview)

1. AC14 + Scope: email fetched via Prisma, not read from session (R3-1).
2. AC2 + MCP scope: n8n-MCP as **stdio** server, key in `env` block (R3-2).
3. Config + `.env.example` AC: drop header-name env var, hardcode `x-webhook-secret` (R3-3).
4. Scope: name `src/components/support-widget.tsx` (R3-4); note new `fetch` stub in tests (R3-5).
5. Split ACs into Automated vs Manual/integration (R3-6); restate AC11 structurally (R3-7).
6. Phasing note: Phases 0–1 interactive, 2–4 via `/dev`; keep Slack + subdomain as blocking Open Questions (R3-8).
7. Tighten AC26 wording to the confirmed sections (R3-9).

Reply under any item to adjust, or say "apply all" and I'll update the spec.

ich habe mal ein paar grds fragen, die ich gerne hier noch klären würde:  

1. wir verwenden jetzt n8n für dieses chat widget. ist ja klar, das ist ja sinn der aufgabe. aber könnten wir das nicht theoretisch genau so gut selbst bauen? wäre das nicht sogar leichter? dann hätten wir nicht diese server, mcp, api aufwand?
2. was ist übrehaupt der vorteil von n8n gegenüber selber bauen?
3. weißt du überhaupt die state of the art best practices für chat widget funktionalitä und aussehen?
4. wie connected sich epiq überhaupt mit n8n? also wie sendet der trigger bzw das chat widget an n8n? an die n8n api oder mcp und wie machen wir das überahupt? mit dem sdk? ist das dann auch an die api? ist sdk immer an api? ist mcp auch immer an api? was ist der unterschied zwischen api, mcp und sdk? gibt es noch weiter optionen?

du kannst gerne den explore skill zur beantwort der (jeweiligen) fragen verwenden ...

---

## Round 4 — Foundational Questions (answered)

R3 status: R3-1, R3-3, R3-4, R3-5, R3-6, R3-7, R3-8, R3-9 all confirmed "yes". R3-2 explained below; please re-confirm once it makes sense.

### R3-2 explained plainly (stdio vs HTTP for the MCP)

An MCP server is just a helper program that Claude Code talks to so it can "use a tool" (here: manage your n8n). There are two ways Claude Code can connect to it:

- **stdio** ("standard in/out"): Claude Code **starts the helper itself** as a local program (via `npx` or a local Docker container) and talks to it through the program's input/output pipes. In `.mcp.json` you give a `command` + `args` + an `env` block. Crucially, `${VAR}` placeholders **in the `env` block DO get filled in** from your environment. So the committed `.mcp.json` stays secret-free.
- **HTTP**: the helper runs somewhere as a web service and Claude Code connects to it over a URL with auth headers. The bug is: `${VAR}` placeholders in the **headers** are NOT filled in right now, so you'd be tempted to paste the real key into the committed file. Bad.

So "use stdio" just means: configure n8n-MCP as the locally-launched variant. Concretely, `.mcp.json` gets something like:

```jsonc
{
  "mcpServers": {
    "figma": { "type": "http", "url": "https://mcp.figma.com/mcp" },
    "n8n": {
      "command": "npx",
      "args": ["n8n-mcp"],
      "env": {
        "N8N_API_URL": "${N8N_API_URL}",
        "N8N_API_KEY": "${N8N_API_KEY}"
      }
    }
  }
}
```

The real values live in your gitignored `.env` and must be present in the shell environment Claude Code runs in (the runbook will spell this out). Nothing secret is committed. **Re-confirm stdio? (recommended) confirm**

---

### Q1. Couldn't we just build the chat widget ourselves? Wouldn't that be easier (no server/MCP/API)?

**Honest answer: yes, for the product alone, self-building is easier.** Expliq already has everything needed: a server action could call OpenRouter directly (the project does this in `src/lib/llm-pipeline.ts`) to classify the message, then POST to a Slack incoming webhook. No n8n server, no MCP, no API key management, no €5/mo host. For a single "classify a message and ping Slack" feature, self-build is genuinely the leaner path.

**But that misses the point of this specific exercise.** The deliverable's value here is not "a support widget exists." It is **"I can build with n8n"** for a Product Builder application at n8n. Self-building the logic in Expliq would produce a working feature that demonstrates *nothing about n8n*. The infra overhead (self-host, MCP-built workflow, AI node, Slack node) IS the portfolio artifact.

So: if this were a normal product feature, I'd argue for self-build. Because the goal is the n8n application, the n8n route is correct despite being more work. Keep the n8n path. (If you ever ship this as a real Expliq feature later, you could swap the n8n hop for an in-app implementation without touching the widget.)

### Q2. What is the actual advantage of n8n over building it yourself?

n8n earns its keep as automations multiply and as non-engineers need to own them. Concretely:

- **Visual + low-code:** the flow is readable and editable without code; fast iteration; a non-dev (ops, support lead) can change routing or wording.
- **~1000+ integrations as ready-made nodes:** Slack, email, CRMs, databases, ticketing, etc. You don't write or maintain each API client.
- **Built-in plumbing for free:** retries, error branches, scheduling, queueing, per-execution logs/observability, credential storage, Switch/branch logic. In a self-build you write and maintain all of that yourself.
- **Decoupling:** the workflow lives outside the app. You can change destinations (Slack to Teams to a ticket system) or add steps **without redeploying Expliq**.
- **Reuse + fan-out:** one webhook can trigger many actions; workflows are versioned and shareable.

**When self-build wins:** very simple single-purpose logic, tight latency budgets, you already have the SDK in-app, you want zero extra infra/cost, or you want everything testable inside your own codebase.

For *this one* use case (one webhook, one classify, one Slack post), the scales tip toward self-build on pure engineering grounds. n8n's advantage shows the moment there are five such automations and someone who isn't you wants to edit them. That "platform for many automations owned by many people" story is exactly what you'd articulate in the interview.

### Q3. State-of-the-art chat-widget best practices (functionality + appearance)

Researched (2026 sources below). The current consensus, mapped to our design system:

**Launcher (the floating button)**

- Bottom-right corner, with offset so it doesn't collide with other corner UI. Circle or rounded-square, 56–60px. Our accent teal `#0d9488`, white icon.
- A short text label ("Help" / "Chat with us") next to or in the button measurably increases engagement over a bare icon.
- Pointer target at least **24x24 CSS px** (WCAG 2.2 target size).

**Open/close + focus (accessibility, WCAG 2.2)**

- The panel is a modal dialog: `role="dialog"` + `aria-modal="true"` + `aria-labelledby`. Prefer the **native `<dialog>` with `showModal()`** where feasible (it gives focus-trapping and Escape for free), or use the `inert` attribute on background content.
- On open, **move focus to the message input**; on close, **return focus to the launcher**. **Trap focus** inside the panel (Tab/Shift+Tab cycle within). **Escape closes.**
- Ensure the focused control is never hidden behind the launcher/sticky footer (WCAG 2.2 "Focus Not Obscured").

**Input + send**

- Multiline textarea. **Enter sends, Shift+Enter = newline.** Send is also a real focusable button with an accessible name ("Send message") and a visible focus ring.
- Since we cap at 2000 chars (E), show a **character counter as you approach the limit** and disable Send when empty/over-limit.

**States + feedback (this is the B-sync showcase)**

- idle -> sending (show a typing/loading indicator) -> answered (render category + reply) -> error (plain-language message + retry). Keep animations subtle and **respect `prefers-reduced-motion`**.

**Responsive**

- Under **768px**, the panel goes **full-screen** (like WhatsApp/iMessage) instead of a small floating card.

**Proposed spec impact:** add a short "Widget UX & accessibility" acceptance block capturing: 24px+ launcher with label; `role=dialog`/`aria-modal` (or native `<dialog>`); focus move-in/return + trap + Escape; Enter-to-send / Shift+Enter newline; accessible Send name; char counter near the 2000 limit; mobile full-screen <768px; reduced-motion. **Add these ACs? (recommended) yes**

### Q4. How does Expliq actually connect to n8n? And what's the difference between API, MCP, SDK (and other options)?

The key insight that dissolves most of the confusion: **there are two completely separate connections here, at two different times.**


|                    | Connection 1 — RUNTIME                                 | Connection 2 — BUILD-TIME                          |
| ------------------ | ------------------------------------------------------ | -------------------------------------------------- |
| Who talks          | Expliq (server action) -> n8n                          | Claude Code -> n8n                                 |
| When               | Every time a visitor sends a chat message              | Only while we create/edit the workflow             |
| How                | **Webhook**: a plain HTTPS `POST` to n8n's webhook URL | **n8n-MCP** -> (under the hood) n8n's **REST API** |
| In the product?    | Yes, this is the live feature                          | No, it's a dev-time authoring tool                 |
| Needs the API key? | No (just the webhook URL + shared secret header)       | Yes (`N8N_API_KEY`)                                |


So at runtime, Expliq connects to n8n **via a webhook (HTTP POST), using raw `fetch`** — no SDK, no MCP, no management API. The webhook *is* n8n's inbound trigger.

Now the vocabulary, precisely:

- **API (Application Programming Interface):** the contract a service exposes so other software can use it. n8n exposes two HTTP APIs: a **REST API** (manage workflows: create/list/update) and **webhook endpoints** (trigger a workflow). "API" is the umbrella term; here it's HTTP under the hood.
- **Webhook:** a specific *kind* of API endpoint that is **inbound and event-triggered** — you POST to a URL and a workflow runs. This is Connection 1.
- **SDK (Software Development Kit):** a language library that **wraps an API** so you call functions instead of writing raw HTTP. Example already in this repo: the `openai` SDK wraps the OpenRouter HTTP API (`src/lib/llm-pipeline.ts`). You never *need* an SDK — raw `fetch` against the API works (our webhook call uses exactly that). So: **SDK -> calls -> API.** Effectively an SDK is always a convenience layer over some API/protocol.
- **MCP (Model Context Protocol):** a standard that lets an **AI agent** (Claude Code) discover and call "tools" from an MCP server. The MCP server internally usually calls an API/SDK to do the real work. So **MCP -> (server) -> API.** MCP is the *agent-facing* layer; it is not how your app talks to services at runtime. This is Connection 2.

**Relationship in one line:** API is the foundation; an **SDK** is a developer-friendly wrapper over an API; an **MCP server** is an AI-agent-friendly wrapper that itself fronts an API/SDK; a **webhook** is an inbound, event-triggered API endpoint. SDK and MCP both ultimately bottom out at an API.

**Other options for app -> n8n at runtime (not needed here):** calling n8n's REST API to start an execution directly; n8n's own *MCP trigger* node (expose n8n as an MCP server to an AI agent); a message queue or polling. For our case the **webhook is the canonical, simplest, correct choice**, which is why the spec uses it.

wait! could you please explain these to me in more detail. they sound interesting.   

### Sources (Q3)

- [Chatbot UI Design Best Practices 2026 (Conferbot)](https://www.conferbot.com/blog/chatbot-ui-design-best-practices)
- [Chat UI Design 2026 (UXPin)](https://www.uxpin.com/studio/blog/chat-user-interface-design/)
- [Dialog (Modal) Pattern — W3C ARIA APG](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/)
- [Accessible Modals with Focus Traps 2026 (UXPin)](https://www.uxpin.com/studio/blog/how-to-build-accessible-modals-with-focus-traps/)
- [How to build an accessible chatbot (Make Things Accessible)](https://www.makethingsaccessible.com/guides/how-to-build-an-accessible-chatbot/)
- [Zendesk web widget launcher options 2026 (eesel)](https://www.eesel.ai/blog/zendesk-web-widget-launcher-options)

---

**Two confirmations to apply Phase 2:** (a) re-confirm R3-2 stdio now that it's explained, (b) add the Q3 widget-UX/a11y ACs? Then say "apply all" and I update the spec.

---

## Round 5 — The "other options" for app -> n8n, in detail (Q4 follow-up)

You asked about the alternatives I listed. Verified against n8n docs (sources below). One correction to what I wrote first, then each option.

**Correction to my Q4 note:** I implied you could "call n8n's REST API to start an execution directly" as if it could carry our message. Not quite: n8n's REST `/run` endpoint does **not accept custom input data**. So it cannot carry the chat-message payload. For anything with runtime parameters, the webhook is the correct abstraction. Keep that straight (interview-relevant).

### Option 1 — n8n public REST API execute endpoint

- **What it is:** a management API (`/api/v1/...`), protected by your `N8N_API_KEY`, for CRUD on workflows, activating/deactivating, listing executions, etc. It includes a way to run a workflow, but the run endpoint takes **no custom input payload**.
- **When you'd use it:** trigger a workflow from a *privileged backend* when you do NOT want a public webhook URL and you do NOT need to pass runtime data (e.g. "kick off the nightly cleanup workflow now").
- **Why not for us:** we must pass the visitor's message + context. No payload = no fit. (Also it would force the API key into the request path; the webhook needs only a shared-secret header.)

### Option 2 — n8n's native MCP nodes (a different axis entirely)

This is where the word "MCP" gets overloaded. There are **three distinct MCP things** in play; keep them separate (good interview clarity):


| MCP thing                                  | What it is                                                                                                                                                                 | When                   | Used here?        |
| ------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------- | ----------------- |
| `**czlonkowski/n8n-mcp`** (third-party)    | An MCP server *you* run so Claude Code can **build** n8n workflows. Wraps n8n's REST **management** API.                                                                   | Build-time (authoring) | **Yes** (Track 2) |
| **n8n "MCP Server Trigger" node** (native) | Turns an n8n workflow **into** an MCP server: exposes its tool nodes over a URL (SSE / streamable HTTP, optional auth) so an AI agent (Claude, etc.) can list + call them. | Runtime, in-workflow   | No                |
| **n8n "MCP Client Tool" node** (native)    | The reverse: lets an n8n **AI Agent** node **consume** tools from an external MCP server.                                                                                  | Runtime, in-workflow   | No                |


- **Why interesting:** n8n is positioning itself in the MCP ecosystem as both a **provider** of tools (Server Trigger) and a **consumer** (Client Tool). That is a strong "n8n as an AI tool hub" story for a Product Builder conversation.
- **Why not for us:** our trigger is a human clicking Send in a web app, not an AI agent invoking a tool. The plain webhook is the right door. The MCP nodes would be the right door if, say, you wanted Claude itself to call "expliq-support-triage" as a tool.

this sounds very interesting and advanced. ie. the **MCP Server Trigger and the MCP client tool** that could be a nice differentiator if i could implement sth myself. is there any thinkable expliq use case for this or a different use case beside from expliq?

### Option 3 — Message queue or polling

- **Queue:** Expliq publishes an event to a broker (Redis / RabbitMQ / SQS / Kafka); n8n consumes it. Decouples sender from receiver, buffers bursts, survives n8n downtime.
- **Polling:** n8n checks a source (DB, API) on a Schedule trigger and processes new rows/items. Good when the source can't push.
- **Why not for us:** both are **asynchronous**, which would break the B-sync round-trip (the widget needs the AI reply back in one request). And the volume is tiny. A queue is the answer at high scale or when delivery must survive outages, neither of which applies to a demo.

### Bonus (directly relevant to our E / abuse guard)

n8n docs are explicit: **every call to an active production webhook counts as an n8n execution**, and if the URL leaks while connected to a paid AI step, someone can rack up cost. Their guidance: *treat production webhook URLs like API keys* (don't commit them, don't paste them in Slack, always require auth). This validates our decisions: shared-secret header (C/D), webhook URL only in Vercel prod env (not committed), and the cost-exposure note in E. It is also a fair argument to revisit a basic rate-limit later.

### Sources (Round 5)

- [n8n REST API: Trigger Workflows Programmatically (Markaicode)](https://markaicode.com/n8n-rest-api-trigger-workflows/)
- [Webhook node documentation (n8n Docs)](https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.webhook/)
- [MCP Server Trigger node (n8n Docs)](https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-langchain.mcptrigger/)
- [MCP Client Tool node (n8n Docs)](https://docs.n8n.io/integrations/builtin/cluster-nodes/sub-nodes/n8n-nodes-langchain.toolmcp/)

---

These options are background/interview context; none change the spec (webhook stays the runtime choice). Both Phase-2 confirmations are now in (stdio: confirm, Q3 ACs: yes). Say **"apply all"** when you're ready and I'll update `specs/18-n8n-ai-support-triage.md`, or keep asking here.

a further question:

when the user asks the chat widget a question, does he get back an answer? and with answer i do not mean sth like the simple classification, but a real answer to his question? how does that work? then the llm would need the context or not?

---

## Round 6 — Two follow-ups (MCP nodes use cases; "real answers" + context)

### Re: MCP Server Trigger / MCP Client Tool — is there an Expliq (or other) use case?

Yes, and one of them is a genuine, on-theme differentiator. Keeping the three "MCP things" separate (see Round 5 table):

**MCP Server Trigger (expose an n8n workflow AS tools to an AI agent):**

- *Expliq use case:* wrap Expliq's own data/actions as agent-callable tools, e.g. `get_riskiest_automations`, `explain_automation(id)`, `deploy_recommendation(id)`, `re_sync_n8n`. Then Claude Desktop (or an in-app assistant) can *talk to your automation landscape*: "Which automations are critical and why?" -> the agent calls the tool -> Expliq answers. Story: "Expliq as an MCP provider, so any AI agent can reason over your n8n estate."
- *Caveat:* Expliq already owns this data, so you could expose MCP directly from the app too. n8n's Server Trigger shines when a non-dev composes *which* tools are exposed, or combines Expliq with other services in one MCP endpoint.

**MCP Client Tool (an n8n AI Agent CONSUMES external MCP servers):**

- *This is the exciting one, and it extends THIS epic.* Instead of `Switch -> Slack`, the triage workflow could use an **AI Agent node** that, depending on the message, calls MCP tools to *act*: a GitHub MCP to open an issue for a `bug`, a Linear/Jira MCP to file a `feature-request`, a docs MCP to answer a `question`. That turns "classify + notify" into **agentic triage that takes the next action**. Very strong Product-Builder signal.

i want this one!

- *Non-Expliq use cases:* an "ops agent" workflow that orchestrates across many MCP-exposed SaaS tools (HR, finance, calendar); a research agent that pulls from several MCP data sources.

**My honest steer:** these are advanced and impressive, but they add scope + moving parts. For the job deadline, keep the **plain webhook flow as the reliable spine**, and hold "agentic triage via MCP Client Tool" as a **documented stretch goal** you can demo if time allows. It pairs naturally with Q-B option (b4) below. Do not let it balloon the committed v1.

### Re: does the user get a REAL answer, not just a classification? (the important one)

**First, what the current spec actually does:** in D3 the AI returns `{ category, headline, reply, slackSummary }`, where `reply` is a *1-2 sentence acknowledgement* ("Thanks, I've routed this as a bug to the team; they'll follow up"). So as specced today, the visitor gets a **classification + a polite acknowledgement, NOT a substantive answer** to their question. Your instinct is right: to give a real answer, the LLM needs context.

Here is the fork, cheapest to richest. (b)-options all change D3's `reply` from "acknowledgement" to "real answer".


| Option                               | What the visitor gets                                                    | Context the LLM needs                                    | n8n infra                                                | Accuracy on Expliq-specific Qs                                      |
| ------------------------------------ | ------------------------------------------------------------------------ | -------------------------------------------------------- | -------------------------------------------------------- | ------------------------------------------------------------------- |
| **(a) Triage-only** (current spec)   | Classification + acknowledgement                                         | none                                                     | AI classify node only                                    | n/a (doesn't answer)                                                |
| **(b1) Answer, ungrounded**          | A real answer from the model's general knowledge                         | none                                                     | AI node                                                  | Poor — it will *hallucinate* Expliq features it doesn't know        |
| **(b2) Answer, static context**      | A real answer grounded in a curated "About Expliq / FAQ" blurb you write | a short FAQ/feature text injected into the system prompt | AI node + a pasted context block                         | Good for a bounded product; you control the facts; trivial to build |
| **(b3) Answer, RAG**                 | A real answer grounded in your full docs/help content                    | a vector store of indexed docs, retrieved per question   | n8n Embeddings + Vector Store + retriever/AI Agent nodes | Best + scales; **real infra** (ingestion, vector DB)                |
| **(b4) Agentic** (ties to MCP above) | Answer AND action (open ticket, etc.)                                    | tools via MCP Client + optional RAG                      | AI Agent node + MCP Client tools                         | Highest capability, highest scope/risk                              |


**How (b2) works concretely (my recommendation):** the n8n AI node's system prompt contains a short, hand-written "What Expliq is / common questions" block (a paragraph or a dozen FAQ lines). The user's message + that context go to Claude, which returns a grounded answer in `reply`, plus still classifies into `category` and emits `slackSummary` for the team. No vector DB, no ingestion, ~no extra infra. It demonstrably *answers* (not just acknowledges), and it is honest because you author the facts. For a demo on a deadline this is the sweet spot.

**(b3) RAG** would be the most impressive pure "AI-native n8n" showcase (n8n literally has embeddings + vector-store + retriever nodes for exactly this), but it adds a knowledge-ingestion sub-track and a vector store. Reasonable as a **stretch** after (b2) works.

i want **(b4) Agentic** (ties to MCP above)

**Spec impact of choosing a (b) option:**

- D3: `reply` becomes "a real, context-grounded answer to the user's question" (not an acknowledgement).
- Workflow plan: the AI classify node also answers; for (b2) it gains a curated Expliq context block; for (b3) add retriever + vector store nodes.
- Possibly a small new asset: the curated FAQ/context text (committed, e.g. `n8n/expliq-support-context.md`) so it is reviewable + reusable.
- The widget UX is unchanged (it already renders `reply`); the reply is just substantive now.

**Decision needed:** which do you want for v1 — **(a)** triage-only, **(b2)** answer with static context (my pick for the deadline), or **(b3)** RAG? And shall I note **(b4) agentic / MCP Client Tool** as an explicit stretch goal in the spec? Once you pick, I fold it into the Phase-2 changes and then apply everything.

(Holding "apply all" until this is decided, since it changes D3 + the workflow plan.)

---

## Round 7 — Max scope locked: agentic RAG + findings from exercises 20 & 22

**Decision captured:** (b4) **Agentic** + **MCP Client Tool**. So the v1 target is the full vision: the widget gives a **real, RAG-grounded answer** AND the workflow **takes action** (agentic triage). The plain webhook stays the spine; the n8n side becomes an **AI Agent** workflow.

### What this turns the n8n workflow into

```
Webhook (POST /expliq-support, header auth)
  -> AI Agent node (Claude via OpenRouter)
       • tool: Vector Store retriever  (RAG over Expliq knowledge base)  -> grounded answer
       • tool(s): MCP Client           (take action: open GitHub issue / file ticket / Slack notify)
       • classifies into category, composes the user-facing answer + an internal summary
  -> Respond to Webhook -> { category, reply (real answer), actionsTaken[], slackSummary }
```

### Gold pulled from the two exercises (reuse, don't reinvent)

**Exercise 22** (it literally built a grounded single-shot chat assistant — `governance-chat.tsx` + `chat.ts` + `knowledge.ts` + `chat-prompt.ts`):

- **Reuse the prompt + guardrail template directly:** system instruction states what the bot can do; "ONLY answer from provided context"; explicit "I don't have enough information" fallback; "NEVER invent signals/actions"; keep to 3-5 sentences. Context injection block = retrieved KB sections + live entity data + question.
- **Reuse the KB structure:** `knowledge/*.md` split by heading (governance-signals, risk-levels, impact-levels, review-cadence, ownership, expliq-features, faq). We expand it with n8n-support topics.
- **Documented lesson that justifies our RAG choice:** their naive keyword retrieval was **brittle** (synonym misses) and recommended **vector embeddings from day 1** for broader scope. That is exactly our (b3) RAG, so we are heeding their lesson.

**Exercise 20** (AI agent over structured data — gives us the agent + safety patterns, not vectors):

- Agent flow pattern: intent parse -> fetch data -> build grounded prompt -> LLM -> **confirm before any write**.
- **Hard safety lessons we must bake in:** ground answers in real data (no hallucinated facts); **cost explosion** risk (a per-message conversational + RAG + agent is far costlier than batch); **multi-tenancy** (scope any data by `workspaceId`); **audit trail** for agent-taken actions; **confirm before destructive writes**.

### New decisions max scope opens (I will proceed on these defaults unless you object)

1. **Vector store = Supabase PGVector**, via n8n's Supabase/Postgres vector node. Rationale: the project already runs on Supabase Postgres, so this adds essentially no new infra. (Alternative: Qdrant on the Hetzner box. I prefer reusing Supabase.)
2. **Embeddings = OpenAI `text-embedding-3-small`** via n8n's embeddings node (cheap, simple). Alternative for a stronger "fully self-hosted" story: **Ollama embeddings on the Hetzner box** (more setup). Default: OpenAI small unless you want the self-hosted flex.
3. **Knowledge base** = committed `n8n/knowledge/*.md` (reuse ex22 structure + Expliq features + FAQ + n8n-support topics), ingested by a small **n8n "indexer" workflow** (also built via the MCP). Re-runnable.
4. **Multi-turn conversation** (max scope): the widget keeps conversation history and passes it to the agent, enabling follow-ups. Adds client state + a `history[]` field in the payload. (Single-shot was the ex22 approach; multi-turn is the upgrade.)
5. **Agent's action tools (v1):** Slack notify always; for `bug` -> create a GitHub issue; for `feature-request` -> file a Linear/Jira ticket; for `question` -> answer from RAG (no external write). Via MCP Client tools in the AI Agent node.

### The one risk I will NOT wave through: agentic writes on a PUBLIC demo

Point 5 + our public, always-on demo + **E's "no rate limit in v1"** = a real abuse vector. The widget is reachable by anyone on `expliq-mvp.vercel.app`. An agent that **creates GitHub issues / tickets** means a stranger (or a bot) can spam real external systems and run up OpenRouter + n8n cost. This is materially different from the old "just post to Slack" plan. I am flagging it rather than building it blindly.

**Proposed mitigation (recommend adopting):**

- **Sandbox the write targets:** agentic actions point at a **throwaway GitHub repo + a test Linear board + a private Slack channel**, never anything real. Fits the demo's daily-reset ethos and makes abuse harmless + resettable.
- **Re-open E and add a basic rate limit** now that actions have external side effects (e.g., per-IP/session N messages per hour, enforced in the Server Action). The earlier "no rate limit" was fine for "classify + Slack"; it is not fine for "create external tickets".
- Keep the **audit log** (ex20 lesson): record every agent action in the n8n execution log / a Slack audit line.

**This is the item I actually need your call on:** OK to (a) sandbox the write targets and (b) add a basic rate limit? Or do you want the agent's writes pointed at real targets (riskier on a public demo)?

### Updated Phase-2 spec changes (superseding the earlier list)

On your go, I will fold ALL of the following into the spec:

- R3-1..R3-9 (the confirmed refinements) + Q3 widget UX/a11y AC block.
- D3 reply -> real RAG-grounded answer; D2 -> AI Agent with retriever + MCP action tools (supersedes Switch->Slack).
- New scope: Supabase PGVector + embeddings + committed `n8n/knowledge/*.md` + an indexer workflow; multi-turn widget; agent action tools.
- New ACs: RAG returns grounded answers with "I don't know" fallback; agent takes the category-appropriate action; sandboxed write targets; rate limit; audit log; grounding/no-hallucination guardrail (reuse ex22 prompt template); multi-turn history.
- New Open Questions / operational prerequisites: GitHub sandbox repo, Linear/Jira test board, Slack channel + tokens, embeddings provider creds, KB source content.
- Phasing grows: Phase 1 splits into 1a (RAG: KB + indexer + retriever) and 1b (agent + MCP action tools + sandbox).

Given how much bigger this is than the original spec, after I apply I will recommend a fresh `/refine` pass before `/refine_all`.

**So: confirm the sandbox + rate-limit mitigation (and shout if you dislike any default 1-5), then say "apply all".**

**Answer: apply all. Sandbox targets + basic rate limit confirmed. Strongly limited actions + demo repo so there's no real abuse incentive; demo users never see the workflow.**

(Confirmed in chat: the workflow is invisible to demo users, and the n8n webhook URL lives server-side only — the client calls the Server Action, not the webhook. This further reduces the attack surface.)

---

## Refinement Applied

The spec `specs/18-n8n-ai-support-triage.md` was rewritten to reflect all agreed decisions. Summary of changes:

- **Title/scope:** "n8n AI Support Triage (Agentic RAG)". The n8n side is now an **AI Agent workflow** (RAG retriever + MCP Client action tools), not a Switch->Slack flow.
- **R3-1:** email fetched via `prisma.user.findUnique`, not read off the session.
- **R3-2:** n8n-MCP pinned to **stdio** transport with `${N8N_API_URL}` / `${N8N_API_KEY}` in the `env` block; no committed secret.
- **R3-3:** dropped the header-name env var; `x-webhook-secret` hardcoded. Config = `N8N_SUPPORT_WEBHOOK_URL` + `N8N_SUPPORT_WEBHOOK_SECRET` (+ local-only `N8N_API_URL` / `N8N_API_KEY`).
- **R3-4:** named `src/components/support-widget.tsx`. **R3-5:** noted the new `fetch` stub test scaffold.
- **R3-6:** ACs split into Automated (A), Structural/inspection (B), Manual/integration (C), Deploy safety (D). **R3-7:** AC11/12 restated structurally (env names only in server files).
- **R3-8:** phasing records Phases 0/1a/1b as interactive + MCP-driven, Phases 2 to 4 as the `/dev` slice.
- **R3-9:** DEPLOY-PORTFOLIO update targets pinned (env-state, touchpoints, corrected deploy note).
- **Q3:** widget UX/a11y folded into Scope + ACs (launcher >=24px + label, native `<dialog>`/`aria-modal`, focus move/return/trap, Escape, Enter-to-send / Shift+Enter, accessible Send, char counter, full-screen <768px, reduced-motion).
- **Q-B = (b4) Agentic + RAG:** `reply` is now a real RAG-grounded answer; added Supabase PGVector + OpenAI embeddings (Ollama as open question) + committed `n8n/knowledge/*.md` + an indexer workflow; reused the Exercise 22 prompt/guardrail template and Exercise 20 safety lessons (grounding, cost, multi-tenancy, audit). Multi-turn conversation added.
- **Agentic safety:** sandboxed write targets (throwaway GitHub repo / test board / private Slack), a basic rate limit (revises E), and an audit log. Documented the "workflow invisible + webhook server-side only" safety model.
- **Out of scope / Open questions** updated: removed "no rate limit"; added embeddings-provider choice, sandbox prerequisites, n8n subdomain/Slack, KB content, rate-limit thresholds, multi-turn history cap.

**Recommended next:** a fresh `/refine specs/18-n8n-ai-support-triage.md` pass (the epic grew substantially), then `/refine_all` for cross-epic consistency.

---

## Round 8 — Adding the n8n native "MCP Server Trigger" (decision needed before re-applying)

You want our n8n side to ALSO expose itself via the native **MCP Server Trigger** node. On-theme and impressive. Two things to settle first, because they change what gets built.

### What it is + how it fits (architecture)

The MCP Server Trigger turns an n8n workflow **into an MCP server**: it exposes a URL, and an MCP client (Claude Desktop / Claude Code / any agent) can **list and call its tools** (SSE / streamable HTTP, optional auth). Unlike the Webhook, it is a **different trigger** and **only connects to tool nodes** — so it is **not** bolted onto the existing webhook->AI-Agent flow. The clean shape:

```
Shared tool sub-workflows (built once):
   • answer_expliq_question(query)  -> RAG over the Supabase PGVector KB
   • file_support_request(message)  -> classify + sandboxed action (GitHub/Linear/Slack)

Front door 1 (humans):  Webhook  -> AI Agent -> uses the tools        [already specced]
Front door 2 (agents):  MCP Server Trigger -> exposes the same tools  [NEW]
```

So the marginal work is: factor RAG (and optionally triage) into reusable tool sub-workflows, then add a second workflow whose trigger is the MCP Server Trigger exposing those tools. The KB / vector store / embeddings are **reused**, not rebuilt.

### Decision 1 — what does the MCP server expose?

- **(i) Mirror the support brain** (recommended): expose `answer_expliq_question` (RAG) + `file_support_request` (triage + sandboxed action). Story: *"one n8n workflow, two front doors — a human chat widget via webhook AND an AI agent via MCP — built with the n8n-MCP, self-hosted by me."* Reuses everything we just specced. Lowest marginal scope, highest coherence.
- **(ii) Expose Expliq governance tools** (the Round-6 "talk to your automation landscape" idea): `get_riskiest_automations`, `explain_automation(id)`, etc., backed by Expliq's API/DB. More novel, but it is a **different capability** (needs n8n to reach Expliq's data, plus read-only scoping by `workspaceId` per the ex20 multi-tenancy lesson). Heavier; not "our n8n wf".

I recommend **(i)** for v1 (it literally is "our n8n wf" exposed as MCP), and note (ii) as a future extension. agree

### Decision 2 — who CONSUMES it? (an MCP server is inert without a client)

An MCP Server Trigger only demonstrates value if something connects to it. For the portfolio/interview, the obvious consumer is **Claude Desktop / Claude Code** configured to use the n8n MCP URL. Killer live moment: in the interview you open Claude Desktop, ask *"How does Expliq detect risky automations?"*, and Claude calls your self-hosted n8n MCP server's `answer_expliq_question` tool. 

- Confirm the intended consumer is **Claude Desktop/Code for the demo** (not the Expliq web app — the app keeps using the webhook). If you imagine a different consumer, say so. confirm

### Safety / scope notes

- Same sandbox + audit model applies to any write tool exposed via MCP. Read tools (RAG answer) are safe; scope any data tools to the demo workspace only.
- The MCP Server Trigger URL gets **auth** enabled (don't expose tools unauthenticated).
- This **contradicts a line I just wrote** in the spec's Out-of-Scope ("Exposing Expliq itself as an MCP server ... not built here"). On your confirmation I move it from Out-of-Scope into Scope.

### Proposed spec impact (on confirmation)

- Scope/Track 2: factor RAG (+ triage) into **tool sub-workflows**; add a `**n8n/support-mcp-server.workflow.json`** with the MCP Server Trigger exposing those tools (with auth).
- ACs (manual/integration): the MCP server lists its tools to an MCP client; calling `answer_expliq_question` from Claude Desktop returns a grounded answer; auth required; write tools hit sandboxes + audit.
- Open Questions: MCP auth scheme + which client config; exact tool set; whether `file_support_request` is exposed (write) or only `answer_expliq_question` (read) in v1.
- Phasing: add **Phase 1c** (MCP Server Trigger workflow + verify from an MCP client) after 1b.
- Remove the contradicting Out-of-Scope line.

**Confirm: framing (i) [recommended] vs (ii), and consumer = Claude Desktop/Code?** Then I fold it into the spec. (Honest flag: this adds a third n8n workflow + an MCP-client config step. Still coherent and reuses the RAG layer, but it is more to build and to keep working for the demo.)

**Answer: framing (i) confirmed, consumer = Claude Code/Desktop. apply it.**

### Refinement Applied (Round 8)

Folded the MCP Server Trigger into `specs/18-n8n-ai-support-triage.md`:
- Scope: "two front doors" — RAG + triage factored into reusable **tool sub-workflows** (`answer_expliq_question`, `file_support_request`), called by both the Webhook agent (humans) and a new MCP Server Trigger workflow `n8n/support-mcp-server.workflow.json` (AI agents, auth on, consumed by Claude Desktop/Code). Framing (i) only.
- Reproducibility: added the third workflow JSON + MCP-server auth/client config to the runbook.
- Phasing: added **Phase 1c** (MCP server workflow + verify from an MCP client).
- ACs: added 24 (shared tool sub-workflows), 25 (MCP Server Trigger with auth, exported), 26 (list + call from Claude Desktop/Code, unauth refused); renumbered Deploy-safety to 27/28.
- Out of Scope: replaced the contradicting line — MCP Server Trigger is IN (framing i); governance-data tools (framing ii) remain a future extension.
- Domain terms: added MCP Server Trigger, tool sub-workflow, two front doors. Open Questions: added MCP auth/client config + whether the write tool is exposed via MCP in v1.

**Recommended next:** `/refine specs/18-n8n-ai-support-triage.md` once more (it grew again), then `/refine_all`.

---

## Round 9 — Refinement Review (second /refine pass)

No results file exists, so refinement applies. One investigator re-verified the grown spec against the repo. Nothing you wrote is unanswered (Rounds 1 to 8 are all resolved); this is the proactive review. The net-new files (`support-widget.tsx`, `actions/support.ts`, `n8n/*`) showing as "not present" is expected, not a finding.

**Confirmed against code:** Supabase is the Postgres (DATABASE_URL/DIRECT_URL); session has only id + workspaceId (email fetch via Prisma is correct); existing actions follow `"use server"` + `getRequiredSession()` + `{success}|{error}`; `(app)/layout.tsx` is the async server layout for the widget; `.mcp.json` (figma only, committed) accepts a stdio entry; `.env*` gitignored except `.env.example`.

### Flag 1 (important, technical): the rate limit will NOT work as "in-memory" on Vercel

There is no existing rate-limit code in the repo, and the app runs on **Vercel serverless/Fluid Compute**. An in-memory counter (a `Map` in module scope) is **unreliable** there: invocations land on different/ephemeral instances, so the counter resets and does not actually limit. Open Question 5 lists "in-memory per instance vs a small KV" as if equivalent; they are not. Options:
- **(a) Accept best-effort for the demo** (cheapest). Justified because the attack surface is already tiny: server-only webhook URL, length cap, and **sandboxed** write targets. Document it as a known limitation. **My recommendation for the deadline.**
- **(b) Vercel KV / Upstash Redis** (robust, but a new marketplace integration + dependency).
- **(c) A Postgres-backed counter** on the existing Supabase. Robust and no new service, BUT needs a tiny table, which rubs against the spec's "no Prisma model / no schema migration" line (would need a raw table or a small model).
- *Recommendation:* (a) for v1 with a documented limitation; note (b) as the upgrade. Update OQ5 + the safety-model bullet to say the limit is best-effort on serverless unless backed by KV.
- **Confirm (a), or do you want (b)?**

### Flag 2 (the big one): oversized slice / delivery risk — recommend internal milestones (NOT a scope cut)

This single epic now bundles: Hetzner self-host + Caddy/HTTPS, three n8n workflows + tool sub-workflows, a RAG stack (KB authoring + pgvector + embeddings + indexer), agentic actions across **three** sandbox integrations (GitHub/Linear/Slack), an MCP server + MCP client config, and a multi-turn a11y widget + server action + rate limit + tests + deploy. That is several epics of surface area, with many external prerequisites that must all work at once for a live demo. Per the deadline, I am not proposing to cut anything; I am proposing a **build/verify order** so each milestone is independently demoable:
- **M1 (core demo):** Webhook + widget + RAG answer (Phases 0, 1a, 2, 3, 4 minus actions). Gives you a working "ask Expliq, get a grounded answer" live. Smallest path to something showable.
- **M2 (agentic):** add `file_support_request` + the three sandbox actions (Phase 1b).
- **M3 (MCP server):** add the MCP Server Trigger door + Claude Desktop/Code config (Phase 1c).
- *Recommendation:* add these milestones to the spec's phasing as the intended order, so `/dev` and you build M1 to a demoable state first. **Confirm adding the milestone framing?**

### Flag 3: PGVector shares the Prisma database (safe, but two setup notes)

Confirmed safe: no `prisma/migrations/` dir and no destructive migrate scripts, so an n8n-created pgvector table coexists and Prisma ignores it. Two things to add to the spec/runbook: (i) the **`vector` extension must be enabled once** on Supabase (`create extension vector`); (ii) the vector data lives in the **same DB as prod** (the existing "same DB dev+prod" gap), so keep it in its own table/namespace and never point it at Prisma-managed tables. *Recommendation:* add both as runbook/setup notes + one line in the RAG-layer scope. **Confirm?**

### Flag 4: DEPLOY-PORTFOLIO update is a correction, not just an addition

The doc currently states: *"NOT set: `N8N_*` (per-user via ConnectorConfig at runtime, never at app-level)."* The spec introduces **app-level** `N8N_SUPPORT_*` vars, which directly contradicts that line. AC28 must **correct** that statement (distinguish the per-user connector creds from the new app-level support webhook), not merely append vars. *Recommendation:* sharpen AC28 wording. **Confirm?**

### Flag 5: two ACs are subjective / hard to verify

- **AC18** "grounded answer (facts traceable to the KB)" is fuzzy. Make it concrete: ask a question whose answer lives in a known KB file and assert the reply contains that specific fact; ask an out-of-scope question and assert the exact "I don't have enough information" fallback. 
- **AC26** "a grounded answer of the same quality as the widget path" — "same quality" is not testable. Reword to "returns a grounded, non-empty answer (not an error)".
- *Recommendation:* reword both. **Confirm?**

### Flag 6: small inconsistencies

- **Response enum:** `actionsTaken[].type` allows `"linear-ticket"`, but scope text says "Linear/**Jira**". Pick one tool (or use a generic `"ticket"`). *Recommendation:* settle on one for v1 (Linear is simplest free-tier) and align the enum + Open Question 2.
- **Stale ref:** Related says "Brainstorming Rounds 1 to 7"; we are at Round 9. Minor.
- **Header wording:** the intro line says "an n8n workflow built via the n8n-MCP" (singular) while scope now has three. Minor.
- *Recommendation:* fix all three in passing. **Confirm?**

### Flag 7: external-prerequisite concentration (delivery risk, mostly already tracked)

Hard blockers that must all be in place: Hetzner box + subdomain, Supabase `vector` extension, OpenRouter key, embeddings creds, GitHub sandbox repo, Linear/Jira board, Slack workspace + channel + tokens, MCP client config. Most are in Open Questions already. Stating plainly: this is the single biggest risk to a working live demo, which is exactly why M1 (Flag 2) deserves to be the first shippable target. No spec change needed beyond the milestone framing; just naming the risk.

### Proposed edits on confirmation (Phase 2 of this pass)

1. OQ5 + safety bullet: rate limit is best-effort on serverless (option a) unless KV-backed (b).
2. Phasing: add M1/M2/M3 milestone framing as the build order.
3. RAG-layer scope + runbook: add `create extension vector` + same-DB-as-prod note.
4. AC28: reword to correct DEPLOY-PORTFOLIO's "never at app-level" line.
5. AC18 + AC26: reword to concrete/testable.
6. Align `actionsTaken` enum with one ticketing tool; fix "Rounds 1 to 7" and the singular-workflow header line.

Reply per flag or say **"apply all"** and I update the spec. (Honest note: none of this cuts your max scope; it tightens testability + names the delivery risk + fixes the serverless rate-limit assumption.)

### Refinement Applied (Round 9)

Applied to `specs/18-n8n-ai-support-triage.md`:
- Rate limit reframed as **best-effort on serverless** (option a) in the safety bullet + Open Question 5; KV/Upstash noted as the robust upgrade.
- Added **M1/M2/M3 milestone framing** as the intended build order in the Phasing section.
- RAG-layer scope: added `create extension vector` + same-DB-as-prod setup notes.
- AC28 reworded to **correct** (not just append to) DEPLOY-PORTFOLIO's "never at app-level" line.
- AC18 + AC26 reworded to concrete/testable checks.
- Aligned ticketing on **Linear** (dropped "/Jira") in the workflow + Open Question 2; fixed "Rounds 1 to 7" -> "1 to 9"; header now says "n8n workflows" (plural) + MCP Server door.

(Pending your call on whether to split the epic — see chat.)

### Split Applied (after Round 9)

Decision: **split** along the M1/M2/M3 seams. Done:
- **Epic 18** rewritten to **M1 — Support Widget + RAG Answer** (answer-only: host + RAG + answer workflow + widget + Server Action + deploy). Workflow exports: `support-answer.workflow.json` + `support-indexer.workflow.json`.
- **[Epic 19 — Agentic Triage Actions (M2)](19-agentic-triage-actions.md)** created: AI Agent + MCP Client action tools (GitHub/Linear/Slack) against sandbox targets + rate-limit hardening. Depends on 18. Brainstorming: `19-...-brainstorming.md`.
- **[Epic 20 — n8n MCP Server Door (M3)](20-n8n-mcp-server-door.md)** created: factor tools into sub-workflows + MCP Server Trigger door consumed by Claude Desktop/Code. Depends on 18 (+19 for the write tool). Brainstorming: `20-...-brainstorming.md`.

This file remains the shared decision-history record for all three (Rounds 1 to 9). Recommended next: `/refine_all` for cross-epic consistency across 18/19/20.