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

  // TODO: Epic 10 — R2 detail view will populate richer fields from new schema
  const detail: AutomationDetail = {
    id: automation.id,
    name: automation.name,
    platform: automation.platform,
    status: automation.status,
    effectiveStatus: getEffectiveStatus(automation),
    effectiveImpact: getEffectiveImpact(automation),
    riskLevel: getRiskLevel(automation),
    signals: getGovernanceSignals(automation),
    automationLastUpdated:
      automation.automationLastUpdated?.toISOString() ?? null,
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
