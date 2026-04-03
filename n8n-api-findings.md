# n8n API — Research Findings

> Research conducted 2026-04-03. Based on n8n REST API v1 (OpenAPI 3.0, spec version 1.1.1).
> Purpose: understand what data Expliq can extract to power the Automation Opportunity Engine.
> Sources: Official OpenAPI spec (`n8n-io/n8n-docs/docs/api/v1/openapi.yml`), n8n community examples, n8n workflow templates.
> Real response schemas saved in `n8n-api-examples/` directory:
> - `GET-workflows-list.json` — full workflow object with nodes, connections, settings, tags, shared
> - `GET-executions-list.json` — execution summary with status, timing, mode
> - `GET-execution-detail.json` — execution with includeData=true (per-node timing + output)
> - `GET-credentials-list.json` — credential inventory with type-to-system mapping
> - `GET-tags-list.json` — user-defined tags
> - `POST-workflows-create.json` — create workflow request + response (for deploy feature)
> - `workflow-settings-schema.json` — all settings fields with descriptions + business relevance
> - `GET-users-list.json` — user objects with roles + ownership/bus-factor analysis
> - `GET-variables-list.json` — environment variables + configuration signals
> - `GET-projects-list.json` — project/team organization + member roles
> - `GET-datatables.json` — structured data tables with column schemas + row queries
> - `GET-discover.json` — API capability discovery (version/feature detection)
> - `node-parameters-real-examples.json` — real node parameters with LLM inference analysis

---

## 1. What We Currently Use vs. What's Available

### Currently used by Expliq

```
GET /api/v1/workflows        → list all workflows (id, name, active, timestamps)
GET /api/v1/workflows/{id}   → full workflow JSON (nodes, connections, settings)
```

Stored in `rawWorkflowJson`, fed to LLM pipeline. That's it.

### Available but untapped

```
GET /api/v1/executions       → execution history (runs, errors, durations)
GET /api/v1/credentials      → system inventory (credential types, no secrets)
GET /api/v1/tags             → user-defined categorization
GET /api/v1/users            → ownership data (names, emails, roles)
POST /api/v1/audit           → built-in security risk report
POST /api/v1/workflows       → create workflow (for deploy feature)
POST /api/v1/workflows/{id}/activate → activate after creation
```

---

## 2. Full Workflow Response — Real Schema

`GET /api/v1/workflows/{id}` returns:

```json
{
  "id": "2tUt1wbLX592XDdX",
  "name": "CRM Sync Pipeline",
  "active": true,
  "isArchived": false,
  "versionId": "7c6b9e3f-8d4a-4b2c-9f1e-6a5d3b8c7e4f",
  "triggerCount": 1,
  "createdAt": "2022-04-29T11:02:29.842Z",
  "updatedAt": "2024-06-20T14:22:00.000Z",

  "nodes": [
    {
      "id": "0f5532f9-36ba-4bef-86c7-30d607400b15",
      "name": "Jira",
      "type": "n8n-nodes-base.jira",
      "typeVersion": 1,
      "position": [-100, 80],
      "parameters": {},
      "credentials": {
        "jiraSoftwareCloudApi": {
          "id": "35",
          "name": "jiraApi"
        }
      },
      "webhookId": "optional-uuid",
      "disabled": false,
      "notesInFlow": false,
      "notes": "User-written note about this node",
      "executeOnce": false,
      "alwaysOutputData": false,
      "retryOnFail": false,
      "maxTries": 3,
      "waitBetweenTries": 1000,
      "continueOnFail": false,
      "onError": "stopWorkflow",
      "createdAt": "2022-04-29T11:02:29.842Z",
      "updatedAt": "2022-04-29T11:02:29.842Z"
    }
  ],

  "connections": {
    "Source Node Name": {
      "main": [
        [
          { "node": "Target Node Name", "type": "main", "index": 0 }
        ]
      ]
    }
  },

  "settings": {
    "saveExecutionProgress": true,
    "saveManualExecutions": true,
    "saveDataErrorExecution": "all",
    "saveDataSuccessExecution": "all",
    "executionTimeout": 3600,
    "errorWorkflow": "VzqKEW0ShTXA5vPj",
    "timezone": "America/New_York",
    "executionOrder": "v1",
    "callerPolicy": "workflowsFromSameOwner",
    "callerIds": "14, 18, 23",
    "timeSavedPerExecution": 5,
    "availableInMCP": false
  },

  "staticData": null,
  "pinData": null,
  "meta": {
    "templateId": "string",
    "instanceId": "string",
    "templateCredsSetupCompleted": true
  },
  "tags": [
    {
      "id": "tag1",
      "name": "Production",
      "createdAt": "2022-04-29T11:02:29.842Z",
      "updatedAt": "2022-04-29T11:02:29.842Z"
    }
  ],
  "shared": [
    {
      "role": "workflow:owner",
      "workflowId": "2tUt1wbLX592XDdX",
      "projectId": "proj1",
      "project": {
        "id": "proj1",
        "name": "Sales Team",
        "type": "team"
      },
      "createdAt": "2022-04-29T11:02:29.842Z",
      "updatedAt": "2022-04-29T11:02:29.842Z"
    }
  ]
}
```

### What can be inferred — field by field

| Field | Type | What Expliq can derive |
|-------|------|----------------------|
| `name` | string | **Workflow name.** Often describes purpose ("Invoice Sync", "Lead Scoring"). LLM uses this as a strong hint for business context. |
| `active` | boolean | **Operational status.** Inactive + high business importance = governance signal. |
| `triggerCount` | integer | **Number of triggers.** Multiple triggers = complex entry points. |
| `createdAt` / `updatedAt` | datetime | **Age + freshness.** Old + not updated = potentially stale. Recently updated = recently changed (drift signal). |
| `nodes[].type` | string | **System identification.** `n8n-nodes-base.salesforce` = Salesforce. `n8n-nodes-base.slack` = Slack. Deterministic system mapping. |
| `nodes[].parameters` | object | **THE RICHEST SOURCE.** Contains actual URLs, field mappings, SQL queries, Slack channels, Salesforce object types, etc. The LLM reads this to deduce what MUST be true in connected systems. |
| `nodes[].credentials` | object | **Which credential each node uses.** Maps node → system. Cross-ref with credentials API for complete picture. |
| `nodes[].disabled` | boolean | **Dead code detection.** Disabled nodes = experimental, deprecated, or broken parts. |
| `nodes[].retryOnFail` / `maxTries` | boolean / int | **Error handling quality.** No retries on critical nodes = technical risk. |
| `nodes[].onError` | enum | **Error strategy.** `"stopWorkflow"` vs `"continueRegularOutput"` — does it fail fast or swallow errors? |
| `nodes[].notes` | string | **User documentation.** The creator's own explanation of what a node does. Free context for the LLM. |
| `connections` | object | **Workflow graph.** The complete execution flow — which nodes feed into which. LLM can trace data paths. |
| `settings.errorWorkflow` | string | **Error handler link.** ID of another workflow that handles errors. DETERMINISTIC connected-automations link. |
| `settings.callerPolicy` / `callerIds` | enum / string | **Sub-workflow dependencies.** Which workflows call this one. DETERMINISTIC dependency graph. |
| `settings.timeSavedPerExecution` | integer | **User-estimated ROI.** n8n's own time-saved field. If set, show alongside LLM estimates. |
| `settings.saveDataSuccessExecution` | enum | **Data retention policy.** `"all"` = stores all execution data (potential data risk). |
| `settings.executionTimeout` | integer | **Timeout config.** Long timeout = long-running process. No timeout = potential hanging risk. |
| `tags[]` | array | **User categorization.** May already hint at business process grouping ("billing", "support"). |
| `shared[].project` | object | **Team ownership.** Which project/team owns this workflow. Directly maps to Expliq's owner concept. |
| `shared[].role` | string | **Access level.** Who has owner/editor/viewer access. |

### Deep dive: `nodes[].parameters` — what the LLM can read

Real examples from n8n templates:

**Salesforce node parameters:**
```json
{
  "resource": "opportunity",
  "operation": "update",
  "opportunityId": "={{ $json.id }}",
  "updateFields": {
    "stageName": "Closed Won",
    "amount": "={{ $json.dealValue }}"
  }
}
```
→ LLM deduces: "Salesforce has Opportunity objects with stages and amounts. This workflow updates deals to 'Closed Won' and writes the deal value. The company tracks revenue through deal stages."

**Slack node parameters:**
```json
{
  "authentication": "oAuth2",
  "channelId": { "__rl": true, "value": "#sales-notifications" },
  "text": "=Deal {{ $json.dealName }} moved to {{ $json.stage }}",
  "otherOptions": {}
}
```
→ LLM deduces: "Sales team has a #sales-notifications channel. They receive real-time updates when deals change stage. Deal names and stages are tracked."

**HTTP Request node parameters:**
```json
{
  "url": "https://api.stripe.com/v1/invoices",
  "method": "POST",
  "authentication": "genericCredentialType",
  "genericAuthType": "httpHeaderAuth",
  "options": { "timeout": 10000 }
}
```
→ LLM deduces: "Company creates Stripe invoices programmatically. This is a billing automation. 10-second timeout suggests they expect reliable but not instant responses."

**Code node parameters:**
```json
{
  "jsCode": "const items = $input.all();\nconst filtered = items.filter(i => i.json.amount > 1000);\nreturn filtered;"
}
```
→ LLM deduces: "Filters transactions by amount > 1000. This workflow handles high-value transactions differently from small ones. The company has a threshold-based processing logic."

**IF node parameters:**
```json
{
  "conditions": {
    "boolean": [
      { "value1": "={{ $json.status }}", "operation": "equals", "value2": "failed" }
    ]
  }
}
```
→ LLM deduces: "Branches on failure status. This is an error-handling or retry path."

---

## 3. Execution Response — Real Schema

`GET /api/v1/executions` returns:

```json
{
  "data": [
    {
      "id": 26091,
      "finished": true,
      "mode": "webhook",
      "status": "success",
      "workflowId": "HC57JS1iKZRafE78",
      "startedAt": "2025-04-29T14:03:58.555Z",
      "stoppedAt": "2025-04-29T14:03:58.888Z",
      "retryOf": null,
      "retrySuccessId": null,
      "waitTill": null,
      "customData": {}
    }
  ],
  "nextCursor": "MTIzZTQ1NjctZTg5Yi0xMmQzLWE0NTYtNDI2NjE0MTc0MDA"
}
```

Query params: `workflowId`, `status` (success|error|canceled|crashed|running|waiting|new|unknown), `includeData` (boolean), `limit`, `cursor`.

### With `includeData=true` (large payload):

```json
{
  "id": "4949",
  "finished": true,
  "mode": "manual",
  "status": "success",
  "workflowId": "kJMFFhFfEhsYN3Uj",
  "startedAt": "2023-12-12T15:32:22.597Z",
  "stoppedAt": "2023-12-12T15:32:22.810Z",
  "data": {
    "startData": {
      "destinationNode": "OpenWeatherMap",
      "runNodeFilter": ["When clicking \"Execute Workflow\"", "OpenWeatherMap"]
    },
    "resultData": {
      "runData": {
        "When clicking \"Execute Workflow\"": [],
        "OpenWeatherMap": [
          {
            "startTime": 1702394542597,
            "executionTime": 213,
            "executionStatus": "success",
            "source": [{ "previousNode": "When clicking \"Execute Workflow\"" }],
            "data": {
              "main": [[{ "json": { "temperature": 22.5 }, "pairedItem": { "item": 0 } }]]
            }
          }
        ]
      },
      "lastNodeExecuted": "OpenWeatherMap"
    }
  },
  "workflowData": {
    "id": "kJMFFhFfEhsYN3Uj",
    "name": "Example workflow",
    "active": false,
    "nodes": [],
    "connections": {},
    "settings": {}
  }
}
```

### What can be inferred from execution data

| Derived metric | How to compute | Value for Expliq |
|---------------|----------------|------------------|
| **Runs per week** | Count executions with `startedAt` in last 7 days | REAL operational frequency — replaces LLM estimate |
| **Error rate** | `status: "error"` count / total count | REAL failure rate — "12.4% of runs fail" is a FACT |
| **Avg execution time** | Average of `stoppedAt - startedAt` | Performance baseline per workflow |
| **Last run** | Most recent `startedAt` | Freshness — "last ran 30 days ago" = potentially abandoned |
| **Trigger mode** | `mode` field distribution | How workflows are actually invoked (webhook vs cron vs manual) |
| **Retry chains** | `retryOf` / `retrySuccessId` links | How often retries succeed — reliability signal |
| **Per-node timing** | `resultData.runData[node].executionTime` (with includeData) | Bottleneck detection — which node is slow? |
| **Failure patterns** | Error executions grouped by time | Spike detection — "errors increased 3x this week" |

**Critical insight:** With execution data, the "Your next move" banner can state FACTS:

> "Invoice processing pipeline ran **520 times this week** with a **12.4% failure rate** — that's 64 failed runs."

That's not an LLM estimate. That's real data from the API. The LLM then adds the business layer:

> "At your observed processing volume, this likely means **~$15K/mo in delayed reconciliation**. Fix this first."

Facts + reasoning. Exactly Per's vision.

---

## 4. Credentials Response — Real Schema

`GET /api/v1/credentials` returns:

```json
{
  "data": [
    {
      "id": "vHxaz5UaCghVYl9C",
      "name": "John's Github account",
      "type": "githubApi",
      "createdAt": "2022-04-29T11:02:29.842Z",
      "updatedAt": "2022-04-29T11:02:29.842Z",
      "shared": [
        {
          "id": "proj1",
          "name": "Sales Team",
          "role": "credential:owner",
          "createdAt": "2022-04-29T11:02:29.842Z",
          "updatedAt": "2022-04-29T11:02:29.842Z"
        }
      ]
    }
  ],
  "nextCursor": "..."
}
```

Secrets are NEVER returned (write-only field).

### What can be inferred

The `type` field directly maps to the external system:

| Credential type | System | Business domain |
|----------------|--------|----------------|
| `salesforceOAuth2Api` | Salesforce | CRM / Revenue |
| `slackOAuth2Api` | Slack | Communication |
| `stripeApi` | Stripe | Payments / Billing |
| `hubspotApi` | HubSpot | Marketing |
| `zendeskApi` | Zendesk | Support |
| `googleSheetsOAuth2Api` | Google Sheets | Data / Reporting |
| `githubApi` | GitHub | Engineering |
| `jiraSoftwareCloudApi` | Jira | Project Management |
| `postgresApi` | PostgreSQL | Database |
| `httpHeaderAuth` | Custom API | Varies |

**This gives us a VERIFIED system inventory** without relying on LLM to parse node types. Cross-reference with `nodes[].credentials` to know which workflows use which systems.

Orphaned credentials (not referenced by any workflow) = potential cleanup signal.

---

## 5. Variables, Projects, Data Tables, Discover — Additional Endpoints

### Variables (`GET /api/v1/variables`)

Global configuration values accessible in workflows via `$vars.KEY_NAME`.

```json
{
  "id": "var-1",
  "key": "API_BASE_URL",
  "value": "https://api.production.company.com",
  "type": "string",
  "project": { "id": "proj1", "name": "Sales Team", "type": "team" }
}
```

**What this reveals:**
- **Environment detection** — `ENVIRONMENT=production` confirms live instance vs test. Affects analysis confidence.
- **Shared infrastructure** — centralized API URLs, Slack channels, config values show mature automation setup.
- **Variable naming conventions** — well-structured names = organized team.

### Projects (`GET /api/v1/projects` + `GET /projects/{id}/users`)

Team/project organization for workflows.

```json
{
  "id": "proj-sales",
  "name": "Sales Automation",
  "type": "team"
}
```

Members: `{ "id": "user-uuid", "email": "jane@company.com", "role": "project:admin" }`

Roles: `project:viewer`, `project:editor`, `project:admin`

**What this reveals:**
- **Organizational structure** — project names map to teams/departments. "Sales Automation" + "Customer Support" = departmental ownership.
- **Process clustering hints** — project names are STRONG signals for business process grouping. If workflows are already in "Sales", "Support", "Finance" projects, the LLM should respect this.
- **Collaboration patterns** — multiple editors = collaborative. Single editor = concentrated knowledge.
- **Automation maturity** — many clear projects = mature practice. One "Default" project = early-stage.

### Data Tables (`GET /api/v1/data-tables` + `GET /data-tables/{id}/rows`)

Structured data storage within n8n.

```json
{
  "id": "dt-1",
  "name": "Failed Payments Log",
  "columns": [
    { "id": "col-1", "name": "invoice_id", "type": "string", "index": 0 },
    { "id": "col-2", "name": "amount", "type": "number", "index": 1 },
    { "id": "col-3", "name": "failure_reason", "type": "string", "index": 2 },
    { "id": "col-4", "name": "recovered", "type": "boolean", "index": 4 }
  ],
  "projectId": "proj-billing",
  "createdAt": "2024-09-01T10:00:00.000Z"
}
```

Column types: `string`, `number`, `boolean`, `date`. Rows support complex filter/sort/search queries.

**What this reveals:**
- **Data landscape** — what the company tracks outside workflow data. "Failed Payments Log" = billing is a concern.
- **Process evidence** — a data table is EVIDENCE of operational attention. LLM can reference it: "You already track failed payments — our recommendation builds on data you already collect."
- **Volume hints** — row counts give volume estimates without querying individual rows.

### Discover (`GET /api/v1/discover`)

API capability discovery — tells us what the connected instance supports.

```json
{
  "scopes": ["workflow:list", "workflow:create", "execution:list", "credential:list", ...],
  "resources": {
    "workflow": { "operations": ["list", "read", "create", "activate", ...] },
    "execution": { "operations": ["list", "read"] }
  },
  "specUrl": "/api/v1/docs/openapi.json"
}
```

**Critical for Expliq:** Call this FIRST during sync. Use it to:
- Detect which endpoints are available (older n8n versions lack data-tables, projects)
- Check API key permissions (if `workflow:create` is missing, disable deploy feature)
- Gracefully degrade — don't show data table insights if the instance doesn't support them

---

## 6. Tags, Users, Audit

### Tags

```json
{ "id": "tag1", "name": "Production", "createdAt": "...", "updatedAt": "..." }
```

If users tag workflows ("billing", "support", "onboarding"), these are FREE process clustering hints for the LLM.

### Users

```json
{ "id": "uuid", "email": "user@example.com", "firstName": "Jane", "lastName": "Doe", "role": "global:admin" }
```

Combined with `shared[].role` on workflows → ownership mapping from n8n itself.

### Audit (`POST /api/v1/audit`)

Returns categorized risks: unused credentials, community nodes, database exposure, filesystem access. Free governance signals that supplement our risk engine.

---

## 6. Create Workflow — Deploy Endpoint

`POST /api/v1/workflows`

```json
{
  "name": "Payment Failure Recovery",
  "nodes": [
    {
      "id": "trigger-uuid",
      "name": "Stripe Webhook",
      "type": "n8n-nodes-base.webhook",
      "typeVersion": 1,
      "position": [250, 300],
      "parameters": {
        "path": "stripe-payment-failed",
        "httpMethod": "POST"
      }
    }
  ],
  "connections": {},
  "settings": {
    "executionOrder": "v1"
  }
}
```

Returns the created workflow with `id`. Then `POST /api/v1/workflows/{id}/activate` to make it live.

**Important:** `active` is READ-ONLY on create. Must use separate activate endpoint.

---

## 7. Initial LLM Analysis — What's Realistically Inferrable

I'm an LLM. Let me be honest about what I can and can't do with this data.

### Per-workflow (from workflow JSON alone — NO execution data needed):

**HIGH CONFIDENCE (deterministic or near-certain):**
- Which systems are connected (from `nodes[].type` + `nodes[].credentials`)
- What the trigger is (first node type: webhook, schedule, manual, error)
- The execution flow graph (from `connections`)
- Whether error handling exists (from `settings.errorWorkflow`, `nodes[].onError`, `retryOnFail`)
- Connected workflows (from `settings.errorWorkflow`, `settings.callerIds`)
- Whether the workflow is simple or complex (node count, branching factor)
- Active/inactive status
- Data retention policy (from `settings.saveDataSuccessExecution`)
- Tags and project ownership

**MEDIUM CONFIDENCE (LLM inference from `parameters`):**
- What data flows between systems ("Salesforce Opportunities → Slack notifications" — from reading `parameters.resource`, `parameters.operation`, channel names, etc.)
- What the workflow does in business terms ("Scores leads based on firmographic signals and routes to sales reps")
- What MUST be true in connected systems ("Salesforce has Opportunity objects with stage fields")
- Business importance ("This touches revenue data and payment processing")
- Data types being processed ("Customer records with email, name, deal value")

**LOWER CONFIDENCE (LLM estimate, should be labeled):**
- Time savings ("Comparable companies save ~6 hrs/wk on similar lead routing")
- Revenue impact ("At your processing volume, failed invoices may cost ~$15K/mo")
- Business process assignment ("This appears to be part of the Lead-to-Close process")
- Failure impact ("If this breaks, lead routing goes manual for ~340 leads/wk")

### Per-workflow (WITH execution data):

Everything above PLUS these become HIGH CONFIDENCE:
- Runs per week (FACT)
- Error rate (FACT)
- Average execution time (FACT)
- Last run timestamp (FACT)
- Trigger mode distribution (FACT)
- Whether the workflow is actually used or just exists (FACT)

### Workspace-level (aggregated across all workflows):

**HIGH CONFIDENCE:**
- Complete system inventory (from credentials + node types)
- Dependency graph (from errorWorkflow + callerIds)
- Total workflow count, active/inactive distribution
- Tag-based groupings (if tags exist)
- Team/project structure (from shared/users)

**MEDIUM CONFIDENCE (LLM synthesis):**
- Business process clustering ("These 4 workflows form a Lead-to-Close process")
- System role identification ("Salesforce is your CRM, Slack is your notification hub")
- Per-system narrative ("Your Salesforce integration is strong for pipeline execution but missing on nurture")
- Gap detection ("You have Stripe but no failed payment recovery")
- Process suggestions ("You should have a Security & Compliance process based on detected Okta + BambooHR")

**LOWER CONFIDENCE (LLM estimate, always with reasoning):**
- Benchmark comparisons ("Companies with similar automation patterns typically see...")
- Aggregate time/money estimates ("Your automation portfolio saves ~50 hrs/wk")
- "Your next move" prioritization (depends on quality of all upstream analysis)

### What the LLM CANNOT do (hallucination territory):

- Know actual revenue numbers
- Know actual employee count
- Know the company's industry with certainty (can only infer from systems + data patterns)
- Predict future failures
- Know what happens OUTSIDE of automated workflows (manual processes)
- Generate perfect n8n JSON that works first try (can generate reasonable scaffolds)

---

## 8. Impact on Product Decisions

### Execution data changes the game

If the fairtix instance has execution history, we can show REAL operational data. This shifts the product from "LLM guesses about your workflows" to "here are the FACTS about your operations, plus LLM analysis of what they mean."

**Must verify against fairtix:** Does the instance have execution data? How much? Is it a demo instance with only manual test runs, or does it have real execution history?

### Node parameters are the treasure Per predicted

The `parameters` field on each node contains the actual business configuration. Salesforce field mappings, Slack channels, HTTP endpoints, SQL queries, filter conditions. This is what the LLM reads to understand what's REALLY happening. Per was right — this goes far deeper than "it connects Salesforce to Slack."

### Credentials API = verified system inventory

We don't need the LLM to guess which systems are connected. The credentials API gives us a definitive list. The LLM's job shifts from "identify systems" to "explain what these systems are doing together."

### `timeSavedPerExecution` is a gift

If n8n users fill in this field, we get their OWN ROI estimate for free. We can show it alongside the LLM's estimate: "You estimated 5 min saved per run. At 520 runs/wk, that's ~43 hrs/wk."

---

## 9. Next Step: Test Against Fairtix

When Per is ready, query the fairtix instance to verify:

1. `GET /api/v1/discover` — what does this instance support? Which endpoints are available?
2. `GET /api/v1/workflows` — how many workflows? Do they have tags? Do they have `shared` project data?
3. `GET /api/v1/workflows/{id}` for one workflow — what do the `parameters` actually look like? Is `errorWorkflow` set? Are there `callerIds`?
4. `GET /api/v1/executions?limit=10` — does execution data exist? What modes? What error rates?
5. `GET /api/v1/credentials` — what systems are connected?
6. `GET /api/v1/tags` — are tags used?
7. `GET /api/v1/users` — who are the users?
8. `GET /api/v1/projects` — how is work organized?
9. `GET /api/v1/variables` — any shared configuration?
10. `GET /api/v1/data-tables` — any structured data stored?

This will tell us definitively what we're working with and what the LLM will actually have to analyze for the demo.
