# Epic 04 — LLM Pipeline: Results

## What Was Built

LLM integration via OpenRouter (using OpenAI SDK) that transforms raw n8n workflow JSON into structured, business-readable fields. Includes schema migration, core pipeline service, server actions for batch and single processing, and settings form integration for post-sync processing.

## Key Files Created/Modified

### New Files (5)
| File | Purpose |
|------|---------|
| `src/lib/llm-pipeline.ts` | Core LLM service: OpenAI client, structured prompt, JSON response parsing/validation, DB update |
| `src/lib/actions/llm.ts` | Server actions: processUnprocessedAutomations (batch), regenerateAutomation (single) |
| `src/__tests__/llm-pipeline.test.ts` | 10 unit tests for the pipeline service |
| `src/__tests__/llm-actions.test.ts` | 9 unit tests for the server actions |
| `prisma/migrations/20260310112220_add_impact_reasoning/migration.sql` | Adds `impactReasoning` column |

### Modified Files (4)
| File | Change |
|------|--------|
| `prisma/schema.prisma` | Added `impactReasoning String?` to Automation model |
| `src/components/settings-form.tsx` | Post-sync LLM processing trigger, processing indicator, result/error display |
| `src/__tests__/settings.test.tsx` | Added `@/lib/actions/llm` mock to fix module resolution |
| `.env.example` | Added `OPENROUTER_API_KEY`, `OPENROUTER_MODEL` |

## Decisions and Deviations from Spec

1. **Lazy OpenAI client initialization** — The spec implied module-scope initialization, but this crashes module loading if `OPENROUTER_API_KEY` is not set, breaking even non-LLM server actions. Changed to lazy `getOpenAIClient()` function called inside `processAutomation`.

2. **Markdown code fence stripping** — Added `content.replace(/^```(?:json)?\s*\n?/i, "").replace(/\n?```\s*$/i, "").trim()` before JSON parsing. Despite `response_format: { type: "json_object" }` and explicit prompt instructions, some models via OpenRouter still wrap responses in ` ```json ``` ` fences. This handles it gracefully per the spec's "handle malformed responses" requirement.

3. **Application-level timestamp filtering** — Prisma doesn't support column-to-column comparison natively (`automationLastUpdated > documentationLastUpdated`). Fetches all non-removed automations and filters in JS. Fine for MVP scale (tens to low hundreds of automations per workspace).

## Verification Results

| Check | Result |
|-------|--------|
| `npm run test` (72 tests, 10 files) | Pass |
| `npm run lint` | Pass (0 errors, 1 pre-existing warning) |
| `npm run build` | Pass |
| OpenRouter API connectivity | Pass |
| Full pipeline (10 real n8n workflows) | Pass (10/10 processed) |
| Field quality (names, descriptions) | High quality, sensible business summaries |
| systemsTouched lowercase normalization | Pass |
| Valid triggerType values | Pass (schedule, webhook, event, manual) |
| Valid impactProposal levels | Pass (all valid enum values) |
| impactReasoning populated | Pass |
| documentationLastUpdated set | Pass |
| Idempotency (re-run finds 0 to process) | Pass |
| Error handling (no data corruption) | Pass (402 errors handled, data untouched) |
| Markdown fence stripping | Pass (1 automation needed it) |

## Sample LLM Output

| Automation | triggerType | Impact | Systems |
|-----------|-------------|--------|---------|
| HubSpot → Gmail Cold Outreach | schedule | high | hubspot, gmail |
| Employee Onboarding Automation | webhook | high | google workspace, slack, jira, salesforce, gmail |
| Automated Lead Distribution and Assignment | webhook | high | slack, openai, email |
| Stripe Invoice Payment → HubSpot Deal Update + Slack Notifications | webhook | high | stripe, hubspot, slack |
| Stale Salesforce Deal Follow-up Automation | schedule | high | salesforce, openai, slack, smtp |
| Intelligent Lead Qualification and Routing System | event | high | gmail, hubspot, salesforce, slack, google sheets, openai |
| AI Lead Classification & Routing | manual | high | highlevel, azure, email |
| B2B SaaS Renewal Risk Management | schedule | high | postgres, hubspot, salesforce, pipedrive, zendesk, gmail, slack, trello, jira |
| High-Priority Salesforce Case Escalation to Slack | schedule | high | salesforce, slack |
| Client Call Summary & Multi-Channel Notification | webhook | high | hubspot, slack, gmail, whatsapp, openai |

## Risks for Future Epics

1. **All automations classified as "high" impact** — The LLM tends to classify most RevOps automations as "high" impact. The spec's impact override mechanism (epic 07) will be important for users to differentiate. The risk engine (epic 05) should not assume even distribution of impact levels.

2. **OpenRouter model variability** — Different models via OpenRouter may produce different quality output and may not fully respect `response_format: { type: "json_object" }`. The markdown fence stripping handles the most common case, but switching models may require monitoring output quality.

3. **Token cost for large workflows** — The raw workflow JSON for complex n8n workflows can be large (5K+ chars). With 10 automations, a full run costs ~$0.20. Larger n8n instances would cost proportionally more. No batching or summarization of workflow JSON is done.

4. **Sequential processing timeout** — Processing 10 automations takes ~2 minutes (10-12 seconds each). For larger n8n instances (50+ workflows), this could approach or exceed server action timeouts. The settings form handles this by showing progress, but the server action itself has no timeout protection.

5. **`openai` package added** — Adds the OpenAI SDK (with its dependencies) to the production bundle. This is used exclusively server-side for the LLM pipeline.

## Open Questions

**1. Should regeneration (epic 07 detail page) show a confirmation before re-running?**
Recommendation: **No.** The action is non-destructive (it overwrites LLM-generated fields, which are explicitly not user-editable). The button label "Regenerate" is clear about intent. Adding a confirmation dialog would add friction to a low-risk action. If the user clicks it by accident, they just get fresh LLM output — no data loss.

**2. Should stale documentation have a visual indicator?**
Recommendation: **Yes.** The Portfolio page (epic 06) should show a badge or icon on automations where `automationLastUpdated > documentationLastUpdated`. This is a key governance signal — it tells the user "the underlying n8n workflow changed since the documentation was last generated." A simple yellow/orange dot or "Outdated" chip next to the automation name would work. The risk engine (epic 05) already uses this timestamp comparison, so the UI should surface it too.

**3. Prompt refinement for impact classification variety.**
Recommendation: **Defer.** All 10 test automations were classified as "high" — likely because they're all RevOps automations touching customer data. The prompt already describes all four levels clearly. With a more diverse set of workflows (simple internal utilities, one-off data migrations, etc.), the LLM would likely produce more varied classifications. The user can override via `impactOverride` (epic 07). Prompt tuning is a post-MVP optimization.

## Process Notes (from user review)

- **Playwright MCP disconnection**: The Playwright MCP server disconnected mid-session, preventing browser-based e2e testing. Pipeline was verified via direct script instead. The /dev skill should be updated to handle Playwright lifecycle properly (close browser after verification, and handle reconnection if MCP drops).
- **Bash permissions**: User wants bash commands auto-allowed. See allowlist configuration below.

## Commit

`9efc6dc` — `feat: implement epic 4 — LLM pipeline`
