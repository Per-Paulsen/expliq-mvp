---
tags:
  - type/index
  - status/in-progress
---

# TODO — Expliq MVP

> Upstream: [PRD](expliq_prd.md) | [Map of Content](_MOC.md)

> **APPEND-ONLY**: Neue Einträge werden unten angefügt. Bestehende Einträge werden nur durch Abhaken (`- [x]`) geändert, niemals gelöscht oder umformuliert. Dies gilt auch für AI-Agenten — nichts entfernen, nichts umschreiben.

## Offen

### Checkin-Session Feedback 

- [ ] account management login/register much more professional, e.g. show how many characters needed for password, more clues 
- [ ] explain always when there is a waiting screen/bar/... 
- [ ] multiple instances loadable for each account. is this already multi-workspace?
- [ ] the automation get and sync screen in settings is not clear, no explanations what is done where and why ... it also looks overwhelming (permanent success feedback in settings? sorry, i dont know what that means, cannot read my note) 
- [ ] the dashboard view als looky overwehelming and asymmetric in size, e.g. sytem exposure much more dominant than other indicators 
- [ ] do we have sufficient security? e.g. db security (rules)?
- [ ] we can query more (useful) fields from the n8n instance get requests? e.g. creator, ...?
- [ ] not entire internal node-logic shown in detail view? e.g. llm classification logic, system prompts, etc. ...?
- [ ] the seach function is crapp, takes way too long, does not catch every letter when written inside it ...
- [ ] the mvp still needs to be much better: much better/modern saas dashboard layout/UX
- [ ] we have to talk about much more extensive features ... maybe even become actionable, i.e. advice the user on how to reduce risks of automations like steps he can implement, maybe even give advice on how to improve automations in n8n e.g. error handling, edge cases etc., but also from a business perspective ie. which other automations might be needed from a business perspective 
- [ ] in included two more md files in my dev/ folder that contain additional scope of expliq: lifecycle control, risk detection, impact classification, company/owner exposure ...

### n8n evening session insights

- [ ] do we already monitor or can or should we do it?
- [ ] are detail view explanations and risk calculation and so on created new on automations sync?
- [ ] we have no status filter or sort 
- [ ] are some automations shown multiple times? and if so then why?
- [ ] high impact/risk classifications not clear or appear very often? maybe we need always explanations for each classification? maybe we have to distinguish different risks i.e. docu risk vs. business risk vs. bad automation risk and so on ...? Do you understand? how can a non-active automation be risky? how can a non-revenue automation be as risky as an internal slack automation? what about automations without error handling? ... i feel like every automation that has not yet an owner assigned is automatically high risk, which is problematic when there are real high business risk, e.g. revenue-relevant, automations ...
- [ ] where do the names for the n8n automations in expliq come from? from the json? because these might not be the actual internal n8n automation names and this can be very confusing ... 
- [ ] do we need a sync history? because i synced many times and was not later shown what exactly changed on sync, only immediately after syncing ...
- [ ] the impact and risk classification and the business context was surprisingly well done and insightful. the trainer had to laugh so good was it ... this is really valuable! can we do more of this sort?
- [ ] there is otherwise too much text on the automation detail view, especially the nodes. and this is not so helpful when wanting to easily explain an automation. it might be good to have some kind of visualization of the workflow with it nodes and the nodes explanations then next to the nodes ... 
- [ ] the fairtix n8n instance from the evening session had a "global"? error handling automation workflow, that somehow solved the error handling for all other workflows in the instance. expliq got this correct in the explanation and also assigned high criticality? in impact? but it did not show this in systems connected ... and maybe for such workflow we need another category such as connected automations? that might be really insightful?
- [ ] we can work a lot and receive many insights from this fairtix n8n instance. it models a realy companies potential full n8n automation infrastructure. that might be worth gold as a testing instance for expliq. we are really lucky, that we had an entire evening session on n8n with such a complete model n8n instance - lets use it!!! the trainer already said about our current mvp: "thats a really cool tool you have there!" but how do we use it? how can we explore it and "test" its insights? do you know what i mean?
- [ ] i included this fairtix n8n instance in our .env file with instance url and api key in a comment
- [ ] i (think/hope) created the following account to import this n8n instance into expliq: email: abend@session.com, password: 123456789
- [ ] automation detail page appears a bit crouded and overwhelming, and the important risk context appears a bit too small in the upper right hand corner

### claude workflow logic and features

- [ ] shall we save plans? similar to specs and results, e.g. from /dev skill "executed" in planning mode? shall we review these plans then already against problems such as typical AI problems e.g. scope expansion? or can we already simplify these plans, e.g. with /simplify, before implementation?
- [ ] dev environment in windows? e.g. sandbox/WSL?
- [ ] do we really need the /refine skills? less and less useful for later features?
- [ ] do we do harness engineering?
- [ ] /auto-recommender?
- [ ] shall we include a /simplify step in our /dev skill, after code implementation?
- [ ] shall we include a documentation step in our /dev skill, e.g. write JSDocs? Do we already do that?
- [ ] shall we implement the server calls as rest apis? 
- [ ] can and should we use autonomous loops such as ralph loops? now plugin in claude code ...
- [ ] claude code # warp terminal
- [ ] shall we use wsl?
- [ ] shall we do dark mode?
- [ ] shall we use more @pointers in the claude.md file to give better context?
- [ ] how to include claude code "vibe coding" sessions, e.g. "implement dark mode" - "no, a darker dark mode" - "make the header light, not dark" - "also the footer" ... or "the cards do not look correct" - "the cards need to be organized strictly vertical" - ..., in our spec driven development approach? do you understand the problem?
- [ ] we need to separate seed, test and production dbs and env much better ...
- [ ] shall or can we use "vectoring" when working with the llm? we are already sending in batches or not?
- [ ] better ci/cd with feature dev on branches then github push and pull request with github actions for additional verification and then merge? is this the best practice way to do it?
- [ ] shall we also demonstrate a different integration than n8n? maybe something like open claw automations? n8n appears to not be up-to-date anymore, so we cannot really demonstrate expliqs benefits with it? but with open claw it might be more "mind-blowing"? are there currently specific shortcomings or issues with open claw, where expliq might help?
- [ ] in the bootcamp we have an exercise that requires us to implement n8n workflows for our projects. as this is done by all participants i can use this data as further testing data for expliq
- [ ] we really need much better and separated testing and production environments now 

(https://github.com/backnotprop/plannotator?tab=readme-ov-file#install-for-claude-code)

### questions for marten

- [ ] planning with claude and implementing with codex? planning then == planning mode? or what?
- [ ] multi-agent wf best practices? where and how to implement? different or same from team mode? what about planning mode? isnt this already also team mode?

### Supabase RLS Security Warning (2026-03-18)

Screenshots: `{65AF0D8A-897C-44AB-BB6B-1B9FE3102C3F}.png`, `{F757CD26-F093-41D4-9931-02E128BEA7C1}.png`

Supabase Security Advisor flagged 10 errors:
- **8x RLS Disabled in Public**: `_prisma_migrations`, `VerificationToken`, `Workspace`, `ConnectorConfig`, `Automation`, `Account`, `Session`, `User`
- **2x Sensitive Columns Exposed**: `Account`, `VerificationToken`

**Risk**: Not urgent — our app uses Prisma (direct DB connection), not PostgREST. But PostgREST is enabled by default on Supabase, so anyone with the project URL + anon key could theoretically query tables.

**Fix**: Create a Prisma migration that enables RLS on all 8 tables with no policies. Prisma connects as the `postgres` role which bypasses RLS, so the app is unaffected. PostgREST (anon role) gets locked out.

```sql
ALTER TABLE "_prisma_migrations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "VerificationToken" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Workspace" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ConnectorConfig" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Automation" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Account" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Session" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
```

- [x] Enable RLS on all Supabase tables (single migration, no code changes) — done 2026-03-25, migration `20260325175235_enable_rls` + direct SQL for `_prisma_migrations`

---

Summary for expliq-mvp Discussion

  Context

  Bootcamp exercises 19, 20, and 22 require implementing AI-powered features for Expliq. 
  Exercise 19 needs a working n8n workflow, exercise 22 needs a working chatbot. Both    
  require new code in the expliq-mvp repo.

  What needs to be built in expliq-mvp

  For Exercise 19 (AI Native Workflow Automation):

  A webhook endpoint that n8n can call when a workflow changes. The endpoint should:     
  - Accept a workflow change event from n8n
  - Re-sync that specific workflow (reuse existing syncWorkflows logic from connector.ts,
   but for a single workflow)
  - Re-run LLM analysis on the changed workflow (reuse processAutomation from
  llm-pipeline.ts)
  - Compare the old vs. new risk level (using getRiskLevel from risk-engine.ts)
  - Return the delta (previous risk, new risk, which signals changed)

  The n8n side then uses this delta to generate an AI explanation and send a Slack       
  notification to the owner.

  Exercise requirement: Trigger -> AI reasoning step -> automated action, implemented in 
  n8n.

  For Exercise 22 (AI Chatbot Integration):

  A governance chatbot on the Automation Detail page that:
  - Accepts user questions ("Why is this high-risk?")
  - Retrieves relevant sections from a markdown knowledge base (governance concepts, FAQ)
  - Builds a grounded prompt with knowledge + live automation data from Prisma
  - Calls Claude via OpenRouter
  - Returns a natural language explanation
  - Implements at least 1 guardrail (domain detection: skip LLM for off-topic questions) 

  New files needed: chat UI component, server action for chat, knowledge base markdown   
  files, retrieval logic, prompt builder.

  Exercise requirement: user input -> LLM -> response, using markdown knowledge, chosen  
  retrieval strategy, at least 1 guardrail.

  Exercise 20 (Agent Design) is design-only, no implementation needed.

  Existing code to reuse

  - src/lib/risk-engine.ts (getRiskLevel, getGovernanceSignals, getSystemExposure)       
  - src/lib/llm-pipeline.ts (processAutomation, OpenRouter setup)
  - src/lib/actions/connector.ts (syncWorkflows, n8n client)
  - src/lib/n8n-client.ts (createN8nClient, getWorkflow)
  - src/lib/session.ts (getRequiredSession for auth)

  Key architectural decision

  The current Expliq sync is pull-based (user clicks "Sync"). Exercise 19 requires       
  push-based sync (n8n notifies Expliq when something changes). This means adding a      
  webhook receiver to expliq-mvp, which is a new pattern for the codebase.

## Related

- [Map of Content](_MOC.md)
- [PRD](expliq_prd.md)
- [Exercise 15 Features](specs/patches/exercise-15-features.md)
- [Epic 09: Production Hardening](specs/09-hardening.md)
