/**
 * Dashboard verification seed script
 *
 * Populates CompanyProfile, BusinessProcess, and Recommendation records
 * for the seed-real@expliq.dev workspace so the Dashboard page renders fully.
 * Also enriches existing Automation records with LLM-like analysis fields.
 *
 * Idempotent — deletes existing dashboard records before creating new ones.
 *
 * Usage: npx tsx scripts/seed-dashboard-verify.ts
 */
import "dotenv/config";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";

const REAL_EMAIL = "seed-real@expliq.dev";

// ── Helpers ─────────────────────────────────────────────

function daysAgo(n: number): Date {
  return new Date(Date.now() - n * 24 * 60 * 60 * 1000);
}

// ── Main ────────────────────────────────────────────────

async function main() {
  console.log("=== Dashboard Verification Seed ===\n");

  // 1. Find workspace
  const user = await prisma.user.findUnique({ where: { email: REAL_EMAIL } });
  if (!user) {
    console.error(`User ${REAL_EMAIL} not found. Run seed-test-data.ts first.`);
    process.exit(1);
  }
  const workspaceId = user.workspaceId;
  console.log(`Found workspace ${workspaceId} for ${REAL_EMAIL}`);

  // 2. Load existing automations
  const automations = await prisma.automation.findMany({
    where: { workspaceId, isRemoved: false },
    select: { id: true, externalId: true, name: true, status: true },
  });
  console.log(`Found ${automations.length} automations`);

  if (automations.length === 0) {
    console.error("No automations found. Sync n8n data first.");
    process.exit(1);
  }

  // 3. Cleanup existing dashboard data (idempotent)
  console.log("\nCleaning up existing dashboard data...");
  await prisma.$transaction([
    // Recommendations reference processes, so delete first
    prisma.recommendation.deleteMany({ where: { workspaceId } }),
    prisma.processSuggestion.deleteMany({ where: { workspaceId } }),
  ]);
  // Automations reference processes — clear processId before deleting processes
  await prisma.automation.updateMany({
    where: { workspaceId, processId: { not: null } },
    data: { processId: null },
  });
  await prisma.businessProcess.deleteMany({ where: { workspaceId } });
  await prisma.companyProfile.deleteMany({ where: { workspaceId } });
  console.log("  Cleaned up CompanyProfile, BusinessProcess, Recommendation");

  // Build name-based lookup
  const autoNames = automations.map((a) => a.name ?? "Untitled");

  // 4. Create BusinessProcess records
  console.log("\nCreating BusinessProcess records...");

  // Pick automations for each process (distribute them)
  const leadProcessAutos = automations.slice(0, 3);
  const commsProcessAutos = automations.slice(3, 6);
  const onboardingProcessAutos = automations.slice(6, 8);
  const reportingProcessAutos = automations.slice(8, 10);

  const processData: Array<{
    name: string;
    summary: string;
    maturityLevel: string;
    valueAtStake: string;
    order: number;
    steps: Array<{ name: string; isAutomated: boolean; isGap: boolean; automationId?: string }>;
    automationIds: string[];
  }> = [
    {
      name: "Lead Management",
      summary:
        "End-to-end lead capture, qualification, and routing pipeline. Covers inbound form submissions through to CRM assignment and sales notification.",
      maturityLevel: "Production",
      valueAtStake: "~€2.1K/mo in pipeline velocity",
      order: 1,
      steps: [
        { name: "Capture inbound lead", isAutomated: true, isGap: false, automationId: leadProcessAutos[0]?.id },
        { name: "Enrich lead data", isAutomated: true, isGap: false, automationId: leadProcessAutos[1]?.id },
        { name: "Score and qualify", isAutomated: false, isGap: true },
        { name: "Route to sales rep", isAutomated: true, isGap: false, automationId: leadProcessAutos[2]?.id },
        { name: "Send follow-up email", isAutomated: false, isGap: true },
      ],
      automationIds: leadProcessAutos.map((a) => a.id),
    },
    {
      name: "Customer Communication",
      summary:
        "Automated customer touchpoints including onboarding emails, status updates, and feedback collection across multiple channels.",
      maturityLevel: "Developing",
      valueAtStake: "~€900/mo in response time savings",
      order: 2,
      steps: [
        { name: "Trigger welcome sequence", isAutomated: true, isGap: false, automationId: commsProcessAutos[0]?.id },
        { name: "Send status update", isAutomated: true, isGap: false, automationId: commsProcessAutos[1]?.id },
        { name: "Collect feedback", isAutomated: false, isGap: true },
        { name: "Route escalations", isAutomated: true, isGap: false, automationId: commsProcessAutos[2]?.id },
      ],
      automationIds: commsProcessAutos.map((a) => a.id),
    },
    {
      name: "Employee Onboarding",
      summary:
        "New hire setup automation covering account provisioning, tool access, and team notifications. Partially automated with manual gaps in equipment ordering.",
      maturityLevel: "Emerging",
      valueAtStake: "~€600/mo in admin time",
      order: 3,
      steps: [
        { name: "Create user accounts", isAutomated: true, isGap: false, automationId: onboardingProcessAutos[0]?.id },
        { name: "Provision tool access", isAutomated: true, isGap: false, automationId: onboardingProcessAutos[1]?.id },
        { name: "Order equipment", isAutomated: false, isGap: true },
        { name: "Schedule orientation", isAutomated: false, isGap: true },
        { name: "Send welcome kit", isAutomated: false, isGap: true },
      ],
      automationIds: onboardingProcessAutos.map((a) => a.id),
    },
    {
      name: "Reporting & Analytics",
      summary:
        "Automated data collection and report generation across sales, marketing, and operations dashboards.",
      maturityLevel: "Production",
      valueAtStake: "~€500/mo in manual reporting",
      order: 4,
      steps: [
        { name: "Collect data from sources", isAutomated: true, isGap: false, automationId: reportingProcessAutos[0]?.id },
        { name: "Transform and aggregate", isAutomated: true, isGap: false, automationId: reportingProcessAutos[1]?.id },
        { name: "Generate reports", isAutomated: false, isGap: true },
      ],
      automationIds: reportingProcessAutos.map((a) => a.id),
    },
  ];

  const createdProcesses: Array<{ id: string; name: string; automationIds: string[] }> = [];

  for (const pd of processData) {
    const process = await prisma.businessProcess.create({
      data: {
        workspaceId,
        name: pd.name,
        summary: pd.summary,
        maturityLevel: pd.maturityLevel,
        valueAtStake: pd.valueAtStake,
        order: pd.order,
        steps: pd.steps as Prisma.InputJsonValue,
      },
    });
    createdProcesses.push({ id: process.id, name: pd.name, automationIds: pd.automationIds });

    // Link automations to this process
    if (pd.automationIds.length > 0) {
      await prisma.automation.updateMany({
        where: { id: { in: pd.automationIds } },
        data: { processId: process.id },
      });
    }

    console.log(`  Created: ${pd.name} (${pd.automationIds.length} automations linked)`);
  }

  // 5. Create Recommendation records
  console.log("\nCreating Recommendation records...");

  const recommendations: Array<Omit<Prisma.RecommendationCreateInput, "workspace"> & { _processIndex?: number }> = [
    // act-now (3)
    {
      type: "fix",
      tier: "act-now",
      name: "Add error handling to lead capture",
      brief: "Lead capture workflow lacks error handling — silent failures lose inbound leads.",
      businessCase: `The "${leadProcessAutos[0]?.name ?? autoNames[0]}" workflow processes high-value inbound leads but has no error handling. A single API timeout silently drops the lead, costing an estimated €300-500 per lost opportunity.`,
      confidence: "high",
      impactEstimate: "~€1.2K/mo saved",
      priorityOrder: 1,
      affectedScope: "Lead Management",
      _processIndex: 0,
    },
    {
      type: "optimize",
      tier: "act-now",
      name: "Reduce error rate on status notifications",
      brief: "Status notification workflow running at 8% error rate — customers missing updates.",
      businessCase: "Customer-facing status updates are failing frequently, leading to support tickets and churn risk. Adding retry logic and fallback channels would bring error rate under 1%.",
      confidence: "high",
      impactEstimate: "~€800/mo in support cost",
      priorityOrder: 2,
      affectedScope: "Customer Communication",
      _processIndex: 1,
    },
    {
      type: "fix",
      tier: "act-now",
      name: "Monitor critical data sync workflow",
      brief: "High-impact data sync has no monitoring — failures go undetected for hours.",
      businessCase: "This workflow syncs CRM data that downstream processes depend on. Without monitoring, a failure cascades into stale dashboards and missed follow-ups.",
      confidence: "high",
      impactEstimate: "~€600/mo risk reduction",
      priorityOrder: 3,
      affectedScope: "Reporting & Analytics",
      _processIndex: 3,
    },
    // investigate (3)
    {
      type: "automate",
      tier: "investigate",
      name: "Automate lead scoring step",
      brief: "Manual lead scoring is a bottleneck — could be automated with existing CRM data.",
      businessCase: "The lead scoring gap in the Lead Management process adds 2-3 hours per week of manual work. An automated scoring workflow using existing HubSpot data could eliminate this entirely.",
      confidence: "medium",
      impactEstimate: "~2 hrs/wk saved",
      priorityOrder: 4,
      affectedScope: "Lead Management",
      _processIndex: 0,
    },
    {
      type: "automate",
      tier: "investigate",
      name: "Add feedback collection automation",
      brief: "Customer feedback is collected manually — automating could improve response rates by 3x.",
      businessCase: "Post-interaction feedback surveys are sent manually and inconsistently. An automated trigger after ticket resolution would increase collection rate from ~15% to ~45%.",
      confidence: "medium",
      impactEstimate: "~1.5 hrs/wk saved",
      priorityOrder: 5,
      affectedScope: "Customer Communication",
      _processIndex: 1,
    },
    {
      type: "enhance",
      tier: "investigate",
      name: "Consolidate reporting workflows",
      brief: "Three separate report workflows could be merged into one scheduled pipeline.",
      businessCase: "Multiple overlapping data collection workflows run at different times, causing inconsistent numbers across dashboards. Consolidating into a single pipeline would improve data consistency and reduce n8n execution load.",
      confidence: "medium",
      impactEstimate: "~€400/mo efficiency",
      priorityOrder: 6,
      affectedScope: "Reporting & Analytics",
      _processIndex: 3,
    },
    // explore (2)
    {
      type: "new-automation",
      tier: "explore",
      name: "Equipment ordering automation",
      brief: "New hire equipment ordering is fully manual — explore integration with procurement system.",
      businessCase: "Each new hire requires 30-45 minutes of manual equipment ordering. With 2-3 hires per month, automating the standard equipment bundle request could save significant admin time.",
      confidence: "low",
      impactEstimate: "~1 hr/wk potential",
      priorityOrder: 7,
      affectedScope: "Employee Onboarding",
      _processIndex: 2,
    },
    {
      type: "new-automation",
      tier: "explore",
      name: "Automated orientation scheduling",
      brief: "Orientation scheduling could integrate with Google Calendar to auto-book sessions.",
      businessCase: "Orientation scheduling involves back-and-forth emails between HR, managers, and new hires. A calendar integration could auto-propose slots based on availability.",
      confidence: "low",
      impactEstimate: "~30 min/wk potential",
      priorityOrder: 8,
      affectedScope: "Employee Onboarding",
      _processIndex: 2,
    },
  ];

  for (const rec of recommendations) {
    const processIndex = rec._processIndex;
    const processId = processIndex != null ? createdProcesses[processIndex]?.id : undefined;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { _processIndex, ...recData } = rec;

    await prisma.recommendation.create({
      data: {
        ...recData,
        workspace: { connect: { id: workspaceId } },
        ...(processId ? { process: { connect: { id: processId } } } : {}),
      },
    });
    console.log(`  Created: [${rec.tier}] ${rec.name}`);
  }

  // 6. Update automations with LLM-like analysis fields
  console.log("\nUpdating automations with analysis fields...");

  // Build diverse analysis profiles
  const analysisProfiles: Array<{
    index: number;
    status: "active" | "inactive";
    errorRate: number | null;
    businessNarrative: string;
    impact: { level: string; failureScenario: string; revenueConnection: string };
    detectability: { level: string; reasoning: string; evidence: string };
    stepName: string;
    systemsTouched: string[];
  }> = [
    // Automation 0: critical (high error rate, active)
    {
      index: 0,
      status: "active",
      errorRate: 0.31,
      businessNarrative: `This workflow captures inbound leads from the website form and routes them to the CRM. It is the primary entry point for the sales pipeline and processes an average of 40 leads per week.`,
      impact: { level: "critical", failureScenario: "Inbound leads are silently dropped, causing lost revenue opportunities", revenueConnection: "Directly feeds sales pipeline — each lost lead represents €200-500 in potential ARR" },
      detectability: { level: "silent", reasoning: "No error handling or notification on failure", evidence: "No error workflow configured, no Slack alerts" },
      stepName: "Capture inbound lead",
      systemsTouched: ["Typeform", "HubSpot", "Slack"],
    },
    // Automation 1: attention (moderate error rate, active)
    {
      index: 1,
      status: "active",
      errorRate: 0.08,
      businessNarrative: `Enriches newly captured leads with company data from Clearbit before they enter the qualification stage. Adds firmographic data that sales reps use for prioritization.`,
      impact: { level: "high", failureScenario: "Lead data remains incomplete, slowing sales qualification by 1-2 days", revenueConnection: "Delays in qualification reduce conversion rates on time-sensitive deals" },
      detectability: { level: "partially-monitored", reasoning: "Errors logged but not actively alerted", evidence: "Console logging present but no Slack/email notification" },
      stepName: "Enrich lead data",
      systemsTouched: ["HubSpot", "Clearbit", "Google Sheets"],
    },
    // Automation 2: healthy
    {
      index: 2,
      status: "active",
      errorRate: 0.02,
      businessNarrative: `Routes qualified leads to the appropriate sales rep based on territory, deal size, and product interest. Sends assignment notification via Slack with lead summary.`,
      impact: { level: "medium", failureScenario: "Leads sit unassigned for hours, reducing response time SLA", revenueConnection: "Slower response time correlates with 15-20% lower conversion" },
      detectability: { level: "monitored", reasoning: "Error workflow configured with Slack notification", evidence: "Error workflow ID present, alerts go to #ops-alerts channel" },
      stepName: "Route to sales rep",
      systemsTouched: ["HubSpot", "Slack", "Salesforce"],
    },
    // Automation 3: attention (inactive, recently executed)
    {
      index: 3,
      status: "inactive",
      errorRate: null,
      businessNarrative: `Sends automated welcome emails to new customers after their first purchase. Includes onboarding checklist and links to help resources.`,
      impact: { level: "high", failureScenario: "New customers receive no onboarding guidance, increasing early churn risk", revenueConnection: "First-week engagement is the strongest predictor of 90-day retention" },
      detectability: { level: "monitored", reasoning: "SendGrid delivery webhooks tracked", evidence: "Delivery status synced back to CRM contact record" },
      stepName: "Trigger welcome sequence",
      systemsTouched: ["Stripe", "SendGrid", "HubSpot"],
    },
    // Automation 4: healthy
    {
      index: 4,
      status: "active",
      errorRate: 0.01,
      businessNarrative: `Sends order status updates to customers via email when their shipment status changes. Pulls tracking data from the fulfillment API and formats customer-friendly updates.`,
      impact: { level: "medium", failureScenario: "Customers contact support for status updates, increasing ticket volume", revenueConnection: "Each avoided support ticket saves ~€8 in agent time" },
      detectability: { level: "monitored", reasoning: "Full error handling with retry and fallback", evidence: "Error workflow configured, retry on 429/500 responses" },
      stepName: "Send status update",
      systemsTouched: ["ShipStation", "SendGrid", "Gmail"],
    },
    // Automation 5: healthy
    {
      index: 5,
      status: "active",
      errorRate: 0.03,
      businessNarrative: `Monitors customer support inbox and routes urgent escalations to the on-call team via Slack. Classifies ticket priority using keyword matching.`,
      impact: { level: "high", failureScenario: "Urgent customer issues go unnoticed for hours during off-hours", revenueConnection: "Delayed escalation response risks churn of high-value accounts" },
      detectability: { level: "partially-monitored", reasoning: "Partial monitoring — logs errors but no proactive alert", evidence: "Error logging present, no dedicated error workflow" },
      stepName: "Route escalations",
      systemsTouched: ["Gmail", "Slack", "Zendesk"],
    },
  ];

  // Apply remaining automations with lighter profiles
  for (let i = 6; i < Math.min(automations.length, 10); i++) {
    analysisProfiles.push({
      index: i,
      status: i % 3 === 0 ? "inactive" as const : "active" as const,
      errorRate: i === 7 ? 0.05 : i === 9 ? null : 0.01,
      businessNarrative: `Handles automated data processing for the ${i < 8 ? "Employee Onboarding" : "Reporting & Analytics"} process. Runs on a regular schedule and integrates with internal tools.`,
      impact: {
        level: i < 8 ? "medium" : "low",
        failureScenario: "Process step delayed until manual intervention",
        revenueConnection: "Indirect impact through operational efficiency",
      },
      detectability: {
        level: i % 2 === 0 ? "monitored" as const : "silent" as const,
        reasoning: i % 2 === 0 ? "Error workflow configured" : "No monitoring in place",
        evidence: i % 2 === 0 ? "Error workflow ID present" : "No error workflow, no alerts",
      },
      stepName: i < 8 ? (i === 6 ? "Create user accounts" : "Provision tool access") : (i === 8 ? "Collect data from sources" : "Transform and aggregate"),
      systemsTouched: i < 8
        ? ["Google Workspace", "Slack", "Jira"]
        : ["Google Sheets", "BigQuery", "Slack"],
    });
  }

  let updatedCount = 0;
  for (const profile of analysisProfiles) {
    const auto = automations[profile.index];
    if (!auto) continue;

    await prisma.automation.update({
      where: { id: auto.id },
      data: {
        status: profile.status,
        errorRate: profile.errorRate,
        businessNarrative: profile.businessNarrative,
        impact: profile.impact as Prisma.InputJsonValue,
        detectability: profile.detectability as Prisma.InputJsonValue,
        stepName: profile.stepName,
        systemsTouched: profile.systemsTouched,
        analysisStatus: "complete",
        lastExecutedAt: profile.status === "inactive" ? daysAgo(5) : daysAgo(1),
        runsPerWeek: profile.status === "active" ? 15 + profile.index * 5 : null,
      },
    });
    updatedCount++;
  }
  console.log(`  Updated ${updatedCount} automations with analysis fields`);

  // 7. Create CompanyProfile
  console.log("\nCreating CompanyProfile...");

  // Build systemLandscape from automation systemsTouched
  const systemCounts = new Map<string, number>();
  for (const profile of analysisProfiles) {
    for (const sys of profile.systemsTouched) {
      systemCounts.set(sys, (systemCounts.get(sys) || 0) + 1);
    }
  }
  const systemLandscape = Array.from(systemCounts.entries())
    .map(([name, workflowCount]) => ({ name, workflowCount }))
    .sort((a, b) => b.workflowCount - a.workflowCount);

  // Reference real workflow names in nextMoveText
  const topWorkflowNames = automations.slice(0, 3).map((a) => a.name ?? "Untitled");

  await prisma.companyProfile.create({
    data: {
      workspaceId,
      analysisStatus: "complete",
      nextMoveText: `Fix "${topWorkflowNames[0]}" — 31% error rate, no monitoring. Then automate manual lead scoring in Lead Management. Two moves, ~€2K/mo recovered.`,
      nextMoveReasoning: "Prioritized by combining error rate severity (31% on a critical workflow) with the largest automation gap (manual lead scoring) in the highest-value process.",
      systemLandscape: systemLandscape as Prisma.InputJsonValue,
      aggregateEstimates: {
        totalTimeSavings: "~12 hrs/wk",
        totalValueAtRisk: "~€4.2K/mo",
      } as Prisma.InputJsonValue,
      deltaSummary: "Since last analysis: 2 workflows updated, error rates improved on 1 workflow",
      analyzedAt: new Date(),
    },
  });
  console.log("  Created CompanyProfile (analysisStatus: complete)");

  // 8. Summary
  console.log("\n=== Summary ===");
  console.log(`  Workspace:       ${workspaceId}`);
  console.log(`  CompanyProfile:  1 (status: complete)`);
  console.log(`  BusinessProcess: ${createdProcesses.length} (${createdProcesses.map((p) => p.name).join(", ")})`);
  console.log(`  Recommendations: ${recommendations.length} (${recommendations.filter((r) => r.tier === "act-now").length} act-now, ${recommendations.filter((r) => r.tier === "investigate").length} investigate, ${recommendations.filter((r) => r.tier === "explore").length} explore)`);
  console.log(`  Automations:     ${updatedCount} updated with analysis fields`);
  console.log(`  Systems:         ${systemLandscape.length} (${systemLandscape.map((s) => s.name).join(", ")})`);
  console.log(`\n  Login: ${REAL_EMAIL} / SeedTest123!`);
  console.log("\nDone!");
}

main()
  .catch((err) => {
    console.error("Fatal error:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
