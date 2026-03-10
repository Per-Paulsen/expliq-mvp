import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import { getRequiredSession } from "@/lib/session";
import {
  getRiskLevel,
  getEffectiveImpact,
  getGovernanceSignals,
  getSystemExposure,
  getOwnerExposure,
} from "@/lib/risk-engine";
import {
  computeSnapshotMetrics,
  getRecentlyChanged,
  getMultiSystemAutomations,
} from "@/lib/snapshot-metrics";
import { SnapshotDashboard } from "@/components/snapshot-dashboard";
import type { SnapshotAutomation, SnapshotData } from "@/lib/snapshot-types";
import { Skeleton } from "@/components/ui/skeleton";

function SnapshotSkeleton() {
  return (
    <div>
      <Skeleton className="h-8 w-56 mb-6" />
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Skeleton className="h-48 rounded-xl" />
        <Skeleton className="h-48 rounded-xl" />
      </div>
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Skeleton className="h-48 rounded-xl" />
        <Skeleton className="h-48 rounded-xl" />
      </div>
    </div>
  );
}

export default async function WorkspaceSnapshotPage() {
  const session = await getRequiredSession();
  const workspaceId = session.user.workspaceId;

  const [rawAutomations, systemExposure, ownerExposure] = await Promise.all([
    prisma.automation.findMany({
      where: { workspaceId, status: { not: "removed" } },
    }),
    getSystemExposure(workspaceId),
    getOwnerExposure(workspaceId),
  ]);

  const automations: SnapshotAutomation[] = rawAutomations.map((a) => ({
    id: a.id,
    name: a.name,
    owner: a.owner,
    systemsTouched: a.systemsTouched,
    impactLevel: getEffectiveImpact(a),
    riskLevel: getRiskLevel(a),
    signals: getGovernanceSignals(a),
    automationLastUpdated: a.automationLastUpdated,
  }));

  const metrics = computeSnapshotMetrics(automations);
  const allRecentlyChanged = getRecentlyChanged(automations);
  const allMultiSystem = getMultiSystemAutomations(automations);

  const data: SnapshotData = {
    metrics,
    systemExposure,
    ownerExposure,
    recentlyChanged: allRecentlyChanged.slice(0, 5),
    multiSystem: allMultiSystem.slice(0, 5),
    hasMoreRecentlyChanged: allRecentlyChanged.length > 5,
    hasMoreMultiSystem: allMultiSystem.length > 5,
  };

  return (
    <Suspense fallback={<SnapshotSkeleton />}>
      <SnapshotDashboard data={data} />
    </Suspense>
  );
}
