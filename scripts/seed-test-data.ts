/**
 * Seed script for Epic 05.5 — Test Infrastructure
 *
 * Creates two workspaces:
 * 1. Mock workspace: 19 automations with crafted n8n workflow JSON + governance fields
 * 2. Real workspace: syncs from a live n8n instance (skipped if creds missing)
 *
 * Both workspaces run the LLM pipeline if OPENROUTER_API_KEY is set.
 *
 * Usage: npx tsx scripts/seed-test-data.ts
 */
import "dotenv/config";
import { prisma } from "@/lib/prisma";
import { encrypt } from "@/lib/encryption";
import { createN8nClient } from "@/lib/n8n-client";
import { processAutomation } from "@/lib/llm-pipeline";
import {
  getEffectiveImpact,
  getRiskLevel,
  getGovernanceSignals,
} from "@/lib/risk-engine";
import bcrypt from "bcrypt";
import type { Prisma } from "@/generated/prisma/client";

// ── Constants ───────────────────────────────────────────

const MOCK_EMAIL = "seed-mock@expliq.dev";
const REAL_EMAIL = "seed-real@expliq.dev";
const PASSWORD = "SeedTest123!";
const SALT_ROUNDS = 10;

// ── Helpers ─────────────────────────────────────────────

function daysAgo(n: number): Date {
  return new Date(Date.now() - n * 24 * 60 * 60 * 1000);
}

async function cleanupWorkspace(email: string): Promise<void> {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return;

  console.log(`  Cleaning up workspace for ${email}...`);
  await prisma.$transaction([
    prisma.automation.deleteMany({ where: { workspaceId: user.workspaceId } }),
    prisma.connectorConfig.deleteMany({ where: { workspaceId: user.workspaceId } }),
    prisma.account.deleteMany({ where: { userId: user.id } }),
    prisma.session.deleteMany({ where: { userId: user.id } }),
    prisma.user.delete({ where: { id: user.id } }),
    prisma.workspace.delete({ where: { id: user.workspaceId } }),
  ]);
  console.log(`  Cleaned up workspace ${user.workspaceId}`);
}

// ── Mock Workflow Definitions ───────────────────────────

interface MockWorkflow {
  id: string;
  name: string;
  active: boolean;
  updatedAt: string;
  createdAt: string;
  nodes: Array<{
    id: string;
    name: string;
    type: string;
    position: [number, number];
    parameters: Record<string, unknown>;
  }>;
  connections: Record<string, unknown>;
}

const MOCK_WORKFLOWS: MockWorkflow[] = [
  // #1 — Blog Post → Slack Notification (low target)
  {
    id: "mock-1",
    name: "Blog Post → Slack Notification",
    active: true,
    updatedAt: daysAgo(2).toISOString(),
    createdAt: daysAgo(90).toISOString(),
    nodes: [
      {
        id: "n1",
        name: "WordPress Trigger",
        type: "n8n-nodes-base.wordpressTrigger",
        position: [250, 300],
        parameters: { event: "post_published", resource: "post" },
      },
      {
        id: "n2",
        name: "Send Slack Message",
        type: "n8n-nodes-base.slack",
        position: [450, 300],
        parameters: {
          channel: "#content-updates",
          text: "New blog post published: {{$json.title}}",
        },
      },
    ],
    connections: { "WordPress Trigger": { main: [[{ node: "Send Slack Message", type: "main", index: 0 }]] } },
  },

  // #2 — Daily Standup Reminder (low target)
  {
    id: "mock-2",
    name: "Daily Standup Reminder",
    active: true,
    updatedAt: daysAgo(3).toISOString(),
    createdAt: daysAgo(120).toISOString(),
    nodes: [
      {
        id: "n1",
        name: "Schedule Trigger",
        type: "n8n-nodes-base.scheduleTrigger",
        position: [250, 300],
        parameters: { rule: { interval: [{ field: "cronExpression", expression: "0 9 * * 1-5" }] } },
      },
      {
        id: "n2",
        name: "Post Standup Reminder",
        type: "n8n-nodes-base.slack",
        position: [450, 300],
        parameters: {
          channel: "#engineering",
          text: "Good morning team! Time for standup. Please share your updates.",
        },
      },
    ],
    connections: { "Schedule Trigger": { main: [[{ node: "Post Standup Reminder", type: "main", index: 0 }]] } },
  },

  // #3 — Weekly Report Email (low target)
  {
    id: "mock-3",
    name: "Weekly Report Email",
    active: true,
    updatedAt: daysAgo(3).toISOString(),
    createdAt: daysAgo(60).toISOString(),
    nodes: [
      {
        id: "n1",
        name: "Weekly Schedule",
        type: "n8n-nodes-base.scheduleTrigger",
        position: [250, 300],
        parameters: { rule: { interval: [{ field: "cronExpression", expression: "0 8 * * 1" }] } },
      },
      {
        id: "n2",
        name: "Read Google Sheet",
        type: "n8n-nodes-base.googleSheets",
        position: [450, 300],
        parameters: { operation: "read", sheetId: "weekly-metrics-sheet", range: "A1:F50" },
      },
      {
        id: "n3",
        name: "Send Email Report",
        type: "n8n-nodes-base.gmail",
        position: [650, 300],
        parameters: {
          to: "team@company.com",
          subject: "Weekly Metrics Report — {{$now.format('YYYY-MM-DD')}}",
          body: "Attached are this week's metrics from the tracking sheet.",
        },
      },
    ],
    connections: {
      "Weekly Schedule": { main: [[{ node: "Read Google Sheet", type: "main", index: 0 }]] },
      "Read Google Sheet": { main: [[{ node: "Send Email Report", type: "main", index: 0 }]] },
    },
  },

  // #4 — RSS Feed Digest to Slack (low target)
  {
    id: "mock-4",
    name: "RSS Feed Digest to Slack",
    active: true,
    updatedAt: daysAgo(2).toISOString(),
    createdAt: daysAgo(45).toISOString(),
    nodes: [
      {
        id: "n1",
        name: "Schedule",
        type: "n8n-nodes-base.scheduleTrigger",
        position: [250, 300],
        parameters: { rule: { interval: [{ field: "hours", hoursInterval: 6 }] } },
      },
      {
        id: "n2",
        name: "Read RSS Feed",
        type: "n8n-nodes-base.rssFeedRead",
        position: [450, 300],
        parameters: { url: "https://blog.company.com/rss" },
      },
      {
        id: "n3",
        name: "Post to Slack",
        type: "n8n-nodes-base.slack",
        position: [650, 300],
        parameters: { channel: "#news-digest", text: "New article: {{$json.title}} — {{$json.link}}" },
      },
    ],
    connections: {
      Schedule: { main: [[{ node: "Read RSS Feed", type: "main", index: 0 }]] },
      "Read RSS Feed": { main: [[{ node: "Post to Slack", type: "main", index: 0 }]] },
    },
  },

  // #5 — CRM Contact Export to Sheets (medium target)
  {
    id: "mock-5",
    name: "CRM Contact Export to Sheets",
    active: true,
    updatedAt: daysAgo(20).toISOString(),
    createdAt: daysAgo(150).toISOString(),
    nodes: [
      {
        id: "n1",
        name: "Daily Schedule",
        type: "n8n-nodes-base.scheduleTrigger",
        position: [250, 300],
        parameters: { rule: { interval: [{ field: "cronExpression", expression: "0 6 * * *" }] } },
      },
      {
        id: "n2",
        name: "Get HubSpot Contacts",
        type: "n8n-nodes-base.hubspot",
        position: [450, 300],
        parameters: { resource: "contact", operation: "getAll", limit: 500, filters: { lastModified: "last24h" } },
      },
      {
        id: "n3",
        name: "Map Fields",
        type: "n8n-nodes-base.set",
        position: [650, 300],
        parameters: { values: { string: [{ name: "name", value: "={{$json.firstname}} {{$json.lastname}}" }] } },
      },
      {
        id: "n4",
        name: "Append to Sheet",
        type: "n8n-nodes-base.googleSheets",
        position: [850, 300],
        parameters: { operation: "append", sheetId: "crm-export-sheet", range: "Contacts!A:F" },
      },
    ],
    connections: {
      "Daily Schedule": { main: [[{ node: "Get HubSpot Contacts", type: "main", index: 0 }]] },
      "Get HubSpot Contacts": { main: [[{ node: "Map Fields", type: "main", index: 0 }]] },
      "Map Fields": { main: [[{ node: "Append to Sheet", type: "main", index: 0 }]] },
    },
  },

  // #6 — Support Ticket Triage (medium target)
  {
    id: "mock-6",
    name: "Support Ticket Triage",
    active: true,
    updatedAt: daysAgo(5).toISOString(),
    createdAt: daysAgo(100).toISOString(),
    nodes: [
      {
        id: "n1",
        name: "Zendesk Trigger",
        type: "n8n-nodes-base.zendeskTrigger",
        position: [250, 300],
        parameters: { event: "ticket_created", conditions: { priority: "high" } },
      },
      {
        id: "n2",
        name: "Route by Category",
        type: "n8n-nodes-base.switch",
        position: [450, 300],
        parameters: { rules: [{ field: "category", value: "billing" }, { field: "category", value: "technical" }] },
      },
      {
        id: "n3",
        name: "Create Jira Issue",
        type: "n8n-nodes-base.jira",
        position: [650, 200],
        parameters: { project: "SUP", issueType: "Bug", summary: "{{$json.subject}}" },
      },
      {
        id: "n4",
        name: "Notify Support Slack",
        type: "n8n-nodes-base.slack",
        position: [650, 400],
        parameters: { channel: "#support-escalations", text: "High priority ticket: {{$json.subject}}" },
      },
    ],
    connections: {
      "Zendesk Trigger": { main: [[{ node: "Route by Category", type: "main", index: 0 }]] },
      "Route by Category": { main: [[{ node: "Create Jira Issue", type: "main", index: 0 }], [{ node: "Notify Support Slack", type: "main", index: 0 }]] },
    },
  },

  // #7 — Marketing Campaign Tracker (medium target)
  {
    id: "mock-7",
    name: "Marketing Campaign Tracker",
    active: true,
    updatedAt: daysAgo(25).toISOString(),
    createdAt: daysAgo(80).toISOString(),
    nodes: [
      {
        id: "n1",
        name: "Daily Schedule",
        type: "n8n-nodes-base.scheduleTrigger",
        position: [250, 300],
        parameters: { rule: { interval: [{ field: "cronExpression", expression: "0 7 * * *" }] } },
      },
      {
        id: "n2",
        name: "Get Campaign Stats",
        type: "n8n-nodes-base.hubspot",
        position: [450, 300],
        parameters: { resource: "campaign", operation: "getAll", filters: { status: "active" } },
      },
      {
        id: "n3",
        name: "Update Tracking Sheet",
        type: "n8n-nodes-base.googleSheets",
        position: [650, 300],
        parameters: { operation: "update", sheetId: "campaign-tracker", range: "Campaigns!A:H" },
      },
      {
        id: "n4",
        name: "Post Summary to Slack",
        type: "n8n-nodes-base.slack",
        position: [850, 300],
        parameters: { channel: "#marketing", text: "Daily campaign stats updated. Check the tracker sheet." },
      },
    ],
    connections: {
      "Daily Schedule": { main: [[{ node: "Get Campaign Stats", type: "main", index: 0 }]] },
      "Get Campaign Stats": { main: [[{ node: "Update Tracking Sheet", type: "main", index: 0 }]] },
      "Update Tracking Sheet": { main: [[{ node: "Post Summary to Slack", type: "main", index: 0 }]] },
    },
  },

  // #8 — Employee Onboarding Flow (high target)
  {
    id: "mock-8",
    name: "Employee Onboarding Flow",
    active: true,
    updatedAt: daysAgo(2).toISOString(),
    createdAt: daysAgo(200).toISOString(),
    nodes: [
      {
        id: "n1",
        name: "BambooHR Trigger",
        type: "n8n-nodes-base.webhook",
        position: [250, 300],
        parameters: { path: "/bamboohr-new-hire", httpMethod: "POST" },
      },
      {
        id: "n2",
        name: "Create Google Workspace Account",
        type: "n8n-nodes-base.googleAdmin",
        position: [450, 300],
        parameters: {
          operation: "createUser",
          email: "{{$json.firstName}}.{{$json.lastName}}@company.com",
          firstName: "{{$json.firstName}}",
          lastName: "{{$json.lastName}}",
          orgUnit: "/{{$json.department}}",
        },
      },
      {
        id: "n3",
        name: "Create Jira Account",
        type: "n8n-nodes-base.jira",
        position: [650, 200],
        parameters: { resource: "user", operation: "create", emailAddress: "{{$json.email}}" },
      },
      {
        id: "n4",
        name: "Add to Slack Channels",
        type: "n8n-nodes-base.slack",
        position: [650, 400],
        parameters: {
          operation: "invite",
          channel: ["#general", "#{{$json.department}}", "#onboarding"],
          userId: "{{$json.slackId}}",
        },
      },
      {
        id: "n5",
        name: "Send Welcome Message",
        type: "n8n-nodes-base.slack",
        position: [850, 300],
        parameters: {
          channel: "#onboarding",
          text: "Welcome {{$json.firstName}}! Your accounts have been provisioned. Check your email for login details.",
        },
      },
    ],
    connections: {
      "BambooHR Trigger": { main: [[{ node: "Create Google Workspace Account", type: "main", index: 0 }]] },
      "Create Google Workspace Account": { main: [[{ node: "Create Jira Account", type: "main", index: 0 }, { node: "Add to Slack Channels", type: "main", index: 0 }]] },
      "Create Jira Account": { main: [[{ node: "Send Welcome Message", type: "main", index: 0 }]] },
      "Add to Slack Channels": { main: [[{ node: "Send Welcome Message", type: "main", index: 0 }]] },
    },
  },

  // #9 — Lead Qualification & Routing (high target)
  {
    id: "mock-9",
    name: "Lead Qualification & Routing",
    active: true,
    updatedAt: daysAgo(30).toISOString(),
    createdAt: daysAgo(180).toISOString(),
    nodes: [
      {
        id: "n1",
        name: "HubSpot New Lead",
        type: "n8n-nodes-base.hubspotTrigger",
        position: [250, 300],
        parameters: { event: "contact.creation", filters: { lifecycleStage: "lead" } },
      },
      {
        id: "n2",
        name: "Score Lead",
        type: "n8n-nodes-base.code",
        position: [450, 300],
        parameters: {
          code: "const score = items[0].json.company_size > 100 ? 'hot' : items[0].json.company_size > 20 ? 'warm' : 'cold'; items[0].json.leadScore = score; return items;",
        },
      },
      {
        id: "n3",
        name: "Route by Score",
        type: "n8n-nodes-base.switch",
        position: [650, 300],
        parameters: { rules: [{ field: "leadScore", value: "hot" }, { field: "leadScore", value: "warm" }] },
      },
      {
        id: "n4",
        name: "Create Salesforce Opportunity",
        type: "n8n-nodes-base.salesforce",
        position: [850, 200],
        parameters: {
          resource: "opportunity",
          operation: "create",
          name: "{{$json.company}} — Inbound Lead",
          stage: "Qualification",
          amount: "{{$json.estimated_value}}",
        },
      },
      {
        id: "n5",
        name: "Notify Sales on Slack",
        type: "n8n-nodes-base.slack",
        position: [850, 400],
        parameters: {
          channel: "#sales-leads",
          text: "New {{$json.leadScore}} lead: {{$json.company}} ({{$json.email}}). Score: {{$json.leadScore}}",
        },
      },
    ],
    connections: {
      "HubSpot New Lead": { main: [[{ node: "Score Lead", type: "main", index: 0 }]] },
      "Score Lead": { main: [[{ node: "Route by Score", type: "main", index: 0 }]] },
      "Route by Score": { main: [[{ node: "Create Salesforce Opportunity", type: "main", index: 0 }], [{ node: "Notify Sales on Slack", type: "main", index: 0 }]] },
    },
  },

  // #10 — Customer Churn Detection (high target)
  {
    id: "mock-10",
    name: "Customer Churn Detection",
    active: true,
    updatedAt: daysAgo(60).toISOString(),
    createdAt: daysAgo(250).toISOString(),
    nodes: [
      {
        id: "n1",
        name: "Daily Check",
        type: "n8n-nodes-base.scheduleTrigger",
        position: [250, 300],
        parameters: { rule: { interval: [{ field: "cronExpression", expression: "0 6 * * *" }] } },
      },
      {
        id: "n2",
        name: "Get At-Risk Accounts",
        type: "n8n-nodes-base.salesforce",
        position: [450, 300],
        parameters: {
          resource: "account",
          operation: "getAll",
          filters: { healthScore: { lt: 40 }, subscriptionStatus: "active" },
        },
      },
      {
        id: "n3",
        name: "Update HubSpot Status",
        type: "n8n-nodes-base.hubspot",
        position: [650, 200],
        parameters: { resource: "contact", operation: "update", property: "churn_risk", value: "high" },
      },
      {
        id: "n4",
        name: "Alert CSM on Slack",
        type: "n8n-nodes-base.slack",
        position: [650, 400],
        parameters: {
          channel: "#customer-success",
          text: "CHURN ALERT: {{$json.name}} (ARR: ${{$json.annual_revenue}}) health score dropped to {{$json.healthScore}}",
        },
      },
      {
        id: "n5",
        name: "Send Retention Email",
        type: "n8n-nodes-base.gmail",
        position: [850, 300],
        parameters: {
          to: "{{$json.csm_email}}",
          subject: "Action Required: {{$json.name}} at risk of churn",
          body: "Account {{$json.name}} has a health score of {{$json.healthScore}}. Please review and schedule a check-in.",
        },
      },
    ],
    connections: {
      "Daily Check": { main: [[{ node: "Get At-Risk Accounts", type: "main", index: 0 }]] },
      "Get At-Risk Accounts": { main: [[{ node: "Update HubSpot Status", type: "main", index: 0 }, { node: "Alert CSM on Slack", type: "main", index: 0 }]] },
      "Alert CSM on Slack": { main: [[{ node: "Send Retention Email", type: "main", index: 0 }]] },
    },
  },

  // #11 — Multi-Channel Lead Sync (inactive, high target via signals)
  {
    id: "mock-11",
    name: "Multi-Channel Lead Sync",
    active: false,
    updatedAt: daysAgo(40).toISOString(),
    createdAt: daysAgo(300).toISOString(),
    nodes: [
      {
        id: "n1",
        name: "Hourly Sync",
        type: "n8n-nodes-base.scheduleTrigger",
        position: [250, 300],
        parameters: { rule: { interval: [{ field: "hours", hoursInterval: 1 }] } },
      },
      {
        id: "n2",
        name: "Get Salesforce Leads",
        type: "n8n-nodes-base.salesforce",
        position: [450, 200],
        parameters: { resource: "lead", operation: "getAll", limit: 200 },
      },
      {
        id: "n3",
        name: "Get HubSpot Leads",
        type: "n8n-nodes-base.hubspot",
        position: [450, 400],
        parameters: { resource: "contact", operation: "getAll", filters: { lifecycleStage: "lead" } },
      },
      {
        id: "n4",
        name: "Merge & Deduplicate",
        type: "n8n-nodes-base.merge",
        position: [650, 300],
        parameters: { mode: "combine", mergeByFields: { values: [{ field1: "email", field2: "email" }] } },
      },
      {
        id: "n5",
        name: "Push to Marketo",
        type: "n8n-nodes-base.marketo",
        position: [850, 300],
        parameters: { resource: "lead", operation: "upsert", lookupField: "email" },
      },
    ],
    connections: {
      "Hourly Sync": { main: [[{ node: "Get Salesforce Leads", type: "main", index: 0 }, { node: "Get HubSpot Leads", type: "main", index: 0 }]] },
      "Get Salesforce Leads": { main: [[{ node: "Merge & Deduplicate", type: "main", index: 0 }]] },
      "Get HubSpot Leads": { main: [[{ node: "Merge & Deduplicate", type: "main", index: 0 }]] },
      "Merge & Deduplicate": { main: [[{ node: "Push to Marketo", type: "main", index: 0 }]] },
    },
  },

  // #12 — Stripe Payment → CRM Update (critical target)
  {
    id: "mock-12",
    name: "Stripe Payment → CRM Update",
    active: true,
    updatedAt: daysAgo(5).toISOString(),
    createdAt: daysAgo(365).toISOString(),
    nodes: [
      {
        id: "n1",
        name: "Stripe Webhook",
        type: "n8n-nodes-base.webhook",
        position: [250, 300],
        parameters: { path: "/stripe-payment", httpMethod: "POST" },
      },
      {
        id: "n2",
        name: "Validate Payment Event",
        type: "n8n-nodes-base.if",
        position: [450, 300],
        parameters: {
          conditions: { string: [{ value1: "={{$json.type}}", value2: "payment_intent.succeeded" }] },
        },
      },
      {
        id: "n3",
        name: "Update HubSpot Deal",
        type: "n8n-nodes-base.hubspot",
        position: [650, 200],
        parameters: {
          resource: "deal",
          operation: "update",
          dealId: "={{$json.metadata.hubspot_deal_id}}",
          properties: { amount: "={{$json.amount / 100}}", dealstage: "closedwon" },
        },
      },
      {
        id: "n4",
        name: "Notify Revenue Slack",
        type: "n8n-nodes-base.slack",
        position: [650, 400],
        parameters: {
          channel: "#revenue",
          text: "Payment received: ${{$json.amount / 100}} from {{$json.customer_email}} for deal {{$json.metadata.hubspot_deal_id}}",
        },
      },
      {
        id: "n5",
        name: "Send Receipt Email",
        type: "n8n-nodes-base.gmail",
        position: [850, 300],
        parameters: {
          to: "{{$json.customer_email}}",
          subject: "Payment Confirmation — ${{$json.amount / 100}}",
          body: "Thank you for your payment. Your transaction has been recorded.",
        },
      },
    ],
    connections: {
      "Stripe Webhook": { main: [[{ node: "Validate Payment Event", type: "main", index: 0 }]] },
      "Validate Payment Event": { main: [[{ node: "Update HubSpot Deal", type: "main", index: 0 }, { node: "Notify Revenue Slack", type: "main", index: 0 }]] },
      "Notify Revenue Slack": { main: [[{ node: "Send Receipt Email", type: "main", index: 0 }]] },
    },
  },

  // #13 — Invoice Generation & Delivery (critical target, inactive)
  {
    id: "mock-13",
    name: "Invoice Generation & Delivery",
    active: false,
    updatedAt: daysAgo(3).toISOString(),
    createdAt: daysAgo(200).toISOString(),
    nodes: [
      {
        id: "n1",
        name: "Stripe Invoice Webhook",
        type: "n8n-nodes-base.webhook",
        position: [250, 300],
        parameters: { path: "/stripe-invoice-finalized", httpMethod: "POST" },
      },
      {
        id: "n2",
        name: "Create QuickBooks Invoice",
        type: "n8n-nodes-base.quickbooks",
        position: [450, 300],
        parameters: {
          resource: "invoice",
          operation: "create",
          customerRef: "={{$json.customer}}",
          lineItems: "={{$json.lines.data}}",
          totalAmount: "={{$json.total / 100}}",
        },
      },
      {
        id: "n3",
        name: "Generate PDF",
        type: "n8n-nodes-base.httpRequest",
        position: [650, 300],
        parameters: { url: "={{$json.invoice_pdf}}", responseFormat: "file" },
      },
      {
        id: "n4",
        name: "Send Invoice Email",
        type: "n8n-nodes-base.gmail",
        position: [850, 300],
        parameters: {
          to: "{{$json.customer_email}}",
          subject: "Invoice #{{$json.number}} — ${{$json.total / 100}}",
          body: "Please find your invoice attached.",
          attachments: "={{$binary.data}}",
        },
      },
    ],
    connections: {
      "Stripe Invoice Webhook": { main: [[{ node: "Create QuickBooks Invoice", type: "main", index: 0 }]] },
      "Create QuickBooks Invoice": { main: [[{ node: "Generate PDF", type: "main", index: 0 }]] },
      "Generate PDF": { main: [[{ node: "Send Invoice Email", type: "main", index: 0 }]] },
    },
  },

  // #14 — Subscription Lifecycle Manager (critical target)
  {
    id: "mock-14",
    name: "Subscription Lifecycle Manager",
    active: true,
    updatedAt: daysAgo(1).toISOString(),
    createdAt: daysAgo(400).toISOString(),
    nodes: [
      {
        id: "n1",
        name: "Stripe Subscription Event",
        type: "n8n-nodes-base.webhook",
        position: [250, 300],
        parameters: { path: "/stripe-subscription", httpMethod: "POST" },
      },
      {
        id: "n2",
        name: "Route by Event Type",
        type: "n8n-nodes-base.switch",
        position: [450, 300],
        parameters: {
          rules: [
            { field: "type", value: "customer.subscription.created" },
            { field: "type", value: "customer.subscription.updated" },
            { field: "type", value: "customer.subscription.deleted" },
          ],
        },
      },
      {
        id: "n3",
        name: "Update Salesforce Account",
        type: "n8n-nodes-base.salesforce",
        position: [650, 200],
        parameters: {
          resource: "account",
          operation: "update",
          fields: { subscription_status: "={{$json.status}}", mrr: "={{$json.plan.amount / 100}}" },
        },
      },
      {
        id: "n4",
        name: "Notify on Slack",
        type: "n8n-nodes-base.slack",
        position: [650, 400],
        parameters: {
          channel: "#subscriptions",
          text: "Subscription {{$json.type}}: {{$json.customer_email}} — ${{$json.plan.amount / 100}}/mo",
        },
      },
      {
        id: "n5",
        name: "Update Intercom Tags",
        type: "n8n-nodes-base.intercom",
        position: [850, 200],
        parameters: {
          resource: "user",
          operation: "update",
          email: "={{$json.customer_email}}",
          customAttributes: { plan: "={{$json.plan.nickname}}", status: "={{$json.status}}" },
        },
      },
    ],
    connections: {
      "Stripe Subscription Event": { main: [[{ node: "Route by Event Type", type: "main", index: 0 }]] },
      "Route by Event Type": {
        main: [
          [{ node: "Update Salesforce Account", type: "main", index: 0 }],
          [{ node: "Notify on Slack", type: "main", index: 0 }],
          [{ node: "Update Salesforce Account", type: "main", index: 0 }, { node: "Notify on Slack", type: "main", index: 0 }],
        ],
      },
      "Update Salesforce Account": { main: [[{ node: "Update Intercom Tags", type: "main", index: 0 }]] },
    },
  },

  // #15 — Revenue Reconciliation Pipeline (critical target)
  {
    id: "mock-15",
    name: "Revenue Reconciliation Pipeline",
    active: true,
    updatedAt: daysAgo(20).toISOString(),
    createdAt: daysAgo(350).toISOString(),
    nodes: [
      {
        id: "n1",
        name: "Daily Reconciliation",
        type: "n8n-nodes-base.scheduleTrigger",
        position: [250, 300],
        parameters: { rule: { interval: [{ field: "cronExpression", expression: "0 2 * * *" }] } },
      },
      {
        id: "n2",
        name: "Fetch Stripe Transactions",
        type: "n8n-nodes-base.stripe",
        position: [450, 300],
        parameters: { resource: "balanceTransaction", operation: "getAll", created: { gte: "={{$now.minus(1, 'day').toISO()}}" } },
      },
      {
        id: "n3",
        name: "Fetch QuickBooks Entries",
        type: "n8n-nodes-base.quickbooks",
        position: [450, 500],
        parameters: { resource: "journalEntry", operation: "getAll", dateRange: "yesterday" },
      },
      {
        id: "n4",
        name: "Reconcile Amounts",
        type: "n8n-nodes-base.code",
        position: [650, 400],
        parameters: {
          code: "const stripeTotal = items.filter(i => i.json.source === 'stripe').reduce((sum, i) => sum + i.json.amount, 0); const qbTotal = items.filter(i => i.json.source === 'quickbooks').reduce((sum, i) => sum + i.json.amount, 0); const discrepancy = Math.abs(stripeTotal - qbTotal); return [{ json: { stripeTotal, qbTotal, discrepancy, matched: discrepancy < 100 } }];",
        },
      },
      {
        id: "n5",
        name: "Update Salesforce Revenue",
        type: "n8n-nodes-base.salesforce",
        position: [850, 300],
        parameters: {
          resource: "customObject",
          operation: "upsert",
          objectName: "Revenue_Reconciliation__c",
          fields: { date: "={{$now.format('YYYY-MM-DD')}}", stripe_total: "={{$json.stripeTotal}}", qb_total: "={{$json.qbTotal}}" },
        },
      },
      {
        id: "n6",
        name: "Alert if Discrepancy",
        type: "n8n-nodes-base.slack",
        position: [850, 500],
        parameters: {
          channel: "#finance-alerts",
          text: "Revenue reconciliation: Stripe=${{$json.stripeTotal}}, QuickBooks=${{$json.qbTotal}}, Discrepancy=${{$json.discrepancy}}",
        },
      },
    ],
    connections: {
      "Daily Reconciliation": { main: [[{ node: "Fetch Stripe Transactions", type: "main", index: 0 }, { node: "Fetch QuickBooks Entries", type: "main", index: 0 }]] },
      "Fetch Stripe Transactions": { main: [[{ node: "Reconcile Amounts", type: "main", index: 0 }]] },
      "Fetch QuickBooks Entries": { main: [[{ node: "Reconcile Amounts", type: "main", index: 0 }]] },
      "Reconcile Amounts": { main: [[{ node: "Update Salesforce Revenue", type: "main", index: 0 }, { node: "Alert if Discrepancy", type: "main", index: 0 }]] },
    },
  },

  // R1 — Old Abandoned Notification (removed)
  {
    id: "mock-r1",
    name: "Old Abandoned Notification",
    active: true,
    updatedAt: daysAgo(180).toISOString(),
    createdAt: daysAgo(400).toISOString(),
    nodes: [
      {
        id: "n1",
        name: "Schedule",
        type: "n8n-nodes-base.scheduleTrigger",
        position: [250, 300],
        parameters: { rule: { interval: [{ field: "hours", hoursInterval: 12 }] } },
      },
      {
        id: "n2",
        name: "Post to Slack",
        type: "n8n-nodes-base.slack",
        position: [450, 300],
        parameters: { channel: "#old-alerts", text: "Reminder: check old system" },
      },
    ],
    connections: { Schedule: { main: [[{ node: "Post to Slack", type: "main", index: 0 }]] } },
  },

  // R2 — Deprecated Data Export (removed)
  {
    id: "mock-r2",
    name: "Deprecated Data Export",
    active: true,
    updatedAt: daysAgo(200).toISOString(),
    createdAt: daysAgo(500).toISOString(),
    nodes: [
      {
        id: "n1",
        name: "Weekly Schedule",
        type: "n8n-nodes-base.scheduleTrigger",
        position: [250, 300],
        parameters: { rule: { interval: [{ field: "cronExpression", expression: "0 0 * * 0" }] } },
      },
      {
        id: "n2",
        name: "Export to Sheets",
        type: "n8n-nodes-base.googleSheets",
        position: [450, 300],
        parameters: { operation: "append", sheetId: "deprecated-export", range: "Data!A:D" },
      },
    ],
    connections: { "Weekly Schedule": { main: [[{ node: "Export to Sheets", type: "main", index: 0 }]] } },
  },

  // U1 — Unprocessed Webhook Handler
  {
    id: "mock-u1",
    name: "Unprocessed Webhook Handler",
    active: true,
    updatedAt: daysAgo(1).toISOString(),
    createdAt: daysAgo(10).toISOString(),
    nodes: [
      {
        id: "n1",
        name: "Webhook",
        type: "n8n-nodes-base.webhook",
        position: [250, 300],
        parameters: { path: "/incoming-hook", httpMethod: "POST" },
      },
      {
        id: "n2",
        name: "Create Jira Task",
        type: "n8n-nodes-base.jira",
        position: [450, 300],
        parameters: { project: "OPS", issueType: "Task", summary: "Webhook event: {{$json.event}}" },
      },
      {
        id: "n3",
        name: "Notify Ops",
        type: "n8n-nodes-base.slack",
        position: [650, 300],
        parameters: { channel: "#ops", text: "New webhook event processed → Jira {{$json.key}}" },
      },
    ],
    connections: {
      Webhook: { main: [[{ node: "Create Jira Task", type: "main", index: 0 }]] },
      "Create Jira Task": { main: [[{ node: "Notify Ops", type: "main", index: 0 }]] },
    },
  },

  // U2 — Unprocessed Scheduled Job
  {
    id: "mock-u2",
    name: "Unprocessed Scheduled Job",
    active: true,
    updatedAt: daysAgo(1).toISOString(),
    createdAt: daysAgo(5).toISOString(),
    nodes: [
      {
        id: "n1",
        name: "Nightly Schedule",
        type: "n8n-nodes-base.scheduleTrigger",
        position: [250, 300],
        parameters: { rule: { interval: [{ field: "cronExpression", expression: "0 23 * * *" }] } },
      },
      {
        id: "n2",
        name: "Send Nightly Digest",
        type: "n8n-nodes-base.gmail",
        position: [450, 300],
        parameters: {
          to: "ops@company.com",
          subject: "Nightly Operations Digest",
          body: "Summary of today's operations...",
        },
      },
    ],
    connections: { "Nightly Schedule": { main: [[{ node: "Send Nightly Digest", type: "main", index: 0 }]] } },
  },
];

// ── Governance Field Matrix ─────────────────────────────

interface GovernanceFields {
  owner: string | null;
  status: "active" | "inactive" | "removed";
  statusOverride: "active" | "inactive" | "deprecated" | null;
  lastReviewDate: Date | null;
  automationLastUpdated: Date | null;
  documentationLastUpdated: Date | null;
  reviewCadenceDays: number;
  impactOverride?: "critical" | "high" | "medium" | "low";
}

const GOVERNANCE_MATRIX: Record<string, GovernanceFields> = {
  // LOW risk (0 signals)
  "mock-1": {
    owner: "Alice Chen",
    status: "active",
    statusOverride: null,
    lastReviewDate: daysAgo(5),
    automationLastUpdated: daysAgo(2),
    documentationLastUpdated: daysAgo(1),
    reviewCadenceDays: 30,
  },
  "mock-2": {
    owner: "Bob Martinez",
    status: "active",
    statusOverride: null,
    lastReviewDate: daysAgo(10),
    automationLastUpdated: daysAgo(3),
    documentationLastUpdated: daysAgo(2),
    reviewCadenceDays: 30,
  },
  "mock-12": {
    owner: "Alice Chen",
    status: "active",
    statusOverride: null,
    lastReviewDate: daysAgo(7),
    automationLastUpdated: daysAgo(5),
    documentationLastUpdated: daysAgo(4),
    reviewCadenceDays: 30,
  },
  "mock-14": {
    owner: "Carol Davis",
    status: "active",
    statusOverride: null,
    lastReviewDate: daysAgo(3),
    automationLastUpdated: daysAgo(1),
    documentationLastUpdated: daysAgo(1),
    reviewCadenceDays: 30,
  },

  // MEDIUM risk (1-2 signals)
  "mock-3": {
    owner: "Carol Davis",
    status: "active",
    statusOverride: null,
    lastReviewDate: null,
    automationLastUpdated: daysAgo(3),
    documentationLastUpdated: daysAgo(2),
    reviewCadenceDays: 30,
    impactOverride: "low",
  },
  "mock-5": {
    owner: "Bob Martinez",
    status: "active",
    statusOverride: null,
    lastReviewDate: daysAgo(45),
    automationLastUpdated: daysAgo(20),
    documentationLastUpdated: daysAgo(19),
    reviewCadenceDays: 30,
  },
  "mock-7": {
    owner: "Alice Chen",
    status: "active",
    statusOverride: null,
    lastReviewDate: daysAgo(5),
    automationLastUpdated: daysAgo(25),
    documentationLastUpdated: daysAgo(24),
    reviewCadenceDays: 30,
  },
  "mock-8": {
    owner: "Diana Patel",
    status: "active",
    statusOverride: null,
    lastReviewDate: daysAgo(10),
    automationLastUpdated: daysAgo(2),
    documentationLastUpdated: daysAgo(1),
    reviewCadenceDays: 7,
  },
  "mock-13": {
    owner: "Carol Davis",
    status: "inactive",
    statusOverride: null,
    lastReviewDate: daysAgo(5),
    automationLastUpdated: daysAgo(3),
    documentationLastUpdated: daysAgo(2),
    reviewCadenceDays: 30,
  },

  // HIGH risk (3+ signals or combo triggers)
  "mock-4": {
    owner: null,
    status: "active",
    statusOverride: null,
    lastReviewDate: daysAgo(5),
    automationLastUpdated: daysAgo(2),
    documentationLastUpdated: null,
    reviewCadenceDays: 30,
  },
  "mock-6": {
    owner: null,
    status: "active",
    statusOverride: null,
    lastReviewDate: daysAgo(10),
    automationLastUpdated: daysAgo(5),
    documentationLastUpdated: null,
    reviewCadenceDays: 30,
  },
  "mock-9": {
    owner: null,
    status: "active",
    statusOverride: null,
    lastReviewDate: null,
    automationLastUpdated: daysAgo(30),
    documentationLastUpdated: null,
    reviewCadenceDays: 30,
    impactOverride: "critical",
  },
  "mock-10": {
    owner: "Bob Martinez",
    status: "active",
    statusOverride: "deprecated",
    lastReviewDate: null,
    automationLastUpdated: daysAgo(45),
    documentationLastUpdated: daysAgo(60),
    reviewCadenceDays: 30,
  },
  "mock-11": {
    owner: null,
    status: "inactive",
    statusOverride: null,
    lastReviewDate: null,
    automationLastUpdated: daysAgo(40),
    documentationLastUpdated: null,
    reviewCadenceDays: 30,
  },
  "mock-15": {
    owner: "Diana Patel",
    status: "active",
    statusOverride: "inactive",
    lastReviewDate: daysAgo(50),
    automationLastUpdated: daysAgo(20),
    documentationLastUpdated: null,
    reviewCadenceDays: 30,
  },

  // Removed
  "mock-r1": {
    owner: null,
    status: "removed",
    statusOverride: null,
    lastReviewDate: null,
    automationLastUpdated: daysAgo(180),
    documentationLastUpdated: null,
    reviewCadenceDays: 30,
  },
  "mock-r2": {
    owner: null,
    status: "removed",
    statusOverride: null,
    lastReviewDate: null,
    automationLastUpdated: daysAgo(200),
    documentationLastUpdated: null,
    reviewCadenceDays: 30,
  },

  // Unprocessed
  "mock-u1": {
    owner: null,
    status: "active",
    statusOverride: null,
    lastReviewDate: null,
    automationLastUpdated: daysAgo(1),
    documentationLastUpdated: null,
    reviewCadenceDays: 30,
  },
  "mock-u2": {
    owner: "Alice Chen",
    status: "active",
    statusOverride: null,
    lastReviewDate: daysAgo(5),
    automationLastUpdated: daysAgo(1),
    documentationLastUpdated: null,
    reviewCadenceDays: 30,
  },
};

// ── Phase 1: Mock Workspace ─────────────────────────────

async function seedMockWorkspace(hasLlmKey: boolean) {
  console.log("\n=== Phase 1: Seed Mock Workspace ===\n");

  // Step 1: Cleanup
  await cleanupWorkspace(MOCK_EMAIL);

  // Step 2: Create workspace + user
  const passwordHash = await bcrypt.hash(PASSWORD, SALT_ROUNDS);
  const { workspace, user } = await prisma.$transaction(async (tx) => {
    const ws = await tx.workspace.create({
      data: { name: "Seed — Mock Workspace" },
    });
    const u = await tx.user.create({
      data: {
        email: MOCK_EMAIL,
        passwordHash,
        workspaceId: ws.id,
      },
    });
    return { workspace: ws, user: u };
  });
  console.log(`  Created workspace: ${workspace.id}`);
  console.log(`  Created user: ${user.email}`);

  // Step 3: Create connector config
  await prisma.connectorConfig.create({
    data: {
      workspaceId: workspace.id,
      platform: "n8n",
      instanceUrl: "https://n8n-mock.example.com",
      apiKeyEncrypted: encrypt("mock-api-key"),
      lastSyncAt: daysAgo(0.08), // ~2 hours ago
    },
  });
  console.log("  Created mock connector config");

  // Step 4: Insert automations (15 non-removed + 2 removed, skip U1/U2 for now)
  const nonUnprocessedIds = MOCK_WORKFLOWS
    .filter((w) => !w.id.startsWith("mock-u"))
    .map((w) => w.id);

  const createdAutomations: Array<{ id: string; externalId: string }> = [];

  for (const wfId of nonUnprocessedIds) {
    const workflow = MOCK_WORKFLOWS.find((w) => w.id === wfId)!;
    const gov = GOVERNANCE_MATRIX[wfId]!;

    const automation = await prisma.automation.create({
      data: {
        workspaceId: workspace.id,
        externalId: wfId,
        platform: "n8n",
        rawWorkflowJson: workflow as unknown as Prisma.InputJsonValue,
        status: gov.status,
        statusOverride: gov.statusOverride,
        owner: gov.owner,
        lastReviewDate: gov.lastReviewDate,
        automationLastUpdated: gov.automationLastUpdated,
        documentationLastUpdated: gov.documentationLastUpdated,
        reviewCadenceDays: gov.reviewCadenceDays,
        impactOverride: gov.impactOverride ?? null,
      },
    });
    createdAutomations.push({ id: automation.id, externalId: wfId });
  }
  console.log(`  Inserted ${createdAutomations.length} automations (15 non-removed + 2 removed)`);

  // Step 5: Run LLM pipeline on non-removed automations
  const nonRemoved = createdAutomations.filter(
    (a) => !a.externalId.startsWith("mock-r"),
  );
  let llmProcessed = 0;
  let llmFailed = 0;

  if (hasLlmKey) {
    console.log(`\n  Running LLM pipeline on ${nonRemoved.length} automations...`);
    for (const auto of nonRemoved) {
      try {
        const result = await processAutomation(auto.id, workspace.id);
        llmProcessed++;
        console.log(`    [${llmProcessed}/${nonRemoved.length}] ${auto.externalId}: impact=${result.impactProposal.level}`);
      } catch (err) {
        llmFailed++;
        console.error(
          `    FAIL ${auto.externalId}: ${err instanceof Error ? err.message : String(err)}`,
        );
      }
    }
    console.log(`  LLM complete: ${llmProcessed} processed, ${llmFailed} failed`);

    // Step 6: Safety net — ensure all 4 impact levels are represented
    const processed = await prisma.automation.findMany({
      where: {
        workspaceId: workspace.id,
        status: { not: "removed" },
        impactProposal: { not: null },
      },
    });

    const impactCounts: Record<string, number> = { low: 0, medium: 0, high: 0, critical: 0 };
    for (const auto of processed) {
      if (auto.impactProposal) {
        impactCounts[auto.impactProposal] = (impactCounts[auto.impactProposal] || 0) + 1;
      }
    }

    console.log(`\n  Impact distribution: ${JSON.stringify(impactCounts)}`);

    // Fallback overrides for missing levels
    const fallbackMap: Record<string, string> = {
      low: "mock-1",
      medium: "mock-7",
      high: "mock-8",
      critical: "mock-12",
    };

    for (const [level, count] of Object.entries(impactCounts)) {
      if (count === 0) {
        const targetExternalId = fallbackMap[level];
        const target = createdAutomations.find((a) => a.externalId === targetExternalId);
        if (target) {
          await prisma.automation.update({
            where: { id: target.id },
            data: { impactOverride: level as "low" | "medium" | "high" | "critical" },
          });
          console.log(`  Safety net: set impactOverride=${level} on ${targetExternalId}`);
        }
      }
    }
    // Step 6b: Re-apply governance fields overwritten by LLM pipeline
    // processAutomation() sets documentationLastUpdated=new Date(), which breaks
    // governance signals for automations where we need it null or stale.
    console.log("\n  Re-applying governance fields overwritten by LLM...");
    for (const auto of createdAutomations) {
      const gov = GOVERNANCE_MATRIX[auto.externalId]!;
      await prisma.automation.update({
        where: { id: auto.id },
        data: {
          documentationLastUpdated: gov.documentationLastUpdated,
        },
      });
    }
    console.log("  Governance fields restored");
  } else {
    console.log("  Skipping LLM pipeline — no OPENROUTER_API_KEY");
  }

  // Step 7: Insert unprocessed automations (U1, U2) — no LLM fields
  for (const uId of ["mock-u1", "mock-u2"]) {
    const workflow = MOCK_WORKFLOWS.find((w) => w.id === uId)!;
    const gov = GOVERNANCE_MATRIX[uId]!;

    await prisma.automation.create({
      data: {
        workspaceId: workspace.id,
        externalId: uId,
        platform: "n8n",
        rawWorkflowJson: workflow as unknown as Prisma.InputJsonValue,
        status: gov.status,
        statusOverride: gov.statusOverride,
        owner: gov.owner,
        lastReviewDate: gov.lastReviewDate,
        automationLastUpdated: gov.automationLastUpdated,
        documentationLastUpdated: gov.documentationLastUpdated,
        reviewCadenceDays: gov.reviewCadenceDays,
      },
    });
  }
  console.log("  Inserted 2 unprocessed automations (U1, U2)");

  return {
    workspaceId: workspace.id,
    totalAutomations: createdAutomations.length + 2,
    llmProcessed,
    llmFailed,
  };
}

// ── Phase 2: Real Workspace ─────────────────────────────

async function seedRealWorkspace(hasLlmKey: boolean) {
  console.log("\n=== Phase 2: Seed Real Workspace ===\n");

  const instanceUrl = process.env.N8N_INSTANCE_URL!;
  const apiKey = process.env.N8N_API_KEY!;

  // Step 1: Cleanup
  await cleanupWorkspace(REAL_EMAIL);

  // Step 2: Create workspace + user
  const passwordHash = await bcrypt.hash(PASSWORD, SALT_ROUNDS);
  const { workspace, user } = await prisma.$transaction(async (tx) => {
    const ws = await tx.workspace.create({
      data: { name: "Seed — Real Workspace" },
    });
    const u = await tx.user.create({
      data: {
        email: REAL_EMAIL,
        passwordHash,
        workspaceId: ws.id,
      },
    });
    return { workspace: ws, user: u };
  });
  console.log(`  Created workspace: ${workspace.id}`);
  console.log(`  Created user: ${user.email}`);

  // Step 3: Create connector config with real creds
  const config = await prisma.connectorConfig.create({
    data: {
      workspaceId: workspace.id,
      platform: "n8n",
      instanceUrl,
      apiKeyEncrypted: encrypt(apiKey),
    },
  });
  console.log("  Created real connector config");

  // Step 4: Sync from n8n
  const client = createN8nClient(instanceUrl, apiKey);
  const workflows = await client.listWorkflows();
  console.log(`  Found ${workflows.length} workflows in n8n`);

  const createdAutomations: Array<{ id: string; externalId: string }> = [];
  let syncErrors = 0;

  for (const workflow of workflows) {
    const externalId = String(workflow.id);
    try {
      const detail = await client.getWorkflow(externalId);
      const automation = await prisma.automation.create({
        data: {
          workspaceId: workspace.id,
          externalId,
          platform: "n8n",
          rawWorkflowJson: detail as unknown as Prisma.InputJsonValue,
          status: detail.active ? "active" : "inactive",
          automationLastUpdated: new Date(detail.updatedAt),
        },
      });
      createdAutomations.push({ id: automation.id, externalId });
      console.log(`    Synced: ${workflow.name} (${externalId})`);
    } catch (err) {
      syncErrors++;
      console.error(
        `    FAIL workflow ${externalId}: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  // Update lastSyncAt
  await prisma.connectorConfig.update({
    where: { id: config.id },
    data: { lastSyncAt: new Date() },
  });

  console.log(`  Sync complete: ${createdAutomations.length} created, ${syncErrors} errors`);

  // Step 5: Run LLM pipeline
  let llmProcessed = 0;
  let llmFailed = 0;

  if (hasLlmKey && createdAutomations.length > 0) {
    console.log(`\n  Running LLM pipeline on ${createdAutomations.length} automations...`);
    for (const auto of createdAutomations) {
      try {
        const result = await processAutomation(auto.id, workspace.id);
        llmProcessed++;
        console.log(`    [${llmProcessed}/${createdAutomations.length}] ${auto.externalId}: impact=${result.impactProposal.level}`);
      } catch (err) {
        llmFailed++;
        console.error(
          `    FAIL ${auto.externalId}: ${err instanceof Error ? err.message : String(err)}`,
        );
      }
    }
    console.log(`  LLM complete: ${llmProcessed} processed, ${llmFailed} failed`);
  } else if (!hasLlmKey) {
    console.log("  Skipping LLM pipeline — no OPENROUTER_API_KEY");
  }

  return {
    workspaceId: workspace.id,
    totalAutomations: createdAutomations.length,
    llmProcessed,
    llmFailed,
    syncErrors,
  };
}

// ── Phase 3: Print Summary ──────────────────────────────

async function printSummary(
  mockResult: Awaited<ReturnType<typeof seedMockWorkspace>>,
  realResult: Awaited<ReturnType<typeof seedRealWorkspace>> | null,
) {
  console.log("\n" + "=".repeat(60));
  console.log("  SEED COMPLETE — Summary");
  console.log("=".repeat(60));

  // Login credentials
  console.log("\n  Login Credentials:");
  console.log(`    Mock workspace: ${MOCK_EMAIL} / ${PASSWORD}`);
  if (realResult) {
    console.log(`    Real workspace: ${REAL_EMAIL} / ${PASSWORD}`);
  }

  // Mock workspace stats
  console.log(`\n  Mock Workspace (${mockResult.workspaceId}):`);
  console.log(`    Total automations: ${mockResult.totalAutomations}`);
  console.log(`    LLM processed: ${mockResult.llmProcessed}`);
  if (mockResult.llmFailed > 0) {
    console.log(`    LLM failed: ${mockResult.llmFailed}`);
  }

  // Impact/risk distribution for mock workspace
  const mockAutomations = await prisma.automation.findMany({
    where: { workspaceId: mockResult.workspaceId, status: { not: "removed" } },
  });

  const impactDist: Record<string, number> = { critical: 0, high: 0, medium: 0, low: 0, unset: 0 };
  const riskDist: Record<string, number> = { high: 0, medium: 0, low: 0 };

  for (const auto of mockAutomations) {
    const impact = getEffectiveImpact(auto);
    impactDist[impact ?? "unset"]++;
    const risk = getRiskLevel(auto);
    riskDist[risk]++;
  }

  console.log(`    Impact distribution: ${JSON.stringify(impactDist)}`);
  console.log(`    Risk distribution: ${JSON.stringify(riskDist)}`);

  // Governance signal counts
  const signalTotals: Record<string, number> = {
    noOwner: 0,
    docOutdated: 0,
    stale: 0,
    overdueReview: 0,
    inactive: 0,
  };
  for (const auto of mockAutomations) {
    const signals = getGovernanceSignals(auto);
    if (signals.noOwnerAssigned) signalTotals.noOwner++;
    if (signals.documentationOutdated) signalTotals.docOutdated++;
    if (signals.automationStale) signalTotals.stale++;
    if (signals.overdueReview) signalTotals.overdueReview++;
    if (signals.inactive) signalTotals.inactive++;
  }
  console.log(`    Signal counts: ${JSON.stringify(signalTotals)}`);

  // Real workspace stats
  if (realResult) {
    console.log(`\n  Real Workspace (${realResult.workspaceId}):`);
    console.log(`    Total automations: ${realResult.totalAutomations}`);
    console.log(`    Sync errors: ${realResult.syncErrors}`);
    console.log(`    LLM processed: ${realResult.llmProcessed}`);
    if (realResult.llmFailed > 0) {
      console.log(`    LLM failed: ${realResult.llmFailed}`);
    }
  }

  console.log("\n" + "=".repeat(60) + "\n");
}

// ── Main ────────────────────────────────────────────────

async function main() {
  console.log("Seed Test Data — Epic 05.5\n");

  // Phase 0: Environment check
  if (!process.env.DATABASE_URL) {
    console.error("FATAL: DATABASE_URL is not set");
    process.exit(1);
  }
  if (!process.env.ENCRYPTION_KEY) {
    console.error("FATAL: ENCRYPTION_KEY is not set");
    process.exit(1);
  }

  const hasLlmKey = Boolean(process.env.OPENROUTER_API_KEY);
  if (!hasLlmKey) {
    console.warn("WARNING: OPENROUTER_API_KEY not set — LLM pipeline will be skipped");
  }

  const hasN8nCreds = Boolean(process.env.N8N_INSTANCE_URL && process.env.N8N_API_KEY);
  if (!hasN8nCreds) {
    console.warn("WARNING: N8N_INSTANCE_URL or N8N_API_KEY not set — real workspace will be skipped");
  }

  // Phase 1: Mock workspace
  const mockResult = await seedMockWorkspace(hasLlmKey);

  // Phase 2: Real workspace (optional)
  let realResult: Awaited<ReturnType<typeof seedRealWorkspace>> | null = null;
  if (hasN8nCreds) {
    realResult = await seedRealWorkspace(hasLlmKey);
  } else {
    console.log("\n=== Phase 2: Skipped (no n8n credentials) ===");
  }

  // Phase 3: Summary
  await printSummary(mockResult, realResult);
}

main()
  .catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
