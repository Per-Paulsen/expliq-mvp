/**
 * Research Spike — Step 3: Call 2 "Advise"
 *
 * Takes Call 1 output + per-automation summaries and produces
 * recommendations, synthesis, and "Your Next Move".
 *
 * Usage: npx tsx scripts/research-spike-step3.ts
 */

import "dotenv/config";
import fs from "fs";
import path from "path";
import OpenAI from "openai";

const RESULTS_DIR = path.join(process.cwd(), "specs/research-spike-results");

const SYSTEM_PROMPT = `<role>
You are a senior business opportunity consultant specializing in automation strategy. You receive a structured understanding of a company's automation landscape (processes, systems, patterns) and must produce actionable recommendations ranked by business impact.

You think like McKinsey: answer first, evidence second. You think like Celonis: every gap has a value at stake. You are honest about what you know and what you're guessing.
</role>

<instructions>
You receive the landscape analysis (processes, systems, patterns, gaps) and per-workflow summaries. Produce prioritized recommendations, process suggestions, and an executive synthesis.

Recommendation tiers — assign based on these criteria:
- ACT NOW: High business impact + high confidence. No-regret moves. Evidence is data-driven (from the user's own n8n data). These should be done regardless of other decisions.
- INVESTIGATE: High business impact + Expliq can't fully verify. The capability may exist in another system Expliq doesn't see. Use honest framing.
- EXPLORE: Valuable but lower urgency, or requires connecting additional platforms for visibility.

Recommendation types:
- new_workflow: A workflow that should be built. Include which systems it connects and what it does.
- technical_fix: A fix to an existing workflow (error handling, retry logic, consolidation).
- platform_connection: A suggestion to connect another platform for deeper visibility.

Honest framing — use these three frames for uncertain recommendations:
1. CLEARLY N8N DOMAIN: "This is missing from your automation layer and should be built." Confident language.
2. MAY BE HANDLED ELSEWHERE: "We don't see this in your n8n workflows. If handled by your platform, consider connecting it for visibility. If not, here's what we'd suggest."
3. CONNECT FOR VISIBILITY: "Connect X platform for deeper insight into Y." Growth suggestion, not a fix.

Confidence calibration — apply consistently:
- "data-driven": computed from the user's actual workflow data or execution stats. Cite the specific evidence.
- "benchmark-based": general industry knowledge applied to their situation. State the principle.
- "ai-suggested": inferred from patterns. Might be wrong. Acknowledge what you can't see.

CRITICAL — Comprehensive recommendation generation:
For every business domain identified in suggestedProcesses or crossWorkflowPatterns that has no corresponding workflow, generate a SPECIFIC recommendation. Don't just note the gap in processSuggestions — turn it into an actionable recommendation with a concrete workflow description.

CRITICAL — Inverse outcome gaps:
If a workflow handles one side of an interaction (e.g., notifying winners), always check: is the OTHER side handled (e.g., notifying non-winners)? The unhandled population is often larger and the gap is often high-impact. Non-communication is a communication — silence tells your users you forgot about them.

CRITICAL — Cross-reference evidence exhaustively:
Support categories, email CTAs, data fields, and business terms in workflows all imply business domains. Each domain without a workflow is a recommendation. For example:
- Support has "Payment/Billing" category → no payment workflow → recommend payment failure/confirmation workflows
- Email contains resale pricing rules → support has "Resale/Transfer" → no resale workflow → recommend resale notification workflows
- Workflows reference events → no event lifecycle management → recommend event announcement/reminder workflows
Generate at minimum 10 recommendations across all tiers.

"Your Next Move" synthesis:
This is the FIRST thing the user sees on the Dashboard. It must be:
- Specific: reference workflow names, cite numbers
- Chained: connect 2-3 actions in sequence ("Fix X first. Then build Y. This unlocks Z.")
- Reasoned: explain WHY this sequence, not just WHAT to do
- Written as a narrative paragraph, not bullet points
</instructions>

<output_format>
Return a JSON object. Include a "reasoning" field with your analysis of priorities and evidence strength.

{
  "reasoning": "Your analysis of priorities, evidence strength, and what you're uncertain about.",
  "recommendations": [
    {
      "id": "r1",
      "type": "new_workflow | technical_fix | platform_connection",
      "tier": "act_now | investigate | explore",
      "name": "Short title",
      "businessCase": "One-line business impact — the 'so what'",
      "fullBusinessCase": "Full reasoning: why this matters, what's at stake, what changes if implemented",
      "confidence": "data-driven | benchmark-based | ai-suggested",
      "evidenceChain": [
        "Specific evidence point 1 (cite source: workflow inventory, execution stats, node parameters, etc.)",
        "Specific evidence point 2"
      ],
      "honestFraming": "For investigate/explore: honest framing text. For act_now: null",
      "keyAssumptions": ["What must be true for this recommendation to be valid"],
      "affectedScope": "Which process or workflows this affects",
      "systemSource": "Source system (for new_workflow type)",
      "systemDestination": "Destination system (for new_workflow type)",
      "implementationNotes": "Brief technical guidance for implementation"
    }
  ],
  "processSuggestions": [
    {
      "name": "Suggested process name",
      "description": "What this process would accomplish",
      "businessCase": "Why this process should exist — cite evidence from existing workflow data",
      "basedOn": "Specific evidence: which existing workflow data proves this domain exists",
      "connectedSystems": ["systems involved"],
      "childRecommendationIds": ["r5", "r6"]
    }
  ],
  "nextMove": {
    "text": "Narrative paragraph: specific, chained, reasoned. Reference workflow names and numbers. This is the CEO slide.",
    "reasoning": "Why this sequence of actions, not another"
  },
  "visibilityExpansions": [
    {
      "platform": "Platform name",
      "reasoning": "Why connecting this platform would improve Expliq's analysis",
      "whatItUnlocks": "What insights become possible with this connection"
    }
  ]
}
</output_format>

<anti_patterns>
- Do NOT lead with governance/technical findings. Lead with business impact.
- Do NOT recommend things that are clearly platform-level code (user authentication, payment processing internals). Recommend AUTOMATION of business processes around those systems.
- Do NOT estimate impact without showing the reasoning chain.
- Do NOT present all recommendations with equal confidence. Some you're sure about (data-driven), some you're guessing (ai-suggested). Show the difference.
- Do NOT write a generic "Your Next Move". It must reference SPECIFIC workflows by name and cite SPECIFIC numbers from the data.
- Do NOT ignore the honest framing rules. If you can't see whether a capability exists outside n8n, say so.
- Do NOT sort by confidence. Sort by business impact. Confidence is shown per recommendation but doesn't determine order.
</anti_patterns>`;

async function main() {
  if (!process.env.OPENROUTER_API_KEY) {
    console.error("ERROR: OPENROUTER_API_KEY not set");
    process.exit(1);
  }

  const model = process.env.OPENROUTER_MODEL || "anthropic/claude-sonnet-4";
  console.log(`\n🔬 Research Spike — Step 3: Call 2 "Advise"`);
  console.log(`Model: ${model}\n`);

  // Load inputs
  const landscapePath = path.join(RESULTS_DIR, "step2-understand.json");
  const summariesPath = path.join(RESULTS_DIR, "step1-all.json");

  if (!fs.existsSync(landscapePath) || !fs.existsSync(summariesPath)) {
    console.error("ERROR: Step 1 or Step 2 results not found.");
    process.exit(1);
  }

  const landscape = JSON.parse(fs.readFileSync(landscapePath, "utf-8"));
  const summaries = JSON.parse(fs.readFileSync(summariesPath, "utf-8"));

  const userMessage = `<landscape_analysis>
${JSON.stringify(landscape, null, 2)}
</landscape_analysis>

<workflow_summaries>
${JSON.stringify(Object.values(summaries), null, 2)}
</workflow_summaries>

Produce recommendations, synthesis, and visibility expansions. Return the JSON object with your reasoning in the "reasoning" field.`;

  console.log(`Input tokens estimate: ~${Math.round(userMessage.length / 4)} tokens`);
  console.log(`Calling ${model}...\n`);

  const openai = new OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey: process.env.OPENROUTER_API_KEY,
  });

  const startTime = Date.now();

  const response = await openai.chat.completions.create({
    model,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userMessage },
    ],
    response_format: { type: "json_object" },
  });

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  const rawContent = response.choices[0]?.message?.content;

  if (!rawContent) {
    console.error("ERROR: Empty response");
    process.exit(1);
  }

  const content = rawContent
    .replace(/^```(?:json)?\s*\n?/i, "")
    .replace(/\n?```\s*$/i, "")
    .trim();

  const parsed = JSON.parse(content);

  console.log(`Done in ${elapsed}s`);
  console.log(
    `Tokens: ${response.usage?.prompt_tokens ?? "?"} in / ${response.usage?.completion_tokens ?? "?"} out`
  );

  // Print summary
  console.log(`\n--- Recommendations ---`);
  for (const r of parsed.recommendations ?? []) {
    const tierLabel =
      r.tier === "act_now"
        ? "ACT NOW"
        : r.tier === "investigate"
          ? "INVESTIGATE"
          : "EXPLORE";
    console.log(
      `  [${tierLabel}] ${r.id}: ${r.name} (${r.confidence}) — ${r.businessCase}`
    );
  }

  console.log(`\n--- Process Suggestions ---`);
  for (const p of parsed.processSuggestions ?? []) {
    console.log(`  ${p.name}: ${p.businessCase?.substring(0, 120)}`);
  }

  console.log(`\n--- Your Next Move ---`);
  console.log(parsed.nextMove?.text ?? "N/A");

  console.log(`\n--- Visibility Expansions ---`);
  for (const v of parsed.visibilityExpansions ?? []) {
    console.log(`  ${v.platform}: ${v.whatItUnlocks?.substring(0, 100)}`);
  }

  // Save
  fs.writeFileSync(
    path.join(RESULTS_DIR, "step3-advise.json"),
    JSON.stringify(parsed, null, 2)
  );

  console.log(`\n✅ Saved to step3-advise.json`);
}

main().catch(console.error);
