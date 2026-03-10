import { Suspense } from "react";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getRequiredSession } from "@/lib/session";
import {
  getRiskLevel,
  getEffectiveStatus,
  getEffectiveImpact,
  getGovernanceSignals,
} from "@/lib/risk-engine";
import { AutomationDetailView } from "@/components/automation-detail-view";
import type { AutomationDetail } from "@/lib/automation-detail-types";

export default async function AutomationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getRequiredSession();
  const workspaceId = session.user.workspaceId;

  const [automation, connectorConfig] = await Promise.all([
    prisma.automation.findFirst({
      where: { id, workspaceId },
    }),
    prisma.connectorConfig.findFirst({
      where: { workspaceId, platform: "n8n" },
    }),
  ]);

  if (!automation) {
    notFound();
  }

  const detail: AutomationDetail = {
    id: automation.id,
    name: automation.name,
    description: automation.description,
    platform: automation.platform,
    status: automation.status,
    statusOverride: automation.statusOverride,
    effectiveStatus: getEffectiveStatus(automation),
    owner: automation.owner,
    systemsTouched: automation.systemsTouched,
    trigger: automation.trigger,
    triggerType: automation.triggerType,
    coreLogic: automation.coreLogic,
    dataTypes: automation.dataTypes,
    sideEffects: automation.sideEffects,
    businessContext: automation.businessContext,
    impactProposal: automation.impactProposal,
    impactOverride: automation.impactOverride,
    effectiveImpact: getEffectiveImpact(automation),
    impactReasoning: automation.impactReasoning,
    riskLevel: getRiskLevel(automation),
    signals: getGovernanceSignals(automation),
    reviewCadenceDays: automation.reviewCadenceDays,
    lastReviewDate: automation.lastReviewDate?.toISOString() ?? null,
    automationLastUpdated:
      automation.automationLastUpdated?.toISOString() ?? null,
    documentationLastUpdated:
      automation.documentationLastUpdated?.toISOString() ?? null,
    externalId: automation.externalId,
    n8nWorkflowUrl: connectorConfig
      ? `${connectorConfig.instanceUrl}/workflow/${automation.externalId}`
      : null,
  };

  return (
    <Suspense fallback={<div className="p-6">Loading...</div>}>
      <AutomationDetailView automation={detail} />
    </Suspense>
  );
}
