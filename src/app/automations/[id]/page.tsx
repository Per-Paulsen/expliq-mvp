export default async function AutomationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <div>
      <h1 className="text-2xl font-bold">Automation Detail</h1>
      <p className="text-muted-foreground mt-2">
        Details for automation {id}.
      </p>
    </div>
  );
}
