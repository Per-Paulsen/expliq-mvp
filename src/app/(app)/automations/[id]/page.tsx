import Link from "next/link";
import { notFound } from "next/navigation";
import { getRequiredSession } from "@/lib/session";
import { prepareDetailData } from "@/lib/detail-data";
import { DetailView } from "@/components/detail-view";


function DetailNotAnalyzed({ name }: { name: string }) {
  return (
    <div>
      <Link
        href="/processes"
        className="text-sm text-text-secondary hover:text-primary transition mb-4 inline-block"
      >
        &larr; Back to Process Map
      </Link>
      <div className="bg-surface rounded-xl border border-border shadow-sm p-6">
        <h1 className="text-xl font-bold text-foreground mb-2">{name}</h1>
        <p className="text-sm text-text-secondary">
          This automation has not been analyzed yet. Run a sync to generate
          insights.
        </p>
        <Link
          href="/settings"
          className="inline-block mt-4 px-4 py-2 bg-primary text-white rounded-md text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          Go to Settings
        </Link>
      </div>
    </div>
  );
}

export default async function AutomationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getRequiredSession();

  const data = await prepareDetailData(id, session.user.workspaceId);

  if (!data) {
    notFound();
  }

  // Not analyzed yet — no businessNarrative
  if (!data.businessNarrative) {
    return <DetailNotAnalyzed name={data.name} />;
  }

  return (
    <div>
      <Link
        href="/processes"
        className="text-sm text-text-secondary hover:text-primary transition mb-4 inline-block"
      >
        &larr; Back to Process Map
      </Link>
      <DetailView data={data} />
    </div>
  );
}
