"use server";

import { prisma } from "@/lib/prisma";
import { getRequiredSession } from "@/lib/session";
import { ImpactLevel, StatusOverride } from "@/generated/prisma/client";
import type { EditFormState } from "@/lib/automation-detail-types";

const VALID_IMPACT_LEVELS = new Set(Object.values(ImpactLevel));
const VALID_STATUS_OVERRIDES = new Set(Object.values(StatusOverride));

export async function saveAutomationEdits(
  automationId: string,
  data: EditFormState,
) {
  try {
    const session = await getRequiredSession();
    const workspaceId = session.user.workspaceId;

    const automation = await prisma.automation.findFirst({
      where: { id: automationId, workspaceId },
    });

    if (!automation) {
      return { error: "Automation not found" };
    }

    const updatePayload: Record<string, unknown> = {
      owner: data.owner.trim() || null,
      impactOverride: VALID_IMPACT_LEVELS.has(data.impactOverride as ImpactLevel)
        ? (data.impactOverride as ImpactLevel)
        : null,
      reviewCadenceDays: Math.max(1, Math.round(data.reviewCadenceDays)),
      statusOverride: VALID_STATUS_OVERRIDES.has(data.statusOverride as StatusOverride)
        ? (data.statusOverride as StatusOverride)
        : null,
    };

    await prisma.automation.update({
      where: { id: automationId },
      data: updatePayload,
    });

    return { success: true };
  } catch (err) {
    return { error: err instanceof Error ? err.message : String(err) };
  }
}

export async function markAsReviewed(automationId: string) {
  try {
    const session = await getRequiredSession();
    const workspaceId = session.user.workspaceId;

    const automation = await prisma.automation.findFirst({
      where: { id: automationId, workspaceId },
    });

    if (!automation) {
      return { error: "Automation not found" };
    }

    await prisma.automation.update({
      where: { id: automationId },
      data: { lastReviewDate: new Date() },
    });

    return { success: true };
  } catch (err) {
    return { error: err instanceof Error ? err.message : String(err) };
  }
}
