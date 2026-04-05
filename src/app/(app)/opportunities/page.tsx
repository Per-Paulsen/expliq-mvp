import { getRequiredSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { prepareOpportunitiesData } from "@/lib/opportunities-data";
import { OpportunitiesView } from "@/components/opportunities-view";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";

// Empty state component (no data yet)
function OpportunitiesEmpty() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <p className="text-sm text-text-secondary mb-4">
        No recommendations yet. Sync your n8n instance to get started.
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
function OpportunitiesAnalyzing() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground mb-6">Opportunities</h1>
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="text-sm text-text-secondary mb-6">
          Generating recommendations...
        </p>
        <div className="w-full max-w-2xl space-y-4">
          <Skeleton className="h-20 w-full rounded" />
          <div className="grid grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-32 rounded" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Error state (analysis failed)
function OpportunitiesError() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground mb-6">Opportunities</h1>
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

export default async function OpportunitiesPage() {
  const session = await getRequiredSession();
  const workspaceId = session.user.workspaceId;

  const [companyProfile, recommendationCount] = await Promise.all([
    prisma.companyProfile.findUnique({
      where: { workspaceId },
      select: { analysisStatus: true },
    }),
    prisma.recommendation.count({ where: { workspaceId } }),
  ]);

  // Empty state: no CompanyProfile OR no recommendations
  if (!companyProfile || recommendationCount === 0) {
    return <OpportunitiesEmpty />;
  }

  // Analyzing state
  if (
    companyProfile.analysisStatus === "pending" ||
    companyProfile.analysisStatus === "analyzing_workflows" ||
    companyProfile.analysisStatus === "analyzing_workspace"
  ) {
    return <OpportunitiesAnalyzing />;
  }

  // Failed state
  if (companyProfile.analysisStatus === "failed") {
    return <OpportunitiesError />;
  }

  // Full opportunities view
  const data = await prepareOpportunitiesData(workspaceId);
  return <OpportunitiesView {...data} />;
}
