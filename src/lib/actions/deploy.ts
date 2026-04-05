"use server";

import OpenAI from "openai";
import { prisma } from "@/lib/prisma";
import { getRequiredSession } from "@/lib/session";
import { decrypt } from "@/lib/encryption";
import { createN8nClient } from "@/lib/n8n-client";
import { stripJsonFences, retryWithBackoff } from "@/lib/llm-pipeline";
import { Prisma } from "@/generated/prisma/client";

// ── OpenRouter client (lazy-init) ───────────────────────

function getClient(): OpenAI {
  return new OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey: process.env.OPENROUTER_API_KEY,
  });
}

function getModel(): string {
  return process.env.OPENROUTER_MODEL || "anthropic/claude-sonnet-4";
}

// ── Generate deploy JSON ────────────────────────────────

export async function generateDeployJson(recommendationId: string) {
  const session = await getRequiredSession();
  const workspaceId = session.user.workspaceId;

  try {
    // 1. Fetch the recommendation
    const recommendation = await prisma.recommendation.findFirst({
      where: { id: recommendationId, workspaceId },
      include: {
        process: { select: { id: true, name: true } },
      },
    });

    if (!recommendation) {
      return { error: "Recommendation not found" };
    }

    // 2. If deployableJson already exists, return it (cache hit)
    if (recommendation.deployableJson) {
      return { success: true, json: recommendation.deployableJson };
    }

    // 3. Fetch related workflows in the same process
    let relatedWorkflows: Array<{ name: string | null; rawWorkflowJson: unknown }> = [];
    if (recommendation.processId) {
      relatedWorkflows = await prisma.automation.findMany({
        where: {
          workspaceId,
          processId: recommendation.processId,
          isRemoved: false,
        },
        select: { name: true, rawWorkflowJson: true },
        take: 5,
      });
    }

    // 4. Fetch connector config for system/credential info
    const connectorConfig = await prisma.connectorConfig.findFirst({
      where: { workspaceId, platform: "n8n" },
      select: { discoveryData: true },
    });

    const discoveryData = connectorConfig?.discoveryData as Record<string, unknown> | null;
    const credentials = Array.isArray(discoveryData?.credentials)
      ? (discoveryData.credentials as Array<{ name: string; type: string }>).map(
          (c) => ({ name: c.name, type: c.type }),
        )
      : [];

    // 5. Build the LLM prompt
    const systemPrompt =
      "You are an n8n workflow automation expert. Generate a valid n8n workflow JSON that implements the described automation. Output ONLY valid JSON — no markdown, no explanations.";

    const userMessage = JSON.stringify({
      recommendation: {
        name: recommendation.name,
        businessCase: recommendation.businessCase,
        implementationNotes: recommendation.implementationNotes,
        affectedScope: recommendation.affectedScope,
        systemSource: recommendation.systemSource,
        systemDestination: recommendation.systemDestination,
      },
      relatedWorkflows: relatedWorkflows.map((w) => ({
        name: w.name,
        workflow: w.rawWorkflowJson,
      })),
      availableCredentials: credentials,
    });

    // 6. Call OpenRouter with retry
    const client = getClient();
    const model = getModel();

    const raw = await retryWithBackoff(async () => {
      const response = await client.chat.completions.create(
        {
          model,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userMessage },
          ],
          response_format: { type: "json_object" },
        },
        { timeout: 120_000 },
      );
      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error("LLM returned empty response for deploy generation");
      }
      return content;
    }, 3);

    // 7. Strip JSON fences, validate as parseable JSON
    const cleaned = stripJsonFences(raw);
    let parsedJson: unknown;
    try {
      parsedJson = JSON.parse(cleaned);
    } catch {
      return { error: "Failed to parse generated workflow JSON" };
    }

    // 8. Store on Recommendation.deployableJson
    await prisma.recommendation.update({
      where: { id: recommendationId },
      data: {
        deployableJson: parsedJson as Prisma.InputJsonValue,
      },
    });

    // 9. Return success
    return { success: true, json: parsedJson };
  } catch (err) {
    return {
      error: `Deploy generation failed: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}

// ── Deploy to n8n ───────────────────────────────────────

export async function deployToN8n(recommendationId: string) {
  const session = await getRequiredSession();
  const workspaceId = session.user.workspaceId;

  try {
    // 1. Fetch recommendation.deployableJson
    const recommendation = await prisma.recommendation.findFirst({
      where: { id: recommendationId, workspaceId },
      select: { deployableJson: true },
    });

    if (!recommendation) {
      return { error: "Recommendation not found" };
    }

    // 2. If null, return error
    if (!recommendation.deployableJson) {
      return { error: "No generated workflow to deploy" };
    }

    // 3. Get connector config
    const config = await prisma.connectorConfig.findFirst({
      where: { workspaceId, platform: "n8n" },
    });

    if (!config) {
      return { error: "No n8n connector configured" };
    }

    const apiKey = decrypt(config.apiKeyEncrypted);
    const client = createN8nClient(config.instanceUrl, apiKey);

    // 5. Deploy workflow
    const workflow = await client.deployWorkflow(
      recommendation.deployableJson as object,
    );

    // 6. Activate workflow
    await client.activateWorkflow(workflow.id);

    // 7. Return success
    return {
      success: true,
      workflowId: workflow.id,
      instanceUrl: config.instanceUrl,
    };
  } catch (err) {
    return {
      error: `Deploy failed: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}
