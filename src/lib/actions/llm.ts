"use server";

import { prisma } from "@/lib/prisma";
import { getRequiredSession } from "@/lib/session";
import { processAutomation } from "@/lib/llm-pipeline";

export async function processUnprocessedAutomations() {
  const session = await getRequiredSession();
  const workspaceId = session.user.workspaceId;

  const automations = await prisma.automation.findMany({
    where: { workspaceId, status: { not: "removed" } },
    select: {
      id: true,
      automationLastUpdated: true,
      documentationLastUpdated: true,
    },
  });

  const toProcess = automations.filter(
    (a) =>
      !a.documentationLastUpdated ||
      (a.automationLastUpdated &&
        a.automationLastUpdated > a.documentationLastUpdated),
  );

  let processed = 0;
  const errors: string[] = [];

  const CONCURRENCY = 5;
  for (let i = 0; i < toProcess.length; i += CONCURRENCY) {
    const batch = toProcess.slice(i, i + CONCURRENCY);
    const results = await Promise.allSettled(
      batch.map((a) => processAutomation(a.id, workspaceId))
    );
    for (let j = 0; j < results.length; j++) {
      const result = results[j];
      if (result.status === "fulfilled") {
        processed++;
      } else {
        errors.push(
          `${batch[j].id}: ${result.reason instanceof Error ? result.reason.message : String(result.reason)}`,
        );
      }
    }
  }

  return {
    success: true,
    summary: { total: toProcess.length, processed, errors },
  };
}

export async function regenerateAutomation(automationId: string) {
  const session = await getRequiredSession();
  const workspaceId = session.user.workspaceId;

  const automation = await prisma.automation.findFirst({
    where: { id: automationId, workspaceId },
  });

  if (!automation) {
    return { error: "Automation not found" };
  }

  try {
    await processAutomation(automationId, workspaceId);
    return { success: true };
  } catch (err) {
    return { error: err instanceof Error ? err.message : String(err) };
  }
}
