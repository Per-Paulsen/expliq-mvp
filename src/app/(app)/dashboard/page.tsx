import { getRequiredSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { prepareDashboardData } from "@/lib/dashboard-data";
import { DashboardView } from "@/components/dashboard-view";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";

// Empty state component (no data yet)
function DashboardEmpty() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <p className="text-sm text-text-secondary mb-4">
        Connect your n8n instance in Settings to get started.
      </p>
      <Link
        href="/settings"
        className="px-4 py-2 bg-primary text-white rounded-md text-sm font-medium hover:bg-primary/90 transition-colors"
      >
        Go to Settings
      </Link>
    </div>
  );
}

// Analyzing state (analysis in progress)
function DashboardAnalyzing() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground mb-6">Dashboard</h1>
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="text-sm text-text-secondary mb-6">
          Analyzing your automation landscape...
        </p>
        <div className="w-full max-w-2xl space-y-4">
          <Skeleton className="h-20 w-full rounded" />
          <div className="grid grid-cols-5 gap-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-16 rounded" />
            ))}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Skeleton className="h-40 rounded" />
            <Skeleton className="h-40 rounded" />
          </div>
        </div>
      </div>
    </div>
  );
}

// Error state (analysis failed)
function DashboardError() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground mb-6">Dashboard</h1>
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="text-sm text-status-critical mb-2">Analysis failed</p>
        <p className="text-sm text-text-secondary mb-4">
          Something went wrong during analysis. Please try re-syncing.
        </p>
        <Link
          href="/settings"
          className="px-4 py-2 bg-primary text-white rounded-md text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          Go to Settings
        </Link>
      </div>
    </div>
  );
}

export default async function DashboardPage() {
  const session = await getRequiredSession();
  const workspaceId = session.user.workspaceId;

  const companyProfile = await prisma.companyProfile.findUnique({
    where: { workspaceId },
    select: { analysisStatus: true },
  });

  // Empty state
  if (!companyProfile) {
    return <DashboardEmpty />;
  }

  // Analyzing state
  if (
    companyProfile.analysisStatus === "pending" ||
    companyProfile.analysisStatus === "analyzing_workflows" ||
    companyProfile.analysisStatus === "analyzing_workspace"
  ) {
    return <DashboardAnalyzing />;
  }

  // Failed state
  if (companyProfile.analysisStatus === "failed") {
    return <DashboardError />;
  }

  // Full dashboard
  const data = await prepareDashboardData(workspaceId);
  return <DashboardView {...data} />;
}
