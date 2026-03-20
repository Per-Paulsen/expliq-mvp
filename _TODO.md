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
- [ ] we can work a lot and receive many insights from this fairtix n8n instance. it models a realy companies potential full n8n automation infrastructure. that might be worth gold as a testing instance for expliq. we are really lucky, that we had an entire evening session on n8n with such a complete model n8n instance - lets use it!!! the trainer already said about our current mvp: "thats a really cool tool you have there!"
- [ ] i included this fairtix n8n instance in our .env file with instance url and api key in a comment
- [ ] i (think/hope) created the following account to import this n8n instance into expliq: email: abend@session.com, password: 123456789

### claude workflow logic

- [ ] shall we save plans? similar to specs and results, e.g. from /dev skill "executed" in planning mode? shall we review these plans then already against problems such as typical AI problems e.g. scope expansion? or can we already simplify these plans, e.g. with /simplify, before implementation?
- [ ] dev environment in windows? e.g. sandbox/WSL?
- [ ] do we really need the /refine skills? less and less useful for later features?
- [ ] do we do harness engineering?
- [ ] /auto-recommender?
- [ ] shall we include a /simplify step in our /dev skill, after code implementation?
- [ ] claude code # warp terminal

### questions for marten

- [ ] planning with claude and implementing with codex? planning then == planning mode? or what?
- [ ] multi-agent wf best practices? where and how to implement? different or same from team mode? what about planning mode? isnt this already also team mode? 

---

## Related

- [Map of Content](_MOC.md)
- [PRD](expliq_prd.md)
- [Exercise 15 Features](specs/patches/exercise-15-features.md)
- [Epic 09: Production Hardening](specs/09-hardening.md)
