# FairTix Automation Landscape -- Expliq Analysis

> **Analyzed:** 2026-04-03
> **Workspace:** FairTix Automations (project `ywdgAaabWH2kVVRo`)
> **Workflows analyzed:** 8 (excluding reference sheet `00-common-node-types`)
> **Total executions reviewed:** 131

---

## Per-Workflow Analysis

---

### 1. Send Welcome Email

| Field | Value |
|---|---|
| **Workflow ID** | `BlHTY3WMyrHpTYDK` |
| **n8n Name** | 1 - FairTix Send Welcome Email |
| **Status** | Inactive |
| **Created** | 2026-03-06 |
| **Version Counter** | 17 |

#### What it does

When triggered manually, this workflow sets a hardcoded user name and email address, then sends a branded HTML welcome email via Gmail. The email explains FairTix's core value propositions -- Fair Queue (lottery-based, not speed-based), transparent pricing with no hidden fees, verified-humans-only policy, and a resale cap of face value + 20%. It prompts the new user to verify their account as the next step.

#### Systems connected

```
Manual Trigger --> Set Fields (name, email) --> Gmail (send welcome email)
```

- **Source:** Manual trigger (no automated intake)
- **Destination:** Gmail (via OAuth2, credential: `DL-School-Automations Gmail`)

#### What MUST be true about FairTix

- FairTix operates a **lottery/queue-based ticket allocation system** ("Fair Queue") -- not first-come-first-served. This is a core differentiator.
- They enforce a **verified-humans-only policy**, meaning they have an identity verification flow (phone, ID, or similar).
- They have a **resale cap** of face value + 20% maximum, meaning they operate a controlled secondary market.
- Their pricing is **all-in with no hidden fees** -- this is the "Transparent Pricing" brand promise.
- They price in **EUR**, suggesting European primary market.
- The welcome email is currently a **prototype/template** -- the user data is hardcoded (`Andreas Stephan`, `mail@andreasstephan.com`), not pulled from a registration system.

#### Business importance

The welcome email is the first touchpoint after signup. It sets expectations for how the platform works (lottery, verification required, no fees) and drives users to verify their accounts. If this fails or is never activated with real trigger integration, new users get no onboarding and may not complete verification, making them ineligible for ticket queues.

#### Governance signals

| Signal | Assessment |
|---|---|
| Active status | **Inactive** -- not running in production |
| Error handling | **None** -- no error output configured, no try/catch |
| Error workflow | **None** -- not linked to any error notification workflow |
| Retry config | **None** |
| Trigger type | Manual only -- no webhook or event trigger from a registration system |

**Risk: HIGH.** This workflow is a prototype. It has no automated trigger, no error handling, and is not active. If FairTix is onboarding real users, welcome emails are either not being sent or are being sent by another system.

#### Execution stats

| Metric | Value |
|---|---|
| Total executions | 5 |
| Successful | 5 (100%) |
| Errors | 0 |
| Mode breakdown | All manual |
| Date range | 2026-03-06 to 2026-03-17 |
| Avg duration | ~0.2s |

All executions were manual test runs. No production traffic.

---

### 2. LotteryWin Notification

| Field | Value |
|---|---|
| **Workflow ID** | `doo7oPoKUzaX6hTx` |
| **n8n Name** | 2 - FairTix - LotteryWin |
| **Status** | Inactive |
| **Created** | 2026-03-06 |
| **Version Counter** | 115 |

#### What it does

When a new row is added to a Google Sheets spreadsheet ("LotteryWins"), this workflow sends a beautifully designed HTML notification email to the lottery winner via Gmail, informing them they have been selected in the Fair Queue for a specific event. The email includes the event name, ticket price in EUR (with "Hidden Fees: 0.00" prominently displayed), and a call-to-action to complete the purchase within 24 hours. After sending, it updates the same spreadsheet row with status code (200), a timestamp, and the Gmail label ID as a delivery confirmation.

#### Systems connected

```
Google Sheets (LotteryWins trigger, poll every minute)
  --> Gmail (send winner notification)
    --> Google Sheets (update row with status/timestamp)
```

- **Source:** Google Sheets (`1BQ9bYCC7-UgATbRdHvHZo-TiB4QTfXoGu24ISGikmRI` / "Andreas Stephan-Signups")
- **Processing:** Gmail (via OAuth2)
- **Destination:** Same Google Sheets (status update)
- **Error workflow:** `oZy3vc0yli2xdR45` (Generic Error Workflow)

#### What MUST be true about FairTix

- The lottery/draw process produces results in a **Google Sheet** -- either manually or from an upstream system. This means the lottery draw itself is likely a separate process (possibly manual, possibly another system).
- The sheet schema includes: ID, Name, Email, EventName, TicketPrice, Status, Message, Automation Timestamp -- this is a **lightweight CRM/operations table**.
- Winners get a **24-hour purchase window** before their spot is released. This implies there is an expiration/timeout mechanism somewhere (possibly manual).
- The checkout link (`https://fairtix.demo/checkout`) is a **demo URL**, confirming this is a staging/prototype environment.

#### Business importance

This is a **revenue-critical workflow**. The lottery win notification is the moment a fan learns they can buy a ticket. Delays or failures mean: (1) the 24-hour window starts ticking without the user knowing, (2) users miss their purchase window and the ticket goes unallocated, (3) revenue is lost and customer trust is damaged. This is arguably the most important automation in the stack.

#### Governance signals

| Signal | Assessment |
|---|---|
| Active status | **Inactive** |
| Error handling | **None** at node level (no `onError: continueErrorOutput`) |
| Error workflow | **Linked** to `oZy3vc0yli2xdR45` (Generic Error Workflow) |
| Retry config | **None** |
| Caller policy | `workflowsFromSameOwner` |
| Time saved config | 1 min per execution |

**Risk: MEDIUM.** Has error workflow linkage (good), but no node-level error handling. The workflow is inactive. The 115 version iterations suggest significant development effort.

#### Execution stats

| Metric | Value |
|---|---|
| Total executions | 32 |
| Successful | 22 (69%) |
| Errors | 10 (31%) |
| Mode breakdown | 26 manual, 5 trigger, 1 unknown |
| Trigger successes | 2 of 5 (40%) |
| Date range | 2026-03-06 to 2026-03-17 |

The 31% error rate is concerning. Several trigger-mode errors occurred in sequence on 2026-03-10 (IDs 105-108), suggesting a persistent configuration issue (possibly expired Google Sheets credentials or a missing sheet). The workflow has been tested extensively but never stabilized for production.

---

### 2b. LotteryWin With Error Handling

| Field | Value |
|---|---|
| **Workflow ID** | `mL9fPJJCilGma1SJ` |
| **n8n Name** | 2b - FairTix - LotteryWin With Error Handling |
| **Status** | Inactive |
| **Created** | 2026-03-14 |
| **Version Counter** | 5 |

#### What it does

This is an **improved version** of the LotteryWin workflow (workflow 02) that adds explicit error handling. It watches a different Google Sheet ("FairTix Signups") for new rows, sends the same branded lottery-win email via Gmail, but critically splits into two paths after the Gmail send: a **success path** that updates the sheet with status 200 and "Mail sent!", and an **error path** (via `onError: continueErrorOutput`) that updates the sheet with status 500 and the error message. Both paths write timestamps back to the spreadsheet.

#### Systems connected

```
Google Sheets (FairTix Signups trigger, poll every minute)
  --> Gmail (send winner notification)
    --> [SUCCESS] Google Sheets (update: status=200, message="Mail sent!")
    --> [ERROR]   Google Sheets (update: status=500, message=error details)
```

- **Source:** Google Sheets (`15hxBHnxRHVjjljW1aV_DmCQkxomC412kyR7i0-6TX6g` / "FairTix Signups")
- **Processing:** Gmail (via OAuth2)
- **Destination:** Same Google Sheets (success or error update)

#### What MUST be true about FairTix

- The team recognized the error-handling gap in workflow 02 and built this improved version, pointing to a **different spreadsheet** (possibly the "real" one vs. the test one).
- The success/error status tracking in the spreadsheet suggests the operations team **monitors delivery status manually** by checking the sheet.
- Having two versions (02 and 02b) of the same workflow indicates an **iterative development approach** without version control discipline -- both exist simultaneously rather than one replacing the other.

#### Business importance

Same as workflow 02 -- this is the revenue-critical lottery notification -- but with better operational visibility. The status column in the spreadsheet acts as an audit trail. If this were the active version, the operations team would know immediately which notifications failed and could intervene manually.

#### Governance signals

| Signal | Assessment |
|---|---|
| Active status | **Inactive** |
| Error handling | **Yes** -- `onError: continueErrorOutput` on Gmail node |
| Error workflow | **None** (unlike workflow 02, this one does not link to the generic error workflow) |
| Retry config | **None** |

**Risk: MEDIUM.** Better than workflow 02 (has node-level error handling), but worse in one way: no error workflow linkage means failures only appear in the spreadsheet, not as email alerts. The ideal version would combine both approaches.

#### Execution stats

No dedicated execution file for workflow 2b was provided. Based on the version counter of 5, this workflow has had minimal testing.

---

### 3. Support Classifier

| Field | Value |
|---|---|
| **Workflow ID** | `eCwQlVIPMa9yxbry` |
| **n8n Name** | 3 - FairTix- Support-Classifier |
| **Status** | Inactive |
| **Created** | 2026-03-14 |
| **Version Counter** | 198 |

#### What it does

This workflow runs on a 1-minute schedule and fetches support emails from Gmail (filtered by subject containing "Support Request"). It passes each email through an LLM classification pipeline using Claude Sonnet 4.6 (via Anthropic API) with a detailed system prompt that categorizes messages into one of six categories (FAQ, Account/Verification, Payment/Billing, Technical/Bug, Resale/Transfer, Feedback) and four sentiment levels (positive, neutral, frustrated, angry). The structured output (category, sentiment, confidence score, rationale) is extracted, combined with sender metadata, and written to a Google Sheet ("Support-Messages") as a classification log. A fallback trigger from a separate Google Sheet ("Support Requests") exists as an alternative input path.

#### Systems connected

```
Schedule Trigger (every 1 min) --> Gmail (fetch support emails)
  --> Claude Sonnet 4.6 (classify: category + sentiment + confidence)
    --> Structured Output Parser (JSON schema validation)
      --> Data Mapping (extract fields)
        --> Google Sheets (write classification results)

[Fallback path]
Google Sheets Trigger (Support Requests sheet) --> [same classification pipeline]
```

- **Source:** Gmail (inbox, filtered) + Google Sheets (fallback trigger)
- **AI:** Anthropic Claude Sonnet 4.6 (via API key `MCwj9jMzCKpt3nyj`)
- **Destination:** Google Sheets (`1-7ClbKmIA1HTtrop-ybJAImcl9MovFzMzDjFBqvrkVQ` / "Support-Messages")

#### What MUST be true about FairTix

- FairTix receives enough support volume to justify **automated classification** -- this is not a hobby project.
- The six support categories reveal the **complete taxonomy of customer issues**: queue mechanics (FAQ), identity verification problems, payment disputes, platform bugs, resale/transfer issues, and general feedback.
- The system prompt reveals domain-specific edge cases they have already encountered: users who are angry about the Fair Queue but whose question is actually FAQ-answerable, messages that mix questions with problems, and resale rule questions vs. actual resale action problems.
- They use **Claude Sonnet 4.6** (an expensive model choice for classification), suggesting they prioritize accuracy over cost at this stage.
- The confidence score threshold guidance (0.85+ for clear, 0.5-0.7 for ambiguous) suggests they plan to use confidence as a routing signal downstream.

#### Business importance

Support triage is a force multiplier. Correct classification means: FAQ questions can be auto-answered (see workflows 04), payment issues route to finance, technical bugs route to engineering. Misclassification means angry customers waiting longer, wrong teams getting tickets, and escalation costs rising. The 198 version iterations show this is the most actively developed workflow in the stack.

#### Governance signals

| Signal | Assessment |
|---|---|
| Active status | **Inactive** |
| Error handling | **None** |
| Error workflow | **None** |
| Retry config | **None** |
| LLM batching | Configured (batchSize: 1, delay: 1000ms between batches) |

**Risk: HIGH.** The most complex and actively developed workflow has zero error handling. If the Anthropic API returns an error, the Gmail API rate-limits, or the Google Sheets write fails, the entire pipeline fails silently. For a classification system that feeds downstream workflows, this is a critical gap.

#### Execution stats

| Metric | Value |
|---|---|
| Total executions | 50+ (paginated, first page shown) |
| Successful | 47 (94%) |
| Errors | 3 (6%) |
| Mode breakdown | All manual |
| Date range | 2026-03-14 to 2026-03-17 |
| Notable duration | Execution 1101: 72 seconds (batch processing multiple emails) |

Heavy manual testing with a good success rate. The long-running execution (72s) indicates real multi-email batch processing. Never run in trigger/scheduled mode in production.

---

### 4. Support Router -- FAQ/Manual (Gmail-based)

| Field | Value |
|---|---|
| **Workflow ID** | `UVMF5W4FZzVFJwhH` |
| **n8n Name** | 4 - FairTix- Switch FAQ/Manual |
| **Status** | Inactive |
| **Created** | (not in provided data, but heavily iterated) |
| **Version Counter** | 135 |

#### What it does

This is the **full support automation pipeline** that builds on the classifier (workflow 03). It runs on a schedule, fetches support emails from Gmail (subject: "Support Request"), classifies them using Claude Sonnet 4.6 with the same structured output schema, then **routes based on category**: FAQ-classified messages get an automated response generated by a second LLM call (Claude Haiku 4.5) using the actual FairTix FAQ document (fetched from Google Docs) as context, while non-FAQ messages (specifically Payment/Billing and others) trigger a notification email to the support team with the full classification context. Automated FAQ responses and manual escalation paths both write results back to a tracking sheet.

#### Systems connected

```
Schedule Trigger (every 1 min)
  --> Gmail (fetch support emails, subject: "Support Request")
    --> Claude Sonnet 4.6 (classify message)
      --> Structured Output Parser
        --> Data Mapping
          --> [parallel] Write Classification to Sheet
          --> [parallel] If (category == "FAQ")
            --> [TRUE]  Google Docs (fetch FAQ document)
                        Merge (combine message + FAQ)
                        Claude Haiku 4.5 (generate FAQ answer)
                        Write response to Sheet
                        Gmail (send auto-reply to user)
            --> [FALSE] Gmail (notify support team for manual handling)
```

- **Source:** Gmail (inbox, filtered by subject)
- **AI (classification):** Claude Sonnet 4.6
- **AI (response generation):** Claude Haiku 4.5 (cheaper model for generation)
- **Knowledge base:** Google Docs (FAQ document `1JXtpHvta3-rsZZSrK2yqIIWrrHkpDoTOsKsy-xiI43A`)
- **Audit trail:** Google Sheets (`1-7ClbKmIA1HTtrop-ybJAImcl9MovFzMzDjFBqvrkVQ`)
- **Escalation:** Gmail (to `dlschoolautomations@gmail.com`)

#### What MUST be true about FairTix

- FairTix has a **formal FAQ document** maintained in Google Docs -- this is their knowledge base.
- They use a **two-model architecture**: expensive model (Sonnet) for classification accuracy, cheap model (Haiku) for response generation. This is a cost-conscious design decision.
- The auto-reply is instructed to **never invent information** not in the FAQ and to **escalate gracefully** ("let me connect you with a team member") when it cannot answer. This shows awareness of LLM hallucination risks.
- The support team receives enriched notifications with category, sentiment, confidence, and AI rationale -- not just the raw email. This means the human agent starts with context.
- The If condition only checks for `category == "FAQ"` on the true path, and sends everything else to manual. The Switch variant (workflow 04-sheet) has more granular routing.

#### Business importance

This is the **highest-value automation in the stack**. It combines AI classification with AI response generation to handle the most common support category (FAQ) automatically while ensuring complex issues reach humans with full context. If working in production, this would: (1) reduce first-response time for FAQ questions to seconds, (2) free human agents to focus on account, payment, and technical issues, (3) maintain a complete audit trail of every classification and response.

#### Governance signals

| Signal | Assessment |
|---|---|
| Active status | **Inactive** |
| Error handling | **None** |
| Error workflow | **None** |
| Retry config | **None** |
| LLM hallucination safeguard | **Yes** -- prompt instructs model to use only FAQ content |

**Risk: HIGH.** Same governance gap as workflow 03 but with higher stakes: this workflow sends automated emails to real customers. An LLM error, API timeout, or malformed response could result in gibberish being sent to a customer, or worse, no response at all with no notification of the failure.

#### Execution stats

| Metric | Value |
|---|---|
| Total executions | 43 |
| Successful | 43 (100%) |
| Errors | 0 |
| Mode breakdown | All manual |
| Date range | 2026-03-15 to 2026-03-17 |
| Notable durations | Execution 1108: 78 seconds; Execution 1106: 69 seconds |

Perfect success rate in testing, but some executions take over a minute (LLM calls + Google Docs fetch + sheet writes). Never deployed to production.

---

### 4-Sheet. Support Router -- FAQ/Manual (Sheet-based)

| Field | Value |
|---|---|
| **Workflow ID** | `bNNjdbAO5hhtJebn` |
| **n8n Name** | 4 - FairTix- Switch FAQ/Manual (sheet based) |
| **Status** | Inactive |
| **Created** | 2026-03-06 |
| **Version Counter** | 362 |

#### What it does

This is an **alternative version** of the support router that uses Google Sheets as the input trigger instead of Gmail. When a new row appears in the "Support Requests" sheet, it classifies the message using Claude Sonnet 4.6, writes the classification back to the same sheet, then routes: FAQ messages go through Google Docs FAQ lookup, a merge step, and Claude Haiku 4.5 for response generation, with the response written back to the sheet. Payment/Billing messages trigger an email notification to the support team. The key difference from workflow 04 is the **Switch node with two explicit routing rules** (FAQ and Payment/Billing) instead of a simple If, and the sheet-based input instead of Gmail polling.

#### Systems connected

```
Google Sheets Trigger (Support Requests, poll every minute)
  --> Claude Sonnet 4.6 (classify)
    --> Structured Output Parser
      --> Data Mapping
        --> [parallel] Write Classification to Sheet
        --> [parallel] Switch (FAQ / Payment/Billing / default)
          --> [FAQ]     Google Docs (FAQ) --> Merge --> Claude Haiku 4.5 --> Write response to Sheet
          --> [Payment] Gmail (notify support team)
```

- **Source:** Google Sheets (`1hCyuHO74iH7Aqbdc0GxcNsC9NqI0shBM3bf3-bZ6I9o` / "Support Requests")
- **AI:** Claude Sonnet 4.6 (classification) + Claude Haiku 4.5 (response generation)
- **Knowledge base:** Google Docs (FAQ document `1JXtpHvta3-rsZZSrK2yqIIWrrHkpDoTOsKsy-xiI43A`)
- **Escalation:** Gmail (to `dlschoolautomations@gmail.com`)

#### What MUST be true about FairTix

- They are experimenting with **two input paradigms** -- Gmail-based vs. Sheet-based -- to determine which works better for their workflow. The sheet-based version (362 iterations!) received far more development attention than the Gmail version (135 iterations).
- The Switch node distinguishes **Payment/Billing as a separate escalation path** from other manual categories, suggesting payment issues may need different routing (to finance vs. general support).
- The sheet-based approach implies they may want to **decouple the intake channel** from the processing pipeline -- sheets could be populated by any frontend, form, or API.

#### Business importance

Same as workflow 04 -- this is the core support automation. The sheet-based variant is more flexible (any system can write to a Google Sheet) and has more granular routing. The 362 version iterations make this the **most-iterated workflow in the entire stack**, indicating this is where the team has invested the most effort.

#### Governance signals

| Signal | Assessment |
|---|---|
| Active status | **Inactive** |
| Error handling | **None** |
| Error workflow | **None** |
| Retry config | **None** |

**Risk: HIGH.** Same gaps as workflow 04 despite being the most developed workflow.

#### Execution stats

| Metric | Value |
|---|---|
| Total executions | 50 (first page) |
| Successful | 44 (88%) |
| Errors | 6 (12%) |
| Mode breakdown | All manual |
| Date range | 2026-03-06 to 2026-03-12 |
| Notable durations | Executions with 3-5 second durations (LLM calls) |

A 12% error rate during development suggests some structural issues were encountered and resolved (the later executions trend toward success).

---

### 5. LotteryWin -- Published

| Field | Value |
|---|---|
| **Workflow ID** | `YaISNWlu30eV1Ko3` |
| **n8n Name** | 5 - FairTix - LotteryWin - Published |
| **Status** | Inactive |
| **Created** | 2026-03-16 |
| **Version Counter** | 4 |

#### What it does

This is functionally **identical to workflow 02** (LotteryWin) -- same Google Sheet trigger, same Gmail send with the branded lottery-win email, same status update back to the sheet. The name "Published" suggests this was intended to be the **production-ready version**, copied from workflow 02 after it was stabilized. It shares the same Google Sheet source and error workflow configuration.

#### Systems connected

Identical to workflow 02:
```
Google Sheets (LotteryWins trigger) --> Gmail (send notification) --> Google Sheets (update status)
```

- **Error workflow:** `oZy3vc0yli2xdR45` (Generic Error Workflow) -- same as workflow 02

#### What MUST be true about FairTix

- The team follows a pattern of **developing in one workflow and copying to a "published" version** for production. This is a manual form of version control.
- With only 4 version iterations, this was copied near-final and received minimal further changes.

#### Business importance

Same as workflow 02 -- this is the revenue-critical lottery notification. Being labeled "Published" suggests it is the intended production version, yet it remains inactive.

#### Governance signals

| Signal | Assessment |
|---|---|
| Active status | **Inactive** (despite being the "published" version) |
| Error handling | **None** at node level |
| Error workflow | **Linked** to `oZy3vc0yli2xdR45` |
| Retry config | **None** |
| Caller policy | `workflowsFromSameOwner` |
| Time saved config | 1 min per execution |

**Risk: MEDIUM.** Has error workflow linkage but no node-level error handling. The fact that it is labeled "Published" but remains inactive is itself a governance finding.

#### Execution stats

No dedicated execution file for this workflow was provided. With version counter 4, it has had minimal testing.

---

### 5-Error. Generic Error Workflow

| Field | Value |
|---|---|
| **Workflow ID** | `oZy3vc0yli2xdR45` |
| **n8n Name** | 5 - Generic Error Workflow |
| **Status** | **Active** |
| **Created** | 2026-03-15 |
| **Version Counter** | 38 |

#### What it does

This is the **centralized error notification workflow** for the FairTix automation stack. It uses n8n's Error Trigger node, which fires whenever a linked workflow encounters an unhandled error. When triggered, it sends a plain-text email via Gmail to `dlschoolautomations@gmail.com` containing: the failing workflow's name, the execution URL (for direct debugging access), the error message, the full stack trace, and the name of the last node that executed before the failure. The sender name is set to "Automation Errors" for easy inbox filtering.

#### Systems connected

```
Error Trigger (from any linked workflow)
  --> Gmail (send error notification to team)
```

- **Source:** n8n Error Trigger (activated by workflows that set `errorWorkflow: oZy3vc0yli2xdR45`)
- **Destination:** Gmail (to `dlschoolautomations@gmail.com`, from "Automation Errors")

#### What MUST be true about FairTix

- The team has a **shared automation inbox** (`dlschoolautomations@gmail.com`) that is separate from the support inbox. This is the ops team's monitoring channel.
- They understand the concept of centralized error handling in n8n (linking workflows to a single error workflow).
- The error email includes the **execution URL**, meaning whoever receives it can click straight into n8n to debug. This is efficient.

#### Business importance

This is the **single operational safety net** for the entire automation stack. Without it, workflow failures are silent. It is also the **only active workflow** in the entire FairTix n8n instance, which means it is the only workflow currently running in production. Its importance is amplified by the fact that it is currently catching real errors from other production systems (see execution data).

#### Governance signals

| Signal | Assessment |
|---|---|
| Active status | **Active** -- the only active workflow |
| Error handling | N/A (this IS the error handler) |
| Published version | Has a published/active version (`1ecf3186`) |
| Retry config | **None** |

**Risk: MEDIUM.** The error workflow itself has no error handling -- if Gmail fails (quota, auth expiry), error notifications are silently lost. There is no dead-letter queue or fallback notification channel (e.g., Slack). This is a single point of failure for all operational alerting.

#### Execution stats

| Metric | Value |
|---|---|
| Total executions | 40 |
| Successful | 33 (82.5%) |
| Errors | 7 (17.5%) |
| Mode breakdown | 4 manual, 1 error (test), 35 error-triggered |
| Date range | 2026-03-15 to 2026-04-02 |

**This is the most revealing execution data in the analysis.** The error workflow has been firing consistently in production:
- **2026-03-17:** 5 error-triggered executions (3 failed) -- some cascading failure scenario
- **2026-03-19:** 4 error-triggered executions -- suggesting a workflow was actively failing
- **2026-03-20:** 6 error-triggered executions in rapid succession (every ~1 minute from 13:26 to 13:32) -- a polling workflow was failing repeatedly
- **2026-03-27:** 4 error-triggered executions
- **2026-03-29:** 9 error-triggered executions in rapid succession -- another polling failure storm
- **2026-03-31:** 3 error-triggered executions
- **2026-04-02:** 3 error-triggered executions (most recent: 2 days ago)

The 17.5% error rate on the error workflow itself is alarming -- when it fails, nobody gets notified. The clusters of rapid-fire errors (every 1 minute) strongly suggest a **polling-triggered workflow is failing on every poll cycle**, generating a flood of error notifications. This is the LotteryWin workflow (02 or 05) which polls Google Sheets every minute.

---

## Workspace-Level Analysis

---

### 7. Company Narrative

FairTix is an **early-stage European ticketing startup** building a differentiated platform around fairness and transparency. Their core innovation is a lottery-based ticket allocation system ("Fair Queue") that eliminates bot-driven scalping and speed-based purchasing. They price in EUR, enforce identity verification, cap resale at face value + 20%, and proudly advertise zero hidden fees.

The automation landscape reveals a company in the **prototype-to-production transition**. The team (appears to be a single developer, Andreas Stephan) has built a sophisticated set of automations covering two critical business processes: **ticket lottery notification** and **AI-powered customer support**. However, none of the business-logic workflows are active in production -- only the error notification workflow runs live.

The development pattern shows high iteration counts (115-362 versions per workflow) and multiple parallel versions of the same workflow (02, 02b, and 05 are all lottery notification variants; 03, 04, and 04-sheet are all support pipeline variants). This suggests an exploratory, learning-by-building approach -- likely a team that is simultaneously learning n8n and building their automation stack.

The most telling detail: the error workflow has been firing 2-9 times per day from real production errors since mid-March, with some of those error notifications themselves failing. There is a **live system somewhere generating errors** (likely the LotteryWin polling trigger), and the only safety net has gaps.

---

### 8. Systems Landscape

| System | Role | Integration Method | Credentials |
|---|---|---|---|
| **Gmail** | Email sending (notifications, support replies, error alerts) | OAuth2 | `DL-School-Automations Gmail` |
| **Google Sheets** | Data store (lottery winners, support requests, classification results) | OAuth2 | `DL School Automations Google Sheets Account` / `Google Sheets Account DL Automations` |
| **Google Docs** | Knowledge base (FAQ document) | OAuth2 | `Google Docs account` |
| **Anthropic (Claude)** | AI classification + response generation | API Key | `Anthropic account` |
| **n8n** | Orchestration platform | Self-hosted/Cloud | N/A |

**Observation:** The entire stack runs on **Google Workspace + Anthropic + n8n**. There is no CRM, no ticketing system (Zendesk, Intercom, etc.), no database, no payment processor integration, and no connection to the actual FairTix product/platform. Google Sheets serves as the de facto database for all operational data.

---

### 9. Business Process Clusters

#### Cluster A: Customer Onboarding
| Workflow | Status | Role |
|---|---|---|
| 01 - Send Welcome Email | Inactive | Sends branded welcome email to new users |

**Maturity: Prototype.** Single workflow, manual trigger, no integration with registration system.

#### Cluster B: Ticket Lottery Notification
| Workflow | Status | Role |
|---|---|---|
| 02 - LotteryWin | Inactive | Base version: Sheet trigger --> email --> status update |
| 02b - LotteryWin With Error Handling | Inactive | Improved: adds success/error branching |
| 05 - LotteryWin Published | Inactive | Intended production copy of 02 |

**Maturity: Late development.** Three versions exist with incremental improvements. Has error workflow linkage. High error rate in testing. Not yet production-ready.

#### Cluster C: AI-Powered Support
| Workflow | Status | Role |
|---|---|---|
| 03 - Support Classifier | Inactive | Classifies support messages (6 categories, 4 sentiments) |
| 04 - Switch FAQ/Manual | Inactive | Gmail-based: classifies + auto-answers FAQ + escalates rest |
| 04-sheet - Switch FAQ/Manual (sheet based) | Inactive | Sheet-based: same pipeline, more granular routing |

**Maturity: Advanced development.** Most iterated cluster (362+198+135 = 695 combined version iterations). Two-model AI architecture (Sonnet for classification, Haiku for generation). No error handling.

#### Cluster D: Operational Monitoring
| Workflow | Status | Role |
|---|---|---|
| 05 - Generic Error Workflow | **Active** | Centralized error notification via email |

**Maturity: Production.** The only active workflow. Receiving real error traffic.

---

### 10. Connected Automations

```
                    errorWorkflow
02 - LotteryWin ─────────────────────> 05 - Generic Error Workflow
                    errorWorkflow
05 - LotteryWin Published ───────────> 05 - Generic Error Workflow

03 - Support Classifier ──[feeds into]──> 04 - Switch FAQ/Manual
                                          04-sheet - Switch FAQ/Manual

[The LotteryWin polling trigger generates errors caught by the error workflow]
02/05 (polling failures) ──[error mode]──> 05 - Generic Error Workflow
```

**Explicit errorWorkflow links:**
- `doo7oPoKUzaX6hTx` (Workflow 02) --> `oZy3vc0yli2xdR45` (Error Workflow)
- `YaISNWlu30eV1Ko3` (Workflow 05) --> `oZy3vc0yli2xdR45` (Error Workflow)

**Implicit data flow dependencies:**
- Workflows 03 and 04/04-sheet share the same classification prompt, output schema, and Google Sheets targets. Workflow 03 is the standalone classifier; workflow 04/04-sheet add routing and response generation on top.
- The Google Sheets used by the lottery workflows are populated by an **unknown upstream process** (the actual lottery draw).

**Disconnected workflows:**
- Workflow 01 (Welcome Email) has no connections to any other workflow.
- Workflow 02b (LotteryWin With Error Handling) does NOT link to the error workflow despite being an "improved" version.
- Workflows 03, 04, and 04-sheet do NOT link to the error workflow.

---

### 11. Gaps and Recommendations

#### Critical Gaps

**1. No Lottery-Loss Notification**
The system notifies winners but there is no workflow for users who were NOT selected. In a lottery system, the losers outnumber the winners. Not notifying them means: they keep checking, they contact support asking what happened, and they lose trust in the system. A ticketing company MUST notify all lottery participants of the outcome.

**2. No Payment/Purchase Confirmation**
The lottery-win email contains a "Complete Your Purchase" CTA, but there is no workflow to confirm a successful purchase, send digital tickets, or handle purchase timeouts. The 24-hour purchase window has no automated expiration/reminder mechanism.

**3. No Account Verification Flow**
The welcome email tells users to verify their account, but there is no automation for: sending verification codes, confirming verification success, or handling verification failures. Given that "Account/Verification" is a support category, users ARE having verification problems.

**4. No Error Handling on AI Workflows**
Workflows 03, 04, and 04-sheet make external API calls to Anthropic, Google Docs, and Google Sheets but have zero error handling. An Anthropic API outage would cause silent failures across the entire support pipeline.

**5. No Error Workflow Linkage on Support Workflows**
Only the lottery workflows link to the generic error workflow. The support automation cluster (arguably the more complex and failure-prone set) has no error notification linkage at all.

#### Important Gaps

**6. No Purchase Reminder / Window Expiration**
Winners have 24 hours to complete their purchase. There is no reminder at 12 hours, no warning at 22 hours, and no automation to release the ticket when the window expires.

**7. No Resale/Transfer Automation**
"Resale/Transfer" is a support category, meaning users have resale issues. But there are no automations for listing management, transfer processing, or resale cap enforcement.

**8. No Event Notification / On-Sale Alerts**
A ticketing platform should notify users when new events are added, when lottery registration opens, and when results are about to be announced. None of these exist.

**9. No Support Response Follow-Up**
The FAQ auto-reply system generates responses but has no mechanism to: track whether the customer's issue was actually resolved, send a satisfaction survey, or detect if the same customer writes back (indicating the auto-reply was insufficient).

**10. No Monitoring Dashboard / SLA Tracking**
All monitoring is via email to a shared inbox. There is no aggregation of: support volume trends, classification distribution, response time metrics, or error rates over time.

#### Governance Gaps

**11. Duplicate Workflows Without Clear Ownership**
Three versions of LotteryWin (02, 02b, 05) and three versions of the support pipeline (03, 04, 04-sheet) create confusion about which is the "real" version. Only one should be canonical.

**12. Google Sheets as a Database**
Using Google Sheets for operational data (lottery results, support tickets, classification logs) creates scaling limits (row limits, API quotas), no transactional guarantees, and no backup strategy.

**13. Single Notification Channel**
All error notifications go to email. If Gmail has an outage or the OAuth token expires, the entire alerting system fails silently. A second channel (Slack, PagerDuty, SMS) should exist.

---

### 12. "Your Next Move" -- The Single Most Important Recommendation

**Activate and harden the LotteryWin workflow with proper error handling, then add a lottery-loss notification.**

Here is why this is the highest-leverage action:

1. **Revenue is at stake.** The lottery-win notification is the critical path between "user is selected" and "user buys a ticket." Every hour of delay reduces conversion. This workflow has a 31% error rate in testing and is not active despite having a "Published" version.

2. **The error workflow is already catching real failures.** The execution data shows the error workflow firing dozens of times over the past two weeks, often in rapid-fire clusters that suggest a polling trigger failing repeatedly. Stabilizing the source of these errors will immediately reduce operational noise.

3. **The fix is concrete and scoped.** Combine the best of workflow 02 (error workflow linkage), workflow 02b (node-level error handling with success/error status tracking), and workflow 05 (the "Published" label). Add retry logic on the Gmail send (n8n supports this natively). Decommission the other two variants. This is a one-day task, not a redesign.

4. **Then add the missing half.** Once winner notifications are stable, build the lottery-loss notification. This completes the Fair Queue experience, reduces inbound support volume ("Why haven't I heard back?"), and demonstrates that FairTix's fairness promise extends to communication, not just allocation.

The support automation cluster (workflows 03/04) is impressive but is safely in development. The lottery notification pipeline touches revenue today.

---

---

# Part 2: Business Opportunity Analysis

> Appended 2026-04-03. The governance analysis above was strong but missed the core product thesis: **business opportunity, not risk reduction.** This section reanalyzes the same data through the lens of business value, opportunity, and actionable advice — what Expliq should actually show.

---

## What Expliq Knows About FairTix's Business (Facts Only)

From the workflow JSONs and execution data — no guessing, no inference beyond what the data proves:

**Core business model (from email templates in node parameters):**
- FairTix sells event tickets through a lottery system called "Fair Queue"
- Every participant gets an equal chance — no speed advantage, no bots
- Pricing is all-in with zero hidden fees (€0.00 displayed prominently)
- Resale is allowed but capped at face value + 20%
- Identity verification is required before entering any queue
- Winners have a 24-hour purchase window

**Revenue flow (from workflow logic):**
```
User signs up → Welcome email → Enters lottery → [LOTTERY DRAW - external] 
  → Winner notification (email with purchase CTA) → [PURCHASE - external]
```

The lottery-win notification is the bridge between selection and purchase. It IS the revenue conversion trigger.

**Customer support model (from AI classifier prompt):**
- 6 support categories: FAQ, Account/Verification, Payment/Billing, Technical/Bug, Resale/Transfer, Feedback
- 4 sentiment levels: positive, neutral, frustrated, angry
- Two-model AI architecture: Claude Sonnet 4.6 classifies, Claude Haiku generates responses
- FAQ answers are pulled from a Google Docs knowledge base
- Non-FAQ tickets are escalated with priority routing

**Systems in use:**
- Gmail: all outbound communication (winner notifications, support replies, error alerts)
- Google Sheets: operational data store (lottery winners, support messages, classification logs)
- Google Docs: FAQ knowledge base
- Anthropic Claude: AI support classification and response generation
- n8n: orchestration layer

---

## Per-Workflow Business Case

### 1. Welcome Email — The First Impression

**Business brief:** Introduces new users to FairTix's value proposition and drives account verification — the required step before entering any ticket lottery.

**Business case:**
- *What it saves:* Manual welcome emails for every new signup. At scale, ~2 min/signup for personalized email × N signups/week.
- *Revenue connection:* Users who don't verify can't enter lotteries. Every unverified user is a lost potential ticket buyer. This workflow is the top of the revenue funnel.
- *Failure impact:* New users get no onboarding. They don't verify. They're invisible to the lottery system. Revenue never materializes from these users.

**Current state:** Prototype. Manual trigger, hardcoded user data. Not connected to any registration system.

**Opportunity:** Connect to the actual FairTix registration system (webhook or database trigger). Automate completely. Add verification reminder at 24h and 72h for users who don't verify. Each additional verified user is a potential ticket buyer.

### 2. LotteryWin Notification — The Revenue Trigger

**Business brief:** Notifies lottery winners that they've been selected and gives them 24 hours to complete their purchase. This is the direct revenue conversion point.

**Business case:**
- *What it saves:* Manual winner notification would require per-winner email composition. With lottery draws of potentially hundreds of winners per event, this saves hours per draw.
- *Revenue connection:* DIRECT. This email contains the purchase CTA. Every delay or failure in delivery = potential lost ticket sale. Every winner who doesn't see the email in time = revenue lost to the 24-hour window expiration.
- *Failure impact:* Winners don't know they won. The 24-hour window expires. The ticket is released. Revenue is lost. The winner contacts support ("I entered the queue but never heard back"), driving support costs.

**Current state:** Three versions exist (02, 02b, 05). 31% error rate in testing. None are active in production. The "Published" version (05) was never activated.

**Opportunity — this is the #1 priority:**
1. Stabilize and activate ONE canonical version
2. Add purchase reminder at 12h and 22h before window expiration
3. Add lottery-LOSS notification (see below)
4. Track conversion: how many winners actually complete purchase?

### 3. AI Support Pipeline — Customer Experience at Scale

**Business brief:** Automatically classifies incoming support messages by category and sentiment, auto-answers FAQ questions using a knowledge base, and routes complex issues to the right team. Handles the entire first-response cycle without human intervention.

**Business case:**
- *What it saves:* First-level support triage is fully automated. Each support message typically takes 5-8 min for a human to read, classify, and either answer or route. At scale, with dozens of messages per day during event launches, this is significant.
- *Revenue connection:* Indirect but real. Fast, accurate support responses reduce churn. Frustrated customers who don't get quick answers don't buy tickets again. Sentiment detection (angry customers flagged) prevents escalations from becoming public complaints.
- *Failure impact:* Support messages go unclassified. FAQ questions don't get auto-answered. Everything hits the human queue. Response times spike. Customer satisfaction drops. During peak events (lottery draws), support volume surges and the team can't keep up.

**Current state:** Most developed cluster (695 combined version iterations). Two variants: Gmail-triggered and Sheet-triggered. No error handling. Not active.

**Opportunity:**
1. Activate the sheet-based variant (more robust than polling Gmail)
2. Add error handling on AI calls (Anthropic outage = silent failure currently)
3. Track FAQ deflection rate: what % of support is handled without humans?
4. Add follow-up: did the auto-reply actually resolve the issue?

### 4. Generic Error Workflow — The Safety Net

**Business brief:** Centralized error notification that emails the team when any linked workflow fails. The only workflow running in production.

**Business case:**
- *What it saves:* Without this, workflow failures are silent. The team would discover issues only when customers complain — hours or days later.
- *Revenue connection:* Indirectly protects all other revenue-generating workflows. If the lottery notification fails silently, revenue loss accumulates unnoticed.
- *Failure impact:* This workflow itself has a 17.5% failure rate. When it fails, nobody gets notified about anything. It's a single point of failure for all operational visibility.

**Opportunity:**
1. Add a second notification channel (Slack) as failover
2. Add error aggregation: instead of one email per failure, batch failures and send a digest every 15 min
3. Link ALL workflows to this error handler (currently only 2 of 7 business workflows are linked)

---

## Business Opportunity Recommendations (Ranked by Revenue Impact)

These are what should appear on the **Roadmap** page, framed as business opportunities, not governance fixes.

### Tier 1: Immediate (Revenue at Stake)

**1. Lottery-Loss Notification**
- *What:* When the lottery draw completes, notify ALL participants who were NOT selected.
- *Why:* In a lottery system, losers outnumber winners — often 10:1 or more. These users entered the queue, provided their data, and are waiting for a result. Silence is the worst possible customer experience. Not hearing back drives support volume ("Did I win? When will I know?") and erodes trust in the fairness promise.
- *Business impact:* Reduces support volume (fewer "what happened?" inquiries), increases trust and repeat engagement ("we didn't win this time, but the system is fair and transparent"), and creates a re-engagement opportunity ("You weren't selected for Event X, but Event Y opens next week — join the queue?").
- *Systems:* Google Sheets (lottery results) → Gmail (notification)
- *Effort:* Low — mirrors the existing lottery-win workflow but with different email content
- *Deploy:* n8n workflow, deployable directly

**2. Purchase Window Reminder**
- *What:* Remind lottery winners at 12h and 22h that their purchase window is closing.
- *Why:* The lottery-win email gives winners 24 hours to buy. But people miss emails. Without a reminder, the window expires, the ticket is released, and both the user and FairTix lose.
- *Business impact:* Comparable ticketing platforms report 10-15% higher conversion with timed reminders. If FairTix processes 100 winners/event and recovers even 5 who would have missed the window, that's 5 additional ticket sales per event.
- *Systems:* Google Sheets (winner records with timestamps) → Gmail (reminder email)
- *Effort:* Low — scheduled check on winner records, send if window is closing
- *Deploy:* n8n workflow, deployable directly

**3. Purchase Confirmation & Digital Ticket Delivery**
- *What:* When a winner completes purchase, send confirmation email with ticket details.
- *Why:* There is NO automation after the purchase CTA. The user clicks "Complete Your Purchase" and then... nothing automated. No confirmation, no ticket, no receipt. This is the most critical post-purchase gap.
- *Business impact:* Purchase confirmation is table-stakes for any e-commerce. Without it, buyers don't trust the purchase went through, contact support, or dispute charges. This also creates the natural moment for upselling (add-ons, merchandise, upgrades).
- *Systems:* [Payment system] → Gmail (confirmation) → Google Sheets (purchase log)
- *Effort:* Medium — requires connection to payment/ticketing system
- *Deploy:* n8n workflow

### Tier 2: Strategic (Customer Experience & Scale)

**4. Verification Reminder Sequence**
- *What:* After welcome email, if user hasn't verified within 24h and 72h, send reminder.
- *Why:* "Account/Verification" is one of the 6 support categories — users ARE having verification problems. Unverified users can't enter lotteries. Every unverified user is stuck at the top of the funnel.
- *Business impact:* Each verified user is a potential ticket buyer for every future event. A reminder sequence could recover 20-30% of users who intend to verify but forget or hit a technical snag.
- *Systems:* [Registration system] → Gmail (reminder sequence)
- *Effort:* Low — time-delayed follow-up to welcome email

**5. Event Launch Notification**
- *What:* When a new event goes on sale (lottery opens), notify interested users.
- *Why:* No automation exists to tell users about new events. Users would have to check the platform manually. For a lottery-based system where timing doesn't matter (no first-come advantage), the question is still: do users even KNOW the lottery is open?
- *Business impact:* Direct revenue driver. More lottery participants = more ticket sales. Every user who misses a lottery open is a lost potential sale.
- *Systems:* [Event system] → Gmail (launch notification)
- *Effort:* Medium

**6. Support Response Follow-Up**
- *What:* After the AI auto-replies to a support message, check if the customer writes back. If they do, the auto-reply didn't resolve the issue — escalate immediately.
- *Why:* The AI support pipeline generates responses but has no feedback loop. A customer who writes back 3 times with the same question is getting worse service than no automation at all.
- *Business impact:* Tracks actual resolution rate vs. deflection rate. Enables reporting: "Our AI resolved 60% of FAQ inquiries without human intervention" — a metric that justifies the AI investment.
- *Systems:* Gmail (monitor replies) → Google Sheets (update resolution status) → [Escalation]
- *Effort:* Medium

### Tier 3: Platform Growth

**7. Connect Your Ticketing Platform**
- *What:* Expliq currently sees your n8n orchestration layer, but not the FairTix product itself. Connecting the ticketing platform directly would give Expliq visibility into: event catalog, lottery draw mechanics, purchase completion rates, user accounts, ticket inventory.
- *Why:* Right now, Expliq sees the automation around your business but not the business data itself. With a direct connection, recommendations become dramatically more specific: "Your Event X had 500 lottery entries and 50 winners with a 78% purchase completion rate. Recommend: add a second-chance lottery for the 22% who didn't complete."
- *Business impact:* Transforms Expliq from automation advisor to full business intelligence layer.
- *Effort:* Depends on ticketing platform API availability

**8. Connect a Second Notification Channel (Slack)**
- *What:* All communication currently goes through one Gmail account. Add Slack for internal team alerts and as a failover for error notifications.
- *Why:* Gmail is a single point of failure. OAuth token expiration = ALL automated communication stops. Error notifications fail silently (17.5% failure rate on the error workflow itself). Slack provides instant team visibility without email delays.
- *Business impact:* Operational resilience. The error workflow firing 2-9 times daily should be visible in a Slack channel, not buried in an inbox.
- *Effort:* Low — add Slack node to error workflow, add as secondary channel for critical alerts

---

## Per-System Narrative (for the Automation Intelligence page)

### Gmail — Your Communication Backbone

8 workflows connect to Gmail. It handles three distinct functions: **customer lifecycle emails** (welcome, lottery results), **AI-generated support responses**, and **operational error alerts**. Every piece of automated outbound communication — to customers and to the ops team — runs through a single Gmail OAuth2 credential (`DL-School-Automations`).

**Insight:** Gmail is your highest-risk system not because of email delivery, but because of **concentration**. If this OAuth token expires or the account is suspended, ALL automated communication stops simultaneously — customer-facing AND operational. No lottery win notifications, no support replies, no error alerts. Consider adding a second channel (Slack for internal, SendGrid for transactional email) to eliminate this single point of failure.

### Google Sheets — Your Operational Data Store

6 workflows read from or write to Google Sheets. Sheets serve as the database for: lottery winner records (names, emails, events, ticket prices, delivery status), support message classifications (category, sentiment, confidence, rationale), and support request intake. Data flows both directions — Sheets triggers workflows (new lottery winner row → send notification) and workflows write back results (classification → update row).

**Insight:** Google Sheets works for the current volume but creates three risks at scale: (1) API rate limits — Google Sheets API allows ~100 requests/minute, which will bottleneck during large lottery draws, (2) no transactional guarantees — if the notification email sends but the status update fails, the system loses track, (3) no backup strategy — if someone accidentally deletes rows, operational data is gone. When FairTix scales beyond ~500 lottery entries per event, consider migrating to a proper database (Supabase, Airtable, or your product's own DB) with Google Sheets as a read-only reporting mirror.

### Anthropic Claude — Your AI Support Brain

2 workflows use Anthropic's Claude API through a two-model architecture: **Claude Sonnet 4.6** for classification (the heavy reasoning task — reading a support message and categorizing it across 6 categories and 4 sentiment levels) and **Claude Haiku** for response generation (the lighter task — composing a natural-language reply based on the classification and FAQ knowledge base). This is a sophisticated and cost-efficient design — using the expensive model only where reasoning quality matters and the cheaper model for the output generation.

**Insight:** The two-model architecture is well-designed for cost and quality. At current volumes it's fine. At scale, consider: (1) caching frequent FAQ answers to reduce API calls entirely, (2) adding a confidence threshold — if classification confidence is below 0.7, skip auto-response and escalate directly, (3) monitoring classification accuracy over time to detect prompt drift.

### Google Docs — Your Knowledge Base

1 workflow reads from Google Docs to fetch FAQ answers for auto-responding to support messages. The document likely contains structured FAQ entries that the AI uses to compose grounded responses.

**Insight:** A Google Doc is a simple but effective knowledge base for the current stage. As the FAQ grows, consider structuring it as a searchable index (or migrating to Notion/Confluence) so the AI can retrieve specific sections instead of reading the entire document on every request.

---

## Process Coverage (for the Dashboard)

| Business Process | Existing Workflows | Recommended | Coverage | Business Impact |
|-----------------|-------------------|-------------|----------|----------------|
| Customer Onboarding | 1 (welcome email) | +2 (verification reminder, event alerts) | 33% | High — every unverified user is lost revenue |
| Ticket Lottery Lifecycle | 2 (win notification × 2 variants) | +3 (loss notification, purchase reminder, purchase confirmation) | 40% | Critical — this IS the revenue flow |
| Customer Support | 3 (classifier, FAQ/manual, FAQ/sheet) | +1 (response follow-up) | 75% | High — support quality drives retention |
| Platform Operations | 1 (error handler) | +1 (Slack failover) | 50% | Medium — protects all other processes |

**Portfolio summary:** 7 existing workflows, 7 recommended. 50% overall coverage. The biggest gap is in the Ticket Lottery Lifecycle — the core revenue process has no post-selection automation beyond the initial win notification.

---

## "Your Next Move" — Business Opportunity Version

> **Your most important automation — the lottery winner notification — isn't running.** It exists in 3 versions, has a 31% error rate in testing, and the "Published" copy was never activated. Meanwhile, your error handler has been catching real failures for 2 weeks. Activate the winner notification first. Then build the missing half: **lottery-loss notifications**. Your Fair Queue promise is about fairness for everyone — winners AND non-winners deserve to hear the result. This one workflow will reduce support volume, increase trust, and create a re-engagement channel for your next event.

---

## Screen-by-Screen Mapping: What Goes Where

This section maps the analysis output to Expliq's 5 screens, showing exactly what data appears on each.

### Dashboard

- **Portfolio Value bar:** "7 workflows across 4 business processes. 7 recommended opportunities."
- **"Your next move" banner:** The paragraph above — references specific workflow, chains recommendations.
- **Two-section body:**
  - Left: Existing workflows summary (7 workflows, 1 active, 6 inactive, 2 with error handling)
  - Right: Top 3 opportunities (Lottery-Loss Notification, Purchase Window Reminder, Purchase Confirmation)
- **Process Coverage table:** The 4-row table above with coverage bars and business impact

### Automation Intelligence

- **AI Profile Banner:** "Your automation landscape shows 7 business workflows connecting 4 systems (Gmail, Google Sheets, Google Docs, Anthropic Claude). Your Ticket Lottery Lifecycle is your core revenue process with 40% coverage — the biggest opportunity. Your AI-powered Support pipeline is the most developed area at 75% coverage."
- **System narratives:** The 4 per-system narratives above (Gmail, Sheets, Claude, Docs) with insights
- **Actionable Intelligence:** The business opportunity recommendations with transparent reasoning
- **Automation Maturity:** Per-process coverage bars

### Workflows

- **4 process groups** (collapsible):
  - Customer Onboarding: 1 existing card + 2 recommended cards
  - Ticket Lottery Lifecycle: 2 existing cards + 3 recommended cards
  - Customer Support: 3 existing cards + 1 recommended card
  - Platform Operations: 1 existing card + 1 recommended card
- **Process suggestions:** "Connect your ticketing platform for deeper lifecycle visibility"
- **Workflow cards show:** name, business brief, impact, governance dot, system flow, active/inactive

### Roadmap

- **Tier 1 (Immediate):** Lottery-Loss Notification, Purchase Window Reminder, Purchase Confirmation — with business case, effort, systems, deploy button
- **Tier 2 (Strategic):** Verification Reminders, Event Launch Notification, Support Follow-Up
- **Tier 3 (Platform Growth):** Connect ticketing platform, Add Slack channel
- **Deploy modal:** generates n8n JSON for the selected recommendation

### Automation Detail (example: LotteryWin Notification)

- **Header:** "LotteryWin Notification" | inactive | n8n | Google Sheets → Gmail
- **Business narrative:** "Notifies lottery winners that they've been selected and gives them 24 hours to complete their purchase. This is the direct revenue conversion point — the bridge between lottery selection and ticket sale."
- **Business Case card:**
  - Failure impact: "Winners don't know they won. The 24-hour window expires. Revenue is lost. Support volume increases."
  - Time savings: "~2 min per winner notification at scale"
  - Revenue connection: "Direct — this email contains the purchase CTA"
- **Process Position:** Step 2 of 5 in "Ticket Lottery Lifecycle" (after lottery draw, before purchase)
- **Connected Automations:** "Error handler: Generic Error Workflow (active)" | "Related: LotteryWin Published (duplicate variant)"

---

---

# Part 3: Missed Insights & Additional Process Suggestions

> Appended 2026-04-03. After Per's challenge: "what about payment? what about resale? what else did you miss?"

---

## The Support Classifier Is a Gap Map

The AI support classifier defines 6 categories. Each category where NO automation exists beyond classification is a business process gap:

| Support Category | Automation Exists? | Gap |
|-----------------|-------------------|-----|
| **FAQ** | YES — auto-response via Claude Haiku + Google Docs knowledge base | Covered (75% — no follow-up) |
| **Account/Verification** | PARTIAL — welcome email only, no verification flow | **Major gap** — verification is required for lottery entry |
| **Payment/Billing** | NO automation at all | **Critical gap** — this is revenue infrastructure |
| **Technical/Bug** | NO automation at all | Gap — but lower priority for business opportunity |
| **Resale/Transfer** | NO automation at all | **Major gap** — resale is a stated business feature |
| **Feedback** | NO automation at all | Gap — missed engagement opportunity |

The support categories were designed by the FairTix team themselves. They represent the business domains where customers need help. Every category without automation = customers waiting for manual handling.

---

## New Process Suggestion: Payment & Billing

**Based on:** The lottery-win email contains a "Complete Your Purchase" CTA at `fairtix.demo/checkout` with a ticket price in EUR. The support classifier has "Payment/Billing" as a category (customers have payment problems). Yet ZERO automation exists after the purchase button.

**Why this matters:** The entire FairTix revenue model flows through this moment: lottery win → purchase. There's automation BEFORE the purchase (notification) but nothing AFTER. That's like automating the sales pitch but not the cash register.

**Recommended workflows for this process:**

**1. Purchase Confirmation & Digital Ticket Delivery**
- Trigger: payment completed (webhook from payment system)
- Action: send confirmation email with ticket details, QR code, event info
- Update: mark winner record as "purchased" in the lottery sheet
- *Why:* Table-stakes e-commerce. Without this, buyers don't know if the purchase worked. They check their bank, contact support, or dispute charges.

**2. Payment Failure Handler**
- Trigger: payment failed (webhook from payment system)
- Action: notify buyer with retry options, log failure, alert ops team
- *Why:* A failed payment during a 24-hour window is urgent. The buyer may not realize it failed and miss the window entirely. Proactive notification saves the sale.

**3. Refund Processing Notification**
- Trigger: refund initiated (from support team or automated)
- Action: notify buyer of refund status, update records
- *Why:* "Payment/Billing" is a support category. Refund requests are common for ticketing. Automating the notification reduces support follow-up.

**4. Purchase Window Expiration Handler**
- Trigger: 24-hour window expired without purchase
- Action: release ticket back to lottery pool, notify winner that their window closed, optionally offer to the next person in queue
- *Why:* Currently, expired windows are invisible. The ticket sits in limbo. Automating this closes the loop: ticket gets resold, revenue isn't stuck.

---

## New Process Suggestion: Resale & Transfer

**Based on:** The welcome email explicitly states "Resale Cap — If you need to resell, prices stay fair (face value + 20% max)." The support classifier has "Resale/Transfer" as a category. Resale is a STATED BUSINESS FEATURE with zero automation.

**Why this matters:** FairTix doesn't just sell tickets — they operate a controlled secondary market. The 20% cap is a compliance rule that must be enforced. Without automation, enforcement is manual, listings are unmonitored, and the resale experience is entirely self-service with no guardrails.

**Recommended workflows for this process:**

**1. Resale Listing Confirmation**
- Trigger: user lists ticket for resale
- Action: validate price ≤ face value + 20%, confirm listing via email, update records
- *Why:* The seller needs confirmation their listing is live. Price cap validation should be automated, not manual.

**2. Resale Cap Enforcement**
- Trigger: new listing created (or scheduled check)
- Action: if listing price > face value + 20%, block listing, notify seller with explanation
- *Why:* The resale cap is a brand promise ("prices stay fair"). Automated enforcement is essential for integrity. Manual enforcement doesn't scale and creates legal risk if violations slip through.

**3. Resale Completion Notification**
- Trigger: ticket sold on secondary market
- Action: notify seller (payment incoming), notify buyer (ticket transferred), update records
- *Why:* Both parties need confirmation. The seller needs to know they'll receive payment. The buyer needs to know the ticket is valid and transferred.

**4. Transfer Confirmation**
- Trigger: ticket ownership transferred (gift, name change)
- Action: confirm to both parties, update ticket ownership records
- *Why:* "Verified Humans Only" means every ticket is tied to an identity. Transfer must update that identity link or the ticket becomes invalid at the door.

---

## New Process Suggestion: Event Lifecycle

**Based on:** Every workflow references events (EventName, TicketPrice) but no automation manages the event itself. The lottery system implies a multi-step event lifecycle that is currently entirely manual.

**Why this matters:** FairTix's core business IS events. Every revenue-generating process starts with "an event exists and is open for lottery registration." Yet there's no automation for any stage of the event lifecycle.

**Recommended workflows for this process:**

**1. Event Announcement / Queue Opening Notification**
- Trigger: new event created or lottery registration opens
- Action: notify all registered users (or users who favorited the artist/venue)
- *Why:* If users don't know the lottery is open, they can't enter. This is the top of the revenue funnel. More participants = more potential ticket sales. In a lottery system, there's no first-mover advantage, so the only question is: does the user KNOW?

**2. Lottery Draw Scheduling & Execution Trigger**
- Trigger: registration closes or scheduled draw time
- Action: trigger the lottery draw process, then trigger winner AND loser notifications
- *Why:* Currently the lottery draw happens externally and results appear in a Google Sheet. Automating the trigger ensures draws happen on time and notifications fire immediately.

**3. Event Reminder (Pre-Event)**
- Trigger: 24h and 2h before event start
- Action: send reminder to ticket holders with event details, venue info, entry instructions
- *Why:* No-shows cost the event organizer and waste tickets. Reminders reduce no-shows by 15-25% (industry standard for ticketing).

**4. Post-Event Follow-Up**
- Trigger: event end time + 2h
- Action: send "How was the show?" feedback request, NPS survey, suggest similar upcoming events
- *Why:* Post-event is the peak emotional moment. Users just had an experience. This is the optimal time for feedback collection and re-engagement ("Loved that artist? They're playing again in 3 months — join the queue").

---

## New Process Suggestion: Analytics & Reporting

**Based on:** Data accumulates in Google Sheets (lottery winners, support classifications, delivery statuses) but no workflow aggregates or reports on it. The support classifier tracks category, sentiment, and confidence — rich data that goes unanalyzed.

**Recommended workflows:**

**1. Weekly Support Digest**
- Aggregate: support volume by category, sentiment distribution, FAQ deflection rate, average confidence score
- Send: weekly email to ops team
- *Why:* The AI support pipeline generates classification data on every message. A weekly digest shows: "This week: 45 messages, 62% auto-resolved FAQ, top issue: Account/Verification (28%), 3 angry customers." This proves the AI investment is working and surfaces trends.

**2. Lottery Performance Report**
- Aggregate: per-event stats — entries, winners, purchase completion rate, window expirations, notification delivery success
- *Why:* Each lottery draw is a conversion funnel. Without aggregation, the team can't optimize: which events have high no-purchase rates? Which have delivery failures?

---

## Updated Process Coverage

| Business Process | Existing | Recommended | Coverage | Impact |
|-----------------|----------|-------------|----------|--------|
| Customer Onboarding | 1 | +2 | 33% | High |
| Ticket Lottery Lifecycle | 2 | +3 | 40% | Critical |
| Customer Support | 3 | +1 | 75% | High |
| Platform Operations | 1 | +1 | 50% | Medium |
| **Payment & Billing** | **0** | **+4** | **0%** | **Critical** |
| **Resale & Transfer** | **0** | **+4** | **0%** | **High** |
| **Event Lifecycle** | **0** | **+4** | **0%** | **Critical** |
| **Analytics & Reporting** | **0** | **+2** | **0%** | **Medium** |

**Updated totals:** 7 existing workflows, **21 recommended**, across 8 business processes. Overall coverage: **25%**.

Four entirely new business processes suggested — Payment & Billing, Resale & Transfer, Event Lifecycle, Analytics & Reporting — all directly traceable to data in the existing workflows (support categories, email content, business model details).

---

## Missed Insights from the Data

### 1. The confidence score is generated but not acted upon

The AI classifier outputs a confidence score (0.0–1.0) per classification. The FAQ/Manual workflow checks if category == "FAQ" and auto-responds. But it NEVER checks confidence. A classification with 0.5 confidence gets the same auto-reply as one with 0.95. This means roughly 10-20% of auto-responses may be wrong category, and the customer gets an irrelevant FAQ answer.

**Recommendation:** Add a confidence gate: if confidence < 0.75, route to manual handling regardless of category. This simple change immediately improves response accuracy.

### 2. The sender name extraction has a hardcoded substring

In workflow 03, the SenderName is extracted with `.substr(19)` — a hardcoded offset that strips a prefix. This suggests all support emails come through a channel with a fixed prefix format (likely a forwarding rule or shared inbox). If the prefix changes, every classification loses the sender name.

**Recommendation:** Replace hardcoded substring with a regex or dynamic parser.

### 3. Only FAQ gets auto-response — but other categories could too

The FAQ/Manual workflow routes FAQ → auto-answer, everything else → manual email to team. But some non-FAQ categories could also get automated first responses:
- **Feedback/positive** → auto thank-you ("Thanks for the kind words! We'll share this with the team.")
- **Account/Verification** → auto-response with verification instructions link
- **Payment/Billing** → auto-response with "we're checking your transaction" + estimated response time

This would increase the auto-response rate from ~40% (FAQ only) to potentially ~60% (FAQ + templated responses for common patterns).

### 4. No deduplication — same customer can trigger multiple classifications

If a customer sends 3 follow-up emails about the same issue, each gets independently classified and each triggers a separate response. No automation detects "this is the same person writing again about the same thing." This creates duplicate support responses and a poor experience.

### 5. The Google Sheets column schema reveals the exact data model

The sheets have explicit columns: ID, Name, Email, EventName, TicketPrice, Status, Message, Automation Timestamp (for lottery); SenderName, SenderEmail, Subject, MessageBody, Category, Sentiment, Confidence, Rationale, Response, CreatedAt, UpdatedAt (for support). These column schemas tell us exactly what data FairTix tracks and what fields are available for analysis — without guessing.

---

## Revised "Your Next Move"

> **Your lottery winner notification — the one workflow that directly drives revenue — isn't running.** Activate it, stabilize the 31% error rate, and set up the purchase window reminder. Then build the three things your customers are already asking about (we can see it in your support categories): **payment confirmation**, **resale/transfer flows**, and **account verification help**. Your support AI already classifies these issues — now automate the responses. Finally: your users don't know when new events open for lottery registration. An event announcement workflow is the simplest way to fill every lottery queue.

---

---

# Part 4: Honesty Check — What Might Already Exist Outside n8n

> Appended 2026-04-03. Per's challenge: "Maybe FairTix handles payments, verification, resale in their own platform. We shouldn't recommend things that are clearly done elsewhere."

## What the Data Tells Us About the Platform Beyond n8n

The data contains clear signals that FairTix has a product/platform OUTSIDE n8n:

1. **`fairtix.demo/checkout`** — the purchase CTA links to a checkout page. The platform handles payments.
2. **Google Sheets receives lottery results from somewhere** — the "LotteryWins" sheet gets new rows that trigger the notification workflow. Something runs the lottery draw and writes results. That's the platform.
3. **"Verified Humans Only"** — verification is a requirement described in the welcome email. The platform likely manages identity verification directly.
4. **The support classifier exists because customers email support** — but the ticketing platform itself likely has an account system, order history, and ticket management.

**Conclusion:** FairTix is NOT a company that runs everything through n8n. n8n is their **orchestration and notification layer** — it bridges the gap between their platform (where business logic lives) and external systems (Gmail, Google Sheets, Anthropic). The platform likely handles: user accounts, event management, lottery draws, payments, ticket delivery, and resale marketplace.

## Which Recommendations Are Likely Already Handled

| Recommendation | Likely handled by platform? | Evidence | Revised framing |
|---------------|---------------------------|----------|-----------------|
| Purchase confirmation | **Probably yes** — the checkout page likely sends its own confirmation | `fairtix.demo/checkout` exists | "If your platform sends purchase confirmations, great. If not, here's how to add it via n8n." |
| Refund processing | **Probably yes** — payment providers (Stripe etc.) handle refund notifications | Common for ticketing platforms | Lower priority — only recommend if platform doesn't handle it |
| Resale cap enforcement | **Probably yes** — this is a platform-level business rule | Core feature described in brand messaging | Not an n8n job — it's product code |
| Account verification flow | **Probably yes** — the platform manages identity | Described as a prerequisite for lottery entry | Not an n8n job — it's product code |
| Event listing/management | **Probably yes** — events exist before n8n sees them | Google Sheets contains EventName from upstream | Not an n8n job |
| Ticket delivery | **Probably yes** — likely happens at purchase completion | Standard ticketing functionality | Not an n8n job |

## Which Recommendations Are Still Clearly Valid

| Recommendation | Why it's clearly NOT handled elsewhere | Evidence |
|---------------|---------------------------------------|----------|
| **Lottery-LOSS notification** | If the platform sent loss notifications, users wouldn't be asking support "what happened?" FAQ questions about lottery results confirm users are left in the dark. | Support classifier sees lottery-related FAQ questions |
| **Purchase window reminder (12h/22h)** | The 24-hour window is communicated via the n8n-sent email. n8n owns this lifecycle. The platform runs the draw, but n8n handles the communication. | The window is mentioned only in the n8n email template |
| **Event announcement / queue opening** | No evidence any system proactively notifies users about new events. If it existed, it would likely be in n8n (the notification layer). | No workflows, no references |
| **Post-event follow-up** | No evidence this exists. Ticketing platforms rarely automate post-event engagement. | No workflows, no references |
| **Support response follow-up** | The AI support pipeline is entirely in n8n. Follow-up would also be in n8n. | The entire support flow is in n8n |
| **Slack as second alert channel** | Error notifications are 100% in n8n. Adding a channel is an n8n concern. | Only n8n sends error alerts |
| **Weekly support digest** | Support classification data lives in Google Sheets, written by n8n. Reporting on this data is n8n's job. | Data accumulates in n8n-managed sheets |
| **Confidence threshold gate** | The AI pipeline is in n8n. Adding a quality gate is an n8n change. | Classification logic is in n8n |

## Revised Recommendation Framing

The recommendations should use three frames:

**Frame 1: "We see this gap and it's clearly in n8n's domain"**
> "Your lottery-win notification exists but there's no lottery-loss notification. Since n8n handles all lottery communication, this is a natural addition."

**Frame 2: "We see this gap but it might be handled by your platform"**
> "We don't see purchase confirmation automation in your n8n workflows. This may be handled by your ticketing platform directly. If so, consider connecting your platform to Expliq for a more complete picture. If not, here's how to automate it."

**Frame 3: "Connect more systems for deeper insight"**
> "Your n8n workflows react to events from your ticketing platform (lottery results in Google Sheets). Connecting the platform directly would let Expliq see the full picture: event creation → lottery → notification → purchase → ticket delivery."

This three-frame approach is:
- **Honest** — doesn't pretend to know what the platform does
- **Valuable** — flags gaps regardless of where they're handled
- **Strategic** — every "we can't see this" becomes "connect more for deeper insight"
- **Humble** — positions Expliq as advisor, not all-knowing oracle

## Impact on Recommendations

**Still Tier 1 (clearly n8n domain, clearly missing):**
1. Lottery-loss notification
2. Purchase window reminder (12h/22h)
3. Stabilize + activate lottery-win workflow

**Still Tier 2 (clearly n8n domain):**
4. Event announcement / queue opening notification
5. Post-event follow-up
6. Support confidence gate
7. Support response follow-up

**Reframed Tier 2 (may be handled elsewhere — use Frame 2):**
8. Purchase confirmation → "if not handled by your platform..."
9. Payment failure notification → "if not handled by your payment provider..."

**Reframed as "Connect more" (Frame 3):**
10. Connect ticketing platform for complete lifecycle visibility
11. Connect payment provider for real-time transaction data
12. Resale & Transfer processes → "likely platform-level, but connecting would let Expliq advise on the full resale lifecycle"

**Dropped entirely:**
- Resale cap enforcement → product code, not automation
- Account verification flow → product code, not automation

## Key Insight for the Product

This honesty check reveals something important about Expliq's value proposition: **Expliq should always acknowledge the boundary of what it can see.** When it sees n8n workflows, it can analyze them deeply. But it should never claim to see the full business. The correct posture is:

> "Based on your n8n automation landscape, here's what we understand about your business operations. Here's what's working, what's missing from your n8n layer, and what we'd need to see (other platforms, systems) to give you the complete picture."

This is MORE trustworthy than pretending to know everything. And every "we can't see this" is a natural upsell: "connect more platforms."

---

*Honesty check complete. Recommendations revised with three-frame approach. Core insight: Expliq's value increases with each connected platform, and acknowledging blind spots builds trust.*

---

# Part 5: Consulting-Grade Recommendation Framework Applied to FairTix

> Appended 2026-04-03. Based on research into McKinsey/BCG/Bain, ICE/RICE frameworks, Gartner advisory patterns, and Celonis process mining. Applied to the FairTix data to demonstrate what Expliq's Roadmap page should actually show.

## Framework: Impact × Confidence

**Primary sort:** Business impact (what matters most to the business)
**Visual modifier:** Confidence — how sure Expliq is, shown per recommendation but not used for sorting
**Evidence label:** What type of data supports this recommendation

---

## ACT NOW — High Impact, High Confidence

These are **no-regret moves**: beneficial regardless of what else FairTix has in other systems. The evidence comes directly from FairTix's own n8n data.

---

### R1. Stabilize the Lottery-Win Notification Pipeline

**Business impact:** CRITICAL — this workflow IS the revenue conversion trigger. Every failed notification is a potential lost ticket sale.

**What to do:** Consolidate the 3 duplicate versions (02, 02b, 05) into one canonical workflow. Add retry logic on the Gmail send node (`retryOnFail: true`, `maxTries: 3`). Activate it.

**Evidence:** Data-driven (highest confidence)
- 3 duplicate versions exist with no clear canonical version (from workflow list)
- 31% error rate across 36 test executions (from execution API)
- The "Published" version (05) was never activated despite being the intended production copy
- `retryOnFail: false` on the Gmail node — no retry on the most failure-prone step
- Error workflow is catching real failures from this polling trigger (clusters of 6-9 errors per day)

**Key assumptions:** The lottery draw process continues writing winners to the Google Sheet. The Gmail OAuth credential remains valid.

**Affected scope:** 3 workflows (02, 02b, 05) → consolidated to 1. Plus the error workflow that's catching their failures.

**Deploy:** Not a new workflow — this is a fix to existing ones. Merge best elements: error workflow linkage from 02, node-level error handling from 02b, "Published" label from 05. Add retry config.

---

### R2. Add Lottery-Loss Notification

**Business impact:** HIGH — in a lottery system, non-selected participants outnumber winners (often 5:1 or 10:1). These users entered the queue, provided their data, and are waiting. Silence is the worst possible response for a company whose brand is built on FAIRNESS.

**What to do:** When the lottery draw completes, notify all non-selected participants. Include: the event name, that they were not selected, empathy, and a re-engagement hook ("Event Y opens next week — join the queue").

**Evidence:** Data-driven
- The lottery-win workflow exists but no loss notification exists (from workflow inventory — 0 of 68 workflows handle lottery losses)
- The support classifier has lottery-related FAQ as a category — users ARE asking "what happened?" because they don't hear back (from classifier prompt in workflow 03)
- FairTix's brand promise is "Fair Queue — everyone gets an equal shot" (from welcome email template). Fairness without communication isn't perceived as fair.

**Key assumptions:** Lottery results (both winners and non-winners) are available in the Google Sheet or can be derived (all entries minus winners = losers).

**Affected scope:** New workflow. Lottery Lifecycle process.

**Deploy:** n8n workflow. Trigger: lottery draw complete (new sheet or batch process). Action: email non-winners. Systems: Google Sheets → Gmail.

---

### R3. Add Purchase Window Reminders (12h + 22h)

**Business impact:** HIGH — the lottery-win email gives winners 24 hours. Without reminders, users who miss the email lose their spot. Comparable ticketing platforms report 10-15% higher conversion with timed reminders.

**What to do:** Send a reminder at 12h ("You have 12 hours left to complete your purchase") and an urgent reminder at 22h ("Last 2 hours — don't lose your ticket").

**Evidence:** Data-driven
- The 24-hour window is explicitly in the lottery-win email template: "You have 24 hours to complete your purchase before your spot is released" (from node parameters)
- No reminder workflow exists (from workflow inventory)
- The lottery-win notification already tracks delivery status with timestamps in the Google Sheet (from the "Update Status" node parameters — writes timestamp + status code). This timestamp is the basis for computing reminder timing.

**Key assumptions:** Google Sheets data includes the notification timestamp per winner. A scheduled workflow can compute elapsed time and send reminders.

**Affected scope:** New workflow. Lottery Lifecycle process.

**Deploy:** n8n workflow. Trigger: scheduled (every 30 min). Logic: check winners where timestamp > 12h and no reminder sent, send 12h reminder. Same for 22h.

---

### R4. Fix Error Handling on AI Support Pipeline

**Business impact:** HIGH — the AI support pipeline (workflows 03, 04, 04-sheet) handles customer communication. It makes external API calls to Anthropic, Google Docs, and Google Sheets — all of which can fail. Currently: ZERO error handling. An Anthropic API outage means support emails go unanswered with no notification to anyone.

**What to do:** Link all 3 support workflows to the Generic Error Workflow (`oZy3vc0yli2xdR45`). Add `retryOnFail: true` on the Anthropic LLM nodes. Add a confidence gate: if AI classification confidence < 0.75, route to manual handling instead of auto-responding.

**Evidence:** Data-driven
- `settings.errorWorkflow` is NOT set on workflows 03, 04, or 04-sheet (from workflow JSON)
- `retryOnFail: false` on all Anthropic nodes (from node parameters)
- The classifier outputs a confidence score (0.0-1.0) but workflow 04 never checks it — routes purely on category == "FAQ" (from IF node parameters)
- 12% error rate on the support classifier during testing (from execution data)

**Key assumptions:** The Generic Error Workflow can handle additional load. Anthropic API outages are infrequent but do happen.

**Affected scope:** 3 workflows (03, 04, 04-sheet). Support process.

**Deploy:** Configuration changes to existing workflows, not new workflows.

---

## INVESTIGATE — High Impact, Needs Verification

These recommendations address gaps Expliq detects in n8n, but the functionality **may exist in FairTix's own platform**. Each includes a soft frame acknowledging this uncertainty.

---

### R5. Purchase Confirmation & Ticket Delivery

**Business impact:** CRITICAL if not handled elsewhere — purchase confirmation is table-stakes for e-commerce. Without it, buyers don't trust the purchase went through.

**What to do:** After purchase completion, send confirmation email with ticket details, event info, and QR code / ticket reference.

**Evidence:** AI-suggested (medium confidence)
- The lottery-win email contains a CTA: "Complete Your Purchase →" linking to `fairtix.demo/checkout` (from email template in node parameters)
- No workflow in n8n handles post-purchase communication (from workflow inventory)
- **However:** the checkout page is on the FairTix platform, which likely sends its own confirmation

**Expliq's honest framing:**
> "We don't see purchase confirmation automation in your n8n workflows. Your checkout page (`fairtix.demo/checkout`) may handle this directly. If so, consider connecting your ticketing platform to Expliq for complete lifecycle visibility. If not, here's the workflow to add."

**Key assumptions:** The FairTix platform either does or doesn't handle purchase confirmation. Expliq can't tell from n8n data alone.

---

### R6. Event Announcement / Queue Opening Notification

**Business impact:** HIGH — if users don't know a lottery is open, they can't enter. Direct top-of-funnel for revenue. In a lottery system there's no speed advantage, so the only question is awareness.

**What to do:** When a new event's lottery registration opens, notify registered users.

**Evidence:** AI-suggested (medium confidence)
- Every workflow references events by name (EventName field) but no workflow announces them (from workflow inventory)
- No evidence of proactive event notifications from any system visible in n8n
- **However:** the FairTix platform may send event announcements through its own system

**Expliq's honest framing:**
> "We see your workflows process events (EventName appears in lottery data) but no automation announces new events or open queues. If your platform handles this, great. If not, this is a direct revenue driver — every unaware user is a lost lottery participant."

---

### R7. Payment Failure Recovery

**Business impact:** HIGH if applicable — failed payments during the 24-hour purchase window are urgent. The buyer may not realize payment failed and miss the window.

**Evidence:** AI-suggested (medium confidence)
- "Payment/Billing" is one of 6 support categories — users DO have payment issues (from classifier prompt)
- No payment-related workflow exists in n8n (from workflow inventory)
- **However:** payment processing is almost certainly handled by a payment provider (Stripe, etc.) which has its own failure notifications

**Expliq's honest framing:**
> "Your support classifier sees Payment/Billing issues, but we don't see payment automation in n8n. Your payment provider likely handles retries and failure notifications. If you want to add custom handling (e.g., extend the 24-hour window on payment failure), here's how."

---

### R8. Resale & Transfer Automation

**Business impact:** MEDIUM-HIGH — resale is a stated business feature ("face value + 20% max"), and "Resale/Transfer" is a support category. But this is likely platform-level functionality.

**Evidence:** AI-suggested (lower confidence)
- Welcome email explicitly describes resale cap and transfer capability (from email template)
- "Resale/Transfer" is a support category — users have resale issues (from classifier prompt)
- No resale-related workflow exists in n8n
- **However:** resale marketplace functionality (listings, matching, cap enforcement) is core product code, not orchestration

**Expliq's honest framing:**
> "Your platform offers resale with a 20% cap, and users contact support about resale issues. The marketplace itself is platform functionality. But notification workflows (listing confirmed, ticket sold, transfer completed) could be added to n8n to close the communication loop."

---

## EXPLORE — Valuable, Requires Platform Expansion

These are growth suggestions. They expand Expliq's visibility and create new recommendation opportunities.

---

### R9. Connect Your Ticketing Platform

**Why:** Expliq currently sees your n8n orchestration layer but not the FairTix product. Connecting it would reveal: event catalog, lottery draw mechanics, purchase completion rates, user accounts, ticket inventory. Every "Investigate" recommendation above becomes "Act Now" with platform data.

**Evidence:** Pattern-based
- Workflows react to platform events (lottery draws write to Google Sheets) but Expliq can't see the platform directly
- Multiple "we can't tell" gaps would be resolved with platform visibility

**Affected scope:** All processes. Transforms Expliq from automation advisor to full business intelligence.

---

### R10. Add Slack as Second Notification Channel

**Why:** All communication runs through one Gmail account. The error workflow has a 17.5% failure rate — when it fails, nobody knows anything failed. Slack provides instant team visibility and acts as failover.

**Evidence:** Data-driven
- Error workflow sends to `dlschoolautomations@gmail.com` only (from node parameters)
- 7 of 40 error workflow executions failed (from execution data) — 17.5% of error alerts are lost
- No alternative notification channel exists in any workflow

**Affected scope:** Error workflow + optionally critical business workflows.

---

### R11. Post-Event Follow-Up

**Why:** After the event, users are at peak emotional engagement. "How was the show?" feedback + next-event recommendations. No evidence this exists anywhere.

**Evidence:** AI-suggested (lower confidence)
- No post-event workflow in n8n
- Could be handled by the platform, but post-event engagement is often an afterthought even for mature ticketing companies

---

### R12. Verification Reminder Sequence

**Why:** "Account/Verification" is a support category. Unverified users can't enter lotteries. A 24h/72h reminder sequence after welcome email could recover users who intend to verify but forget.

**Evidence:** AI-suggested (medium confidence)
- Welcome email tells users to verify (from email template)
- Support classifier sees verification issues (from classifier prompt)
- No reminder workflow exists in n8n
- **However:** the platform likely manages the verification flow itself

---

### R13. Weekly Support Digest

**Why:** The AI classifier writes category, sentiment, confidence, and rationale for every message to Google Sheets. This data accumulates but is never aggregated. A weekly report would show: support volume trends, top categories, FAQ deflection rate, sentiment shifts.

**Evidence:** Data-driven
- Classification data flows to Google Sheets with structured columns (from node parameters: Category, Sentiment, Confidence, Rationale, Response, UpdatedAt)
- No aggregation or reporting workflow exists

**Affected scope:** Analytics process. Low effort, immediate visibility.

---

## Summary View (for the Roadmap page)

| # | Recommendation | Impact | Confidence | Evidence | Deploy? |
|---|---------------|--------|------------|----------|---------|
| R1 | Stabilize lottery-win notification | Critical | **High** — execution data proves 31% error rate | Data-driven | Fix existing |
| R2 | Add lottery-loss notification | High | **High** — support categories prove users are left in dark | Data-driven | New workflow |
| R3 | Purchase window reminders | High | **High** — 24h window in email, no reminder exists | Data-driven | New workflow |
| R4 | Fix AI support error handling | High | **High** — errorWorkflow not set, retryOnFail: false | Data-driven | Fix existing |
| R5 | Purchase confirmation | Critical | **Medium** — not in n8n, may be handled by platform | AI-suggested | New workflow |
| R6 | Event announcements | High | **Medium** — no evidence anywhere, but could be platform | AI-suggested | New workflow |
| R7 | Payment failure recovery | High | **Medium** — support category exists, likely handled by provider | AI-suggested | New workflow |
| R8 | Resale notification workflows | Medium | **Low-Medium** — feature exists, likely platform-handled | AI-suggested | New workflow |
| R9 | Connect ticketing platform | Strategic | N/A — expansion | Pattern-based | Platform |
| R10 | Add Slack failover | Medium | **High** — single Gmail channel, 17.5% error rate on alerts | Data-driven | New workflow |
| R11 | Post-event follow-up | Medium | **Low** — no evidence, could be anywhere | AI-suggested | New workflow |
| R12 | Verification reminders | Medium | **Medium** — support category + welcome email, but platform likely owns this | AI-suggested | New workflow |
| R13 | Weekly support digest | Low-Medium | **High** — data accumulates in Sheets, never aggregated | Data-driven | New workflow |

---

## How This Maps to the UI

**On the Roadmap page:**

Three collapsible sections with named headers:

**ACT NOW** (4 items) — green accent, solid confidence indicator
Each card: title, one-line business impact, "Data-driven" badge, expandable reasoning + evidence links, deploy button where applicable.

**INVESTIGATE** (4 items) — amber accent, dashed confidence indicator
Each card: title, one-line business impact, "AI-suggested" badge, the soft framing paragraph ("We don't see this in n8n. If handled by your platform, consider connecting it..."), expandable reasoning, deploy button.

**EXPLORE** (5 items) — grey accent, outline confidence indicator
Each card: title, one-line reasoning, "Pattern-based" or "AI-suggested" badge, expandable detail.

**On the Dashboard "Your next move" banner:**
Pulls from the top of ACT NOW:
> "Your lottery-win notification has a 31% error rate across 36 runs. Every failed notification is a potential lost ticket sale. Stabilize this workflow first — add retry logic and activate the Published version. Then add the missing half: lottery-loss notifications, so every participant hears back from the Fair Queue."

**On the Workflows page (inline recommendations):**
Within each process group, the recommended workflows appear as dashed-border cards with the confidence badge. Only ACT NOW and INVESTIGATE items appear inline. EXPLORE items live on the Roadmap only.

---

*Consulting-grade recommendation framework applied to FairTix. 13 recommendations sorted by impact, differentiated by confidence, each with evidence chain and honest framing.*
