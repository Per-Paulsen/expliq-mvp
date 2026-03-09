"use server";

import { prisma } from "@/lib/prisma";
import { getRequiredSession } from "@/lib/session";
import { encrypt, decrypt } from "@/lib/encryption";
import { createN8nClient, type N8nWorkflow } from "@/lib/n8n-client";
import type { Prisma } from "@/generated/prisma/client";

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
      data: { instanceUrl, apiKeyEncrypted },
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

export async function testConnection(formData: FormData) {
  await getRequiredSession();

  const instanceUrl = formData.get("instanceUrl") as string;
  const apiKey = formData.get("apiKey") as string;

  if (!instanceUrl || !apiKey) {
    return { error: "Instance URL and API key are required" };
  }

  const client = createN8nClient(instanceUrl, apiKey);
  const result = await client.testConnection();

  if (result.ok) {
    return { success: true };
  }

  return { error: result.error };
}

export async function syncWorkflows() {
  const session = await getRequiredSession();
  const workspaceId = session.user.workspaceId;

  const config = await prisma.connectorConfig.findFirst({
    where: { workspaceId, platform: "n8n" },
  });

  if (!config) {
    return { error: "No n8n connector configured. Please save your connection settings first." };
  }

  const apiKey = decrypt(config.apiKeyEncrypted);
  const client = createN8nClient(config.instanceUrl, apiKey);

  const workflows = await client.listWorkflows();

  let created = 0;
  let updated = 0;
  let unchanged = 0;
  let removed = 0;
  const errors: string[] = [];

  const fetchedExternalIds: string[] = [];

  for (const workflow of workflows) {
    const externalId = String(workflow.id);
    fetchedExternalIds.push(externalId);

    try {
      const detail = await client.getWorkflow(externalId);
      const status = detail.active ? "active" : "inactive";
      const automationLastUpdated = new Date(detail.updatedAt);

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
            rawWorkflowJson: detail as unknown as Prisma.InputJsonValue,
            status,
            automationLastUpdated,
          },
        });
        created++;
      } else if (automationLastUpdated > (existing.automationLastUpdated ?? new Date(0))) {
        await prisma.automation.update({
          where: { id: existing.id },
          data: {
            rawWorkflowJson: detail as unknown as Prisma.InputJsonValue,
            status,
            automationLastUpdated,
          },
        });
        updated++;
      } else {
        unchanged++;
      }
    } catch (err) {
      errors.push(`Workflow ${externalId}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  // Soft-remove automations no longer in n8n
  const toRemove = await prisma.automation.findMany({
    where: {
      workspaceId,
      platform: "n8n",
      status: { not: "removed" },
      externalId: { notIn: fetchedExternalIds },
    },
  });

  for (const automation of toRemove) {
    await prisma.automation.update({
      where: { id: automation.id },
      data: { status: "removed" },
    });
    removed++;
  }

  // Update lastSyncAt
  await prisma.connectorConfig.update({
    where: { id: config.id },
    data: { lastSyncAt: new Date() },
  });

  return {
    success: true,
    summary: { created, updated, unchanged, removed, errors },
  };
}
