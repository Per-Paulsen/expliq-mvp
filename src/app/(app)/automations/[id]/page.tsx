export default async function AutomationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">Automation Detail</h1>
      <p className="text-sm text-text-secondary">Detail view for automation {id}.</p>
    </div>
  );
}
