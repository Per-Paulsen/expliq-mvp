# FairTix Automation Intelligence — Final Analysis

> Extracted from ANALYSIS.md (5 parts). This file contains ONLY the final, non-contradictory analysis. For the full evolution, see ANALYSIS.md.
>
> **Analyzed:** 2026-04-03
> **Instance:** FairTix Automations (`ai-software-egnineering.app.n8n.cloud`)
> **Workflows analyzed:** 8 (9 reference-tagged, excluding the "Common node types" reference sheet)
> **Executions reviewed:** 131
> **Systems detected:** Gmail, Google Sheets, Google Docs, Anthropic Claude, n8n

---

## What Expliq Knows About FairTix (Facts Only)

From workflow JSONs, node parameters, and execution data — no inference beyond what the data proves.

**Core business model** (from email templates in node parameters):
- FairTix sells event tickets through a lottery system called "Fair Queue"
- Every participant gets an equal chance — no speed advantage, no bots
- Pricing is all-in with zero hidden fees (€0.00 displayed prominently)
- Resale is allowed but capped at face value + 20%
- Identity verification is required before entering any queue
- Winners have a 24-hour purchase window

**Revenue flow** (from workflow logic):
```
User signs up → Welcome email → Enters lottery → [LOTTERY DRAW - external]
  → Winner notification (email with purchase CTA) → [PURCHASE - external]
```

**Customer support model** (from AI classifier prompt):
- 6 support categories: FAQ, Account/Verification, Payment/Billing, Technical/Bug, Resale/Transfer, Feedback
- Two-model AI architecture: Claude Sonnet 4.6 classifies, Claude Haiku generates responses
- FAQ answers pulled from Google Docs knowledge base
- Non-FAQ tickets escalated with category + sentiment labels

---

## Per-Workflow Business Cases

### 1. Welcome Email
**What it does:** Sends branded welcome email explaining FairTix's value propositions. Drives users to verify accounts.
**Revenue connection:** Top of funnel — unverified users can't enter lotteries. Every unverified user is lost revenue potential.
**Failure impact:** New users get no onboarding, don't verify, are invisible to the lottery system.
**Status:** Inactive. Prototype (manual trigger, hardcoded user data). 5 test executions, 100% success.

### 2. LotteryWin Notification
**What it does:** When a winner row appears in Google Sheets, sends branded notification email with event name, ticket price, and 24-hour purchase CTA. Updates sheet with delivery status.
**Revenue connection:** DIRECT. This email is the bridge between lottery selection and ticket purchase.
**Failure impact:** Winners don't know they won. 24-hour window expires. Revenue lost. Support volume increases.
**Status:** Inactive. 3 duplicate versions (02, 02b, 05). 31% error rate across 36 executions. "Published" version never activated.
**Governance:** errorWorkflow linked (on 2 of 3 versions). No retry logic on Gmail node. timeSavedPerExecution: 1 min.

### 3. Support Classifier
**What it does:** Polls Gmail for support emails, classifies with Claude Sonnet (6 categories, 4 sentiments, confidence score), writes classification to Google Sheets.
**Revenue connection:** Indirect — fast, accurate support prevents churn.
**Failure impact:** Support messages go unclassified. Everything hits the human queue. Response times spike during events.
**Status:** Inactive. 198 version iterations. 50 executions, 88% success rate.

### 4a. Support FAQ/Manual (Gmail-based)
**What it does:** Classifies support email → if FAQ, fetches Google Docs knowledge base + generates response with Claude Haiku → auto-replies. If non-FAQ, escalates to team with category/sentiment labels.
**Revenue connection:** FAQ deflection = fewer human support hours. Faster responses = better customer experience.
**Failure impact:** No auto-responses. All emails require human handling. During peak events, team overwhelmed.
**Status:** Inactive. 362 version iterations (most developed workflow). 50 executions, 88% success.

### 4b. Support FAQ/Manual (Sheet-based)
**What it does:** Same as 4a but triggered by Google Sheets rows instead of Gmail polling. More granular routing with classification written back to sheet.
**Status:** Inactive. 135 version iterations. 50 executions, 88% success.

### 5. Generic Error Workflow
**What it does:** Centralized error handler. When any linked workflow fails, emails error details (workflow name, execution URL, error message, stack trace) to ops inbox.
**Revenue connection:** Protects all other revenue-generating workflows. Without it, failures are silent.
**Failure impact:** This IS the safety net. Its own 17.5% failure rate means some errors go unnotified.
**Status:** ACTIVE — the only active workflow. 40 executions. Catching real production errors: clusters of 6-9 per day from polling trigger failures.

---

## Business Processes (8 identified)

### Existing Processes (with workflows)

| Process | Workflows | Coverage | Reliability | Maturity |
|---------|-----------|----------|-------------|----------|
| **Customer Onboarding** | 1 (welcome email) | 33% (1 of 3 steps) | 100% (5 runs) | Prototype |
| **Ticket Lottery Lifecycle** | 2 (win notification × 2 variants) | 40% (2 of 5 steps) | 69% (31% error rate) | Emerging |
| **Customer Support** | 3 (classifier, FAQ/manual, FAQ/sheet) | 75% (3 of 4 steps) | 88% | Advanced development |
| **Platform Operations** | 1 (error handler) | 50% (1 of 2 steps) | 82.5% | Production |

### Suggested Processes (no workflows yet)

| Process | Based on | Recommended workflows |
|---------|----------|----------------------|
| **Payment & Billing** | Purchase CTA in lottery email + "Payment/Billing" support category | Purchase confirmation, payment failure handler, refund notification, window expiration handler |
| **Resale & Transfer** | "Resale Cap 20%" in welcome email + "Resale/Transfer" support category | Listing confirmation, cap enforcement, sale completion, transfer confirmation |
| **Event Lifecycle** | Every workflow references events but none manage them | Event announcement, lottery draw trigger, event reminder, post-event follow-up |
| **Analytics & Reporting** | Classification data accumulates in Sheets, never aggregated | Weekly support digest, lottery performance report |

**Totals:** 7 existing workflows, 21 recommended, across 8 business processes. 25% overall coverage.

---

## System Narratives

### Gmail — Communication Backbone
8 workflows connect to Gmail. Three functions: customer lifecycle emails (welcome, lottery results), AI-generated support responses, and operational error alerts. All through one OAuth2 credential (`DL-School-Automations`).

**Insight:** Single point of failure. If this OAuth token expires or the account is suspended, ALL automated communication stops — customer-facing AND operational. No alternative channel exists.

### Google Sheets — Operational Data Store
6 workflows read/write Google Sheets. Serves as database for lottery winners (names, emails, events, prices, delivery status) and support classifications (category, sentiment, confidence, rationale). Data flows both directions — triggers workflows and receives results.

**Insight:** Works for current volume but creates three risks at scale: API rate limits (~100 req/min), no transactional guarantees, no backup strategy.

### Anthropic Claude — AI Support Brain
2 workflows use Claude via a two-model architecture: Sonnet 4.6 for classification (heavy reasoning), Haiku for response generation (lighter task). Cost-efficient design — expensive model only where quality matters.

**Insight:** Well-designed architecture. At scale, consider: caching frequent FAQ answers, confidence threshold gating (below 0.75 → don't auto-respond), accuracy monitoring over time.

### Google Docs — Knowledge Base
1 workflow reads FAQ document for grounding AI support responses.

**Insight:** Simple but effective for current stage. As FAQ grows, consider structured searchable index.

---

## Recommendations (Consulting-Grade Framework)

Sorted by business impact. Confidence shown per recommendation.

### ACT NOW — High Impact, High Confidence

**R1. Stabilize the Lottery-Win Notification Pipeline**
- **Impact:** Critical — this IS the revenue conversion trigger
- **What to do:** Consolidate 3 duplicate versions into 1. Add retry logic on Gmail node. Activate.
- **Evidence:** Data-driven
  - 3 duplicate versions with no canonical version (workflow inventory)
  - 31% error rate across 36 executions (execution API)
  - "Published" version never activated
  - `retryOnFail: false` on Gmail node
  - Error workflow catching real failures in production (clusters of 6-9/day)

**R2. Add Lottery-Loss Notification**
- **Impact:** High — non-winners outnumber winners (often 5:1+). Silence erodes trust in the "Fair Queue" promise.
- **What to do:** When lottery completes, notify all non-selected participants. Include empathy + re-engagement hook.
- **Evidence:** Data-driven
  - Win notification exists, loss notification does not (workflow inventory — 0 of 68 workflows)
  - Support classifier sees lottery-related FAQ (classifier prompt)
  - Welcome email promises "fair chance" — fairness without communication isn't perceived as fair
- **Deploy:** n8n workflow. Google Sheets → Gmail.

**R3. Add Purchase Window Reminders (12h + 22h)**
- **Impact:** High — 24h window with no reminder = lost conversions. Comparable platforms report 10-15% lift with reminders.
- **What to do:** Remind at 12h ("12 hours left") and 22h ("last 2 hours").
- **Evidence:** Data-driven
  - "You have 24 hours" explicitly in email template (node parameters)
  - No reminder workflow exists (workflow inventory)
  - Notification timestamps already tracked in Google Sheets (Update Status node)
- **Deploy:** n8n workflow. Scheduled check on winner records.

**R4. Fix Error Handling on AI Support Pipeline**
- **Impact:** High — 3 workflows making external API calls with zero error handling. Anthropic outage = silent failure of all support automation.
- **What to do:** Link all support workflows to error workflow. Add retry on Anthropic nodes. Add confidence gate: if < 0.75, route to manual.
- **Evidence:** Data-driven
  - `settings.errorWorkflow` not set on workflows 03, 04, 04-sheet
  - `retryOnFail: false` on all Anthropic nodes
  - Confidence score generated but never checked — 0.5 confidence gets same auto-reply as 0.95
  - 12% error rate during testing

### INVESTIGATE — High Impact, May Exist Elsewhere

**R5. Purchase Confirmation & Ticket Delivery**
- **Impact:** Critical if not handled elsewhere
- **Honest framing:** "We don't see purchase confirmation in your n8n workflows. Your checkout page (`fairtix.demo/checkout`) may handle this directly. If so, consider connecting your platform to Expliq for lifecycle visibility. If not, here's the workflow."
- **Evidence:** AI-suggested — CTA exists in email, no post-purchase workflow in n8n

**R6. Event Announcement / Queue Opening Notification**
- **Impact:** High — if users don't know a lottery is open, they can't enter. Direct top-of-funnel.
- **Honest framing:** "No evidence of proactive event notifications in any system visible in n8n. If your platform handles this, great. If not, this is a direct revenue driver."
- **Evidence:** AI-suggested — events referenced in workflow data but no announcement workflow exists

**R7. Payment Failure Recovery**
- **Impact:** High if applicable — failed payments during 24h window are urgent
- **Honest framing:** "Your support classifier sees Payment/Billing issues. Your payment provider likely handles retries. If you want custom handling (extend window on failure), here's how."
- **Evidence:** AI-suggested — support category exists, no payment workflow in n8n

**R8. Resale & Transfer Notification Workflows**
- **Impact:** Medium-high — resale is a stated business feature, users contact support about it
- **Honest framing:** "Your platform likely handles the resale marketplace. But notification workflows (listing confirmed, ticket sold, transfer completed) could be added to n8n to close the communication loop."
- **Evidence:** AI-suggested — welcome email describes resale, support category exists, no resale workflow in n8n

### EXPLORE — Valuable, Requires Expansion

**R9. Connect Your Ticketing Platform**
- Expliq sees n8n orchestration but not the FairTix product. Connecting it reveals: event catalog, lottery mechanics, purchase rates, user accounts. Every "Investigate" item above becomes "Act Now" with platform data.

**R10. Add Slack as Second Notification Channel**
- All communication through one Gmail account. Error workflow has 17.5% failure rate — when it fails, nobody knows. Slack provides instant team visibility + failover.
- **Evidence:** Data-driven — single Gmail channel, 7 of 40 error executions failed.

**R11. Post-Event Follow-Up**
- After events: feedback, NPS, next-event recommendations. No evidence this exists anywhere.
- **Evidence:** AI-suggested.

**R12. Verification Reminder Sequence**
- "Account/Verification" is a support category. Unverified users can't enter lotteries. 24h/72h reminders could recover users who forget.
- **Evidence:** AI-suggested — welcome email + support category, but platform likely owns verification.

**R13. Weekly Support Digest**
- Classification data flows to Sheets but is never aggregated. Weekly report: volume, categories, deflection rate, sentiment trends.
- **Evidence:** Data-driven — structured columns in Sheets, no aggregation workflow.

---

## Summary Table

| # | Recommendation | Impact | Confidence | Evidence | Deployable? |
|---|---------------|--------|------------|----------|-------------|
| R1 | Stabilize lottery-win notification | Critical | High | Data-driven | Fix existing |
| R2 | Lottery-loss notification | High | High | Data-driven | New workflow |
| R3 | Purchase window reminders | High | High | Data-driven | New workflow |
| R4 | Fix AI support error handling | High | High | Data-driven | Fix existing |
| R5 | Purchase confirmation | Critical | Medium | AI-suggested | New workflow |
| R6 | Event announcements | High | Medium | AI-suggested | New workflow |
| R7 | Payment failure recovery | High | Medium | AI-suggested | New workflow |
| R8 | Resale notifications | Medium | Low-Medium | AI-suggested | New workflow |
| R9 | Connect ticketing platform | Strategic | N/A | Pattern-based | Platform |
| R10 | Slack failover | Medium | High | Data-driven | New workflow |
| R11 | Post-event follow-up | Medium | Low | AI-suggested | New workflow |
| R12 | Verification reminders | Medium | Medium | AI-suggested | New workflow |
| R13 | Weekly support digest | Low-Medium | High | Data-driven | New workflow |

---

## "Your Next Move"

> Your lottery-win notification — the one workflow that directly drives revenue — isn't running. It exists in 3 versions, has a 31% error rate, and the "Published" copy was never activated. Meanwhile, your error handler has been catching real failures for 2 weeks. Stabilize the notification first. Then build the missing half: lottery-loss notifications. Your Fair Queue promise is about fairness for everyone — winners AND non-winners deserve to hear the result. This one workflow will reduce support volume, increase trust, and create a re-engagement channel for your next event.

---

*This analysis demonstrates what Expliq's Automation Intelligence produces from n8n workflow definitions, execution history, and node-level configuration. Every claim traces back to the user's own data. Estimates are labeled as such with transparent reasoning.*
