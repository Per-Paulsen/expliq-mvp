import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import { getRequiredSession } from "@/lib/session";
import {
  getRiskLevel,
  getEffectiveStatus,
  getEffectiveImpact,
  getGovernanceSignals,
} from "@/lib/risk-engine";
import { PortfolioView } from "@/components/portfolio-view";
import type { PortfolioAutomation } from "@/lib/portfolio-types";

export default async function AutomationsPage() {
  const session = await getRequiredSession();
  const workspaceId = session.user.workspaceId;

  const [rawAutomations, connectorConfig] = await Promise.all([
    prisma.automation.findMany({
      where: { workspaceId, status: { not: "removed" } },
    }),
    prisma.connectorConfig.findFirst({
      where: { workspaceId, platform: "n8n" },
    }),
  ]);

  const automations: PortfolioAutomation[] = rawAutomations.map((a) => ({
    id: a.id,
    name: a.name,
    description: a.description,
    platform: a.platform,
    status: getEffectiveStatus(a),
    owner: a.owner,
    systemsTouched: a.systemsTouched,
    impactLevel: getEffectiveImpact(a),
    riskLevel: getRiskLevel(a),
    signals: getGovernanceSignals(a),
    automationLastUpdated: a.automationLastUpdated?.toISOString() ?? null,
    documentationLastUpdated:
      a.documentationLastUpdated?.toISOString() ?? null,
  }));

  return (
    <Suspense fallback={<div className="p-6">Loading...</div>}>
      <PortfolioView
        automations={automations}
        lastSyncAt={connectorConfig?.lastSyncAt?.toISOString() ?? null}
      />
    </Suspense>
  );
}
