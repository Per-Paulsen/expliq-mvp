# n8n API Examples — Directory Index

> This directory contains official API schemas, real instance data, and analysis. Used as reference material for Expliq's LLM pipeline and sync architecture.

---

## Official Schemas (from n8n OpenAPI spec v1.1.1)

Response schemas with example values extracted from the official n8n API specification. Each file contains embedded `_note`, `_llm_can_infer`, and `_business_value` annotations.

| File | Endpoint | What it shows | Expliq uses it for |
|------|----------|--------------|-------------------|
| `GET-workflows-list.json` | `GET /workflows` | Full workflow object: nodes, connections, settings, tags, shared, activeVersion | Sync pipeline — fetch all workflows |
| `GET-workflow-single.json` | `GET /workflows/{id}` | Same schema + realistic 4-node example (Salesforce→IF→Slack+Sheets) with complete `_llm_analysis_of_this_workflow` | LLM prompt reference — shows what analysis is possible per workflow |
| `GET-workflow-version.json` | `GET /workflows/{id}/{versionId}` | Historical version: nodes, connections, authors, description. NO settings/tags/shared. | Future: change tracking. Not needed for demo. |
| `OFFICIAL-workflow-schema.json` | — | Verbatim JSON Schema from official n8n API docs | Ground truth for field validation |
| `workflow-settings-schema.json` | — | All `settings` fields with types, descriptions, enums, and Expliq-specific insights | Key fields: `errorWorkflow` (dependency graph), `callerIds` (sub-workflow links), `timeSavedPerExecution` (user ROI in minutes), `availableInMCP` (AI exposure flag) |
| `node-parameters-real-examples.json` | — | 8 real node parameter examples (Salesforce, Slack, Stripe HTTP, Code, IF, Webhook, Schedule, Google Sheets, Execute Sub-workflow) | Each has `_llm_can_infer` showing what the LLM can deduce from node parameters. This is the richest data source for business insight. |
| `GET-executions-list.json` | `GET /executions` | Execution summaries: status, timing, mode. All enum values documented. | Real operational metrics: runs/week, error rate, duration |
| `GET-execution-detail.json` | `GET /executions/{id}?includeData=true` | Full execution with per-node timing, output data, workflow snapshot at execution time | Deep analysis: per-node bottlenecks, actual output data. Large payloads — use sparingly. |
| `GET-execution-tags.json` | `GET /executions/{id}/tags` | Annotation tags on individual runs (not workflow tags) | Operational maturity signal: does the team review and classify execution outcomes? |
| `GET-credentials-list.json` | `GET /credentials` | Credential names + types (secrets never returned). Includes `_common_credential_types` mapping of 18 types to systems. | Verified system inventory. `type` field maps directly to external system (e.g., `slackOAuth2Api` = Slack). |
| `GET-users-list.json` | `GET /users` | User objects: name, email, role, isPending. Includes `_business_value` analysis. | Ownership mapping (cross-ref with `workflow.shared[]`), bus factor, team size signal |
| `GET-tags-list.json` | `GET /tags` | User-defined workflow tags | Process clustering hints — tags like "billing" or "support" inform LLM grouping |
| `GET-variables-list.json` | `GET /variables` | Environment variables with project scope | Environment detection (production vs staging?), shared configuration patterns |
| `GET-projects-list.json` | `GET /projects` + `GET /projects/{id}/users` | Project/team structure with member roles | Organizational structure, process clustering hints from project names |
| `GET-datatables.json` | `GET /data-tables` + `GET /data-tables/{id}/rows` | Structured data tables with column schemas + row queries | What data the company tracks alongside automations. Evidence for recommendations. |
| `GET-discover.json` | `GET /discover` | API capability discovery: scopes, resources, endpoints | Call FIRST during sync. Feature detection for graceful degradation on older instances. |
| `POST-workflows-create.json` | `POST /workflows` | Create workflow request body + response. Realistic "Payment Failure Recovery" example. | Deploy feature: generate n8n JSON → POST to API → `POST /workflows/{id}/activate` |

---

## FairTix Instance Data (`fairtix/` — gitignored)

Real API responses from the FairTix bootcamp n8n instance. Contains sensitive data (emails, API structure). Not committed to git.

### Instance-Level Responses

| File | What it contains | Key finding |
|------|-----------------|-------------|
| `fairtix/workflows-list.json` | All 68 workflows (490KB) | 9 reference-tagged = real FairTix demos. Rest = bootcamp participant practice. |
| `fairtix/executions-list.json` | 50 most recent executions | 40% error rate. Modes: webhook (19), trigger (17), manual (8), error (6). |
| `fairtix/users.json` | 25 users | All bootcamp participants. Per Paulsen among them. 3 pending invites. |
| `fairtix/tags.json` | 4 tags | **"Reference"** = the filter for demo workflows. Also: Setup, support, FairTix Bootcamp. |
| `fairtix/credentials.json` | 403 Forbidden | API key lacks credential:list permission |
| `fairtix/projects.json` | 403 Forbidden | API key lacks project:list permission |
| `fairtix/variables.json` | Empty | No variables configured |
| `fairtix/FINDINGS.md` | Exploration findings | Instance overview, filtering strategy, what's available vs not |

### Reference Workflows (`fairtix/reference/`)

9 workflows tagged "Reference" — the actual FairTix demo set, fetched individually via `GET /workflows/{id}`.

| File | Workflow | Nodes | Status |
|------|----------|-------|--------|
| `00-common-node-types.json` | Reference sheet (not a business workflow) | 28 | Inactive |
| `01-send-welcome-email.json` | Welcome email to new users | 3 | Inactive |
| `02-lotterywins.json` | Lottery winner notification (base version) | 5 | Inactive |
| `02b-lotterywins-error-handling.json` | Lottery winner notification (with error branching) | 4 | Inactive |
| `03-support-classifier.json` | AI support message classifier (Claude Sonnet) | 11 | Inactive |
| `04-switch-faq-manual.json` | FAQ auto-response + manual escalation (Gmail-based) | 18 | Inactive |
| `04-switch-faq-manual-sheet.json` | FAQ auto-response + manual escalation (Sheet-based) | 14 | Inactive |
| `05-lotterywins-published.json` | Lottery winner notification ("Published" version) | 5 | Inactive |
| `05-generic-error-workflow.json` | Centralized error handler | 2 | **ACTIVE** |

### Per-Workflow Execution Data (`fairtix/reference/executions-*.json`)

| File | Workflow | Executions | Error rate |
|------|----------|-----------|------------|
| `executions-01.json` | Welcome email | 5 | 0% |
| `executions-02.json` | LotteryWin | 36 | 31% |
| `executions-02b.json` | LotteryWin error handling | 0 | — |
| `executions-03.json` | Support classifier | 50 | 12% |
| `executions-04.json` | FAQ/Manual (Gmail) | 43 | 12% |
| `executions-04-sheet.json` | FAQ/Manual (Sheet) | 50 | 12% |
| `executions-05-err.json` | Error workflow | 40 | 17.5% |
| `executions-05-pub.json` | LotteryWin Published | 0 | — |

### Analysis Files

| File | What it is |
|------|-----------|
| `fairtix/reference/ANALYSIS.md` | Full 5-part analysis evolution (governance → business opportunity → honesty check → consulting framework). Historical — shows how the analysis improved. |
| `fairtix/reference/ANALYSIS-FINAL.md` | **Clean extraction** — final consulting-grade analysis only. 8 per-workflow business cases, 8 business processes, 4 system narratives, 13 ranked recommendations (Act Now / Investigate / Explore). This is the reference for what Expliq's LLM output should look like. |

---

## How These Files Are Used

| Consumer | What it reads | Purpose |
|----------|-------------|---------|
| **PRD 2.0** | References this README + `ANALYSIS-FINAL.md` | Defines what data is available and what output quality to target |
| **`/spec` skill** | Schema files + `ANALYSIS-FINAL.md` | Understanding data structures for epic specs |
| **`/dev` skill (Epic 10)** | All schema files | Implementing the extended sync pipeline |
| **LLM prompt design** | `node-parameters-real-examples.json` + `ANALYSIS-FINAL.md` | Designing prompts that produce consulting-grade output |
| **Research spike** | `fairtix/reference/*.json` | Testing prompts against real data before coding |
