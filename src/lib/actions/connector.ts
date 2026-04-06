"use server";

import { prisma } from "@/lib/prisma";
import { getRequiredSession } from "@/lib/session";
import { encrypt, decrypt } from "@/lib/encryption";
import { createN8nClient, type N8nWorkflow } from "@/lib/n8n-client";
import { computeExecutionStats } from "@/lib/execution-stats";
import { Prisma } from "@/generated/prisma/client";
import { runAnalysisPipeline } from "@/lib/actions/analysis";

// ── Types ──────────────────────────────────────────────

export interface TagPreview {
  id: string | null; // null for "Untagged"
  name: string;
  workflowCount: number;
  workflowNames: string[]; // first 5 names for preview
}

export interface SyncSummary {
  created: number;
  updated: number;
  unchanged: number;
  removed: number;
  errors: string[];
  enrichment: {
    credentials: boolean;
    users: boolean;
    projects: boolean;
    variables: boolean;
  };
}

// ── Helpers ────────────────────────────────────────────

const UNTAGGED_KEY = "__untagged__";

function groupWorkflowsByTag(
  workflows: N8nWorkflow[]
): TagPreview[] {
  const tagMap = new Map<
    string,
    { id: string | null; name: string; workflows: string[] }
  >();

  for (const workflow of workflows) {
    const tags =
      (workflow.tags as Array<{ id: string; name: string }>) ?? [];

    if (tags.length === 0) {
      const untagged = tagMap.get(UNTAGGED_KEY) ?? {
        id: null,
        name: "Untagged",
        workflows: [],
      };
      untagged.workflows.push(workflow.name);
      tagMap.set(UNTAGGED_KEY, untagged);
    } else {
      for (const tag of tags) {
        const existing = tagMap.get(tag.id) ?? {
          id: tag.id,
          name: tag.name,
          workflows: [],
        };
        existing.workflows.push(workflow.name);
        tagMap.set(tag.id, existing);
      }
    }
  }

  return Array.from(tagMap.values()).map((entry) => ({
    id: entry.id,
    name: entry.name,
    workflowCount: entry.workflows.length,
    workflowNames: entry.workflows.slice(0, 5),
  }));
}

/**
 * Given the selected tags (tag names + optionally "__untagged__") and the
 * connector config's selectedTags, determine which workflows to include.
 *
 * Returns the filtered workflow list.
 */
async function fetchFilteredWorkflows(
  client: ReturnType<typeof createN8nClient>,
  selectedTags: string[]
): Promise<N8nWorkflow[]> {
  const includeUntagged = selectedTags.includes(UNTAGGED_KEY);
  const tagNames = selectedTags.filter((t) => t !== UNTAGGED_KEY);

  // If no selection or nothing meaningful, fetch all
  if (selectedTags.length === 0) {
    return client.listWorkflows();
  }

  // If we need untagged workflows, we must fetch all and filter client-side
  if (includeUntagged) {
    const allWorkflows = await client.listWorkflows();
    const tagNameSet = new Set(tagNames);

    return allWorkflows.filter((wf) => {
      const wfTags =
        (wf.tags as Array<{ id: string; name: string }>) ?? [];
      if (wfTags.length === 0) return true; // untagged
      if (tagNameSet.size === 0) return false; // only want untagged
      return wfTags.some((t) => tagNameSet.has(t.name));
    });
  }

  // Only named tags — use server-side filter
  return client.listWorkflows(tagNames);
}

// ── Server Actions ─────────────────────────────────────

export async function saveConnectorConfig(formData: FormData) {
  const session = await getRequiredSession();
  const workspaceId = session.user.workspaceId;

  const instanceUrl = formData.get("instanceUrl") as string;
  const apiKey = formData.get("apiKey") as string;

  if (!instanceUrl || !apiKey) {
    return { error: "Instance URL and API key are required" };
  }

  const apiKeyEncrypted = encrypt(apiKey);

  const existing = await prisma.connectorConfig.findFirst({
    where: { workspaceId, platform: "n8n" },
  });

  if (existing) {
    await prisma.connectorConfig.update({
      where: { id: existing.id },
      data: {
        instanceUrl,
        apiKeyEncrypted,
        discoveryData: Prisma.DbNull,
        selectedTags: [],
      },
    });
  } else {
    await prisma.connectorConfig.create({
      data: {
        workspaceId,
        platform: "n8n",
        instanceUrl,
        apiKeyEncrypted,
      },
    });
  }

  return { success: true };
}

export async function verifyAndDiscover() {
  const session = await getRequiredSession();
  const workspaceId = session.user.workspaceId;

  const config = await prisma.connectorConfig.findFirst({
    where: { workspaceId, platform: "n8n" },
  });

  if (!config) {
    return {
      error:
        "No n8n connector configured. Please save your connection settings first.",
    };
  }

  const apiKey = decrypt(config.apiKeyEncrypted);
  const client = createN8nClient(config.instanceUrl, apiKey);

  // Verify connectivity + discover capabilities
  const discoveryData = await client.fetchDiscover();

  // Fetch tags (for reference, though grouping comes from workflows)
  await client.fetchTags();

  // Fetch all workflows (no tag filter — need full list for preview)
  const workflows = await client.listWorkflows();

  // Group workflows by tag
  const tags = groupWorkflowsByTag(workflows);

  // Persist discovery data including tag previews for page reload
  const persistedDiscovery = {
    raw: discoveryData,
    tags,
    totalWorkflows: workflows.length,
  };
  await prisma.connectorConfig.update({
    where: { id: config.id },
    data: {
      discoveryData: persistedDiscovery as unknown as Prisma.InputJsonValue,
    },
  });

  return {
    success: true,
    tags,
    totalWorkflows: workflows.length,
  };
}

export async function updateSelectedTags(tags: string[]) {
  const session = await getRequiredSession();
  const workspaceId = session.user.workspaceId;

  const config = await prisma.connectorConfig.findFirst({
    where: { workspaceId, platform: "n8n" },
  });

  if (!config) {
    return {
      error:
        "No n8n connector configured. Please save your connection settings first.",
    };
  }

  await prisma.connectorConfig.update({
    where: { id: config.id },
    data: { selectedTags: tags },
  });

  return { success: true };
}

export async function syncAndAnalyze() {
  const session = await getRequiredSession();
  const workspaceId = session.user.workspaceId;

  const config = await prisma.connectorConfig.findFirst({
    where: { workspaceId, platform: "n8n" },
  });

  if (!config) {
    return {
      error:
        "No n8n connector configured. Please save your connection settings first.",
    };
  }

  const apiKey = decrypt(config.apiKeyEncrypted);
  const client = createN8nClient(config.instanceUrl, apiKey);

  // Phase 2a: Fetch workflows filtered by selected tags
  const workflows = await fetchFilteredWorkflows(
    client,
    config.selectedTags
  );

  let created = 0;
  let updated = 0;
  let unchanged = 0;
  let removed = 0;
  const errors: string[] = [];

  const fetchedExternalIds: string[] = [];

  // Phase 2b: For each workflow, fetch full definition + execution history
  for (const workflow of workflows) {
    const externalId = String(workflow.id);
    fetchedExternalIds.push(externalId);

    try {
      const detail = await client.getWorkflow(externalId);
      const status = detail.active ? "active" : "inactive";
      const automationLastUpdated = new Date(detail.updatedAt);

      // Fetch execution history
      const executions = await client.fetchExecutions(externalId, 250);
      const stats = computeExecutionStats(executions);

      const existing = await prisma.automation.findUnique({
        where: {
          workspaceId_externalId: { workspaceId, externalId },
        },
      });

      if (!existing) {
        await prisma.automation.create({
          data: {
            workspaceId,
            externalId,
            platform: "n8n",
            name: detail.name,
            rawWorkflowJson: detail as unknown as Prisma.InputJsonValue,
            status,
            automationLastUpdated,
            isRemoved: false,
            analysisStatus: null,
            runsPerWeek: stats.runsPerWeek,
            errorRate: stats.errorRate,
            lastExecutedAt: stats.lastExecutedAt,
            avgDurationMs: stats.avgDurationMs,
          },
        });
        created++;
      } else if (
        automationLastUpdated >
        (existing.automationLastUpdated ?? new Date(0))
      ) {
        await prisma.automation.update({
          where: { id: existing.id },
          data: {
            rawWorkflowJson: detail as unknown as Prisma.InputJsonValue,
            name: detail.name,
            status,
            automationLastUpdated,
            isRemoved: false,
            analysisStatus: null,
            runsPerWeek: stats.runsPerWeek,
            errorRate: stats.errorRate,
            lastExecutedAt: stats.lastExecutedAt,
            avgDurationMs: stats.avgDurationMs,
          },
        });
        updated++;
      } else {
        // Even if workflow definition hasn't changed, update execution stats
        await prisma.automation.update({
          where: { id: existing.id },
          data: {
            isRemoved: false,
            runsPerWeek: stats.runsPerWeek,
            errorRate: stats.errorRate,
            lastExecutedAt: stats.lastExecutedAt,
            avgDurationMs: stats.avgDurationMs,
          },
        });
        unchanged++;
      }
    } catch (err) {
      errors.push(
        `Workflow ${externalId}: ${err instanceof Error ? err.message : String(err)}`
      );
    }
  }

  // Phase 2c: Flag removed workflows
  const toRemove = await prisma.automation.findMany({
    where: {
      workspaceId,
      platform: "n8n",
      isRemoved: false,
      externalId: { notIn: fetchedExternalIds },
    },
  });

  for (const automation of toRemove) {
    await prisma.automation.update({
      where: { id: automation.id },
      data: { isRemoved: true },
    });
    removed++;
  }

  // Phase 2d: Attempt enrichment endpoints (graceful 403)
  const [credentials, users, projects, variables] = await Promise.all([
    client.fetchCredentials(),
    client.fetchUsers(),
    client.fetchProjects(),
    client.fetchVariables(),
  ]);

  // Phase 2e: Update lastSyncAt
  await prisma.connectorConfig.update({
    where: { id: config.id },
    data: { lastSyncAt: new Date() },
  });

  const summary: SyncSummary = {
    created,
    updated,
    unchanged,
    removed,
    errors,
    enrichment: {
      credentials: credentials !== null,
      users: users !== null,
      projects: projects !== null,
      variables: variables !== null,
    },
  };

  // Phase 3: Fire-and-forget — analysis runs in background, client polls for progress
  runAnalysisPipeline(workspaceId).catch((err) => {
    console.error("Analysis pipeline failed:", err);
  });

  return { success: true, summary };
}

export async function getAnalysisStatus(): Promise<{ status: string | null }> {
  const session = await getRequiredSession();
  const profile = await prisma.companyProfile.findUnique({
    where: { workspaceId: session.user.workspaceId },
    select: { analysisStatus: true },
  });
  return { status: profile?.analysisStatus ?? null };
}
