import { prisma } from "@/lib/prisma";
import { getRequiredSession } from "@/lib/session";
import { SettingsForm } from "@/components/settings-form";
import type { TagPreview } from "@/lib/actions/connector";

export default async function SettingsPage() {
  const session = await getRequiredSession();
  const workspaceId = session.user.workspaceId;

  const config = await prisma.connectorConfig.findFirst({
    where: { workspaceId, platform: "n8n" },
  });

  // Extract persisted tag previews from discoveryData if available
  let discoveryData: { tags: TagPreview[]; totalWorkflows: number } | null =
    null;

  if (config?.discoveryData && typeof config.discoveryData === "object") {
    const stored = config.discoveryData as Record<string, unknown>;
    if (Array.isArray(stored.tags) && typeof stored.totalWorkflows === "number") {
      discoveryData = {
        tags: stored.tags as TagPreview[],
        totalWorkflows: stored.totalWorkflows as number,
      };
    }
  }

  return (
    <SettingsForm
      existingUrl={config?.instanceUrl}
      hasApiKey={!!config?.apiKeyEncrypted}
      lastSyncAt={config?.lastSyncAt?.toISOString() ?? null}
      discoveryData={discoveryData}
      selectedTags={config?.selectedTags ?? []}
    />
  );
}
