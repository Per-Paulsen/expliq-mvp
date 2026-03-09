import { prisma } from "@/lib/prisma";
import { getRequiredSession } from "@/lib/session";
import { SettingsForm } from "@/components/settings-form";

export default async function SettingsPage() {
  const session = await getRequiredSession();
  const workspaceId = session.user.workspaceId;

  const config = await prisma.connectorConfig.findFirst({
    where: { workspaceId, platform: "n8n" },
  });

  return (
    <SettingsForm
      existingUrl={config?.instanceUrl}
      hasApiKey={!!config?.apiKeyEncrypted}
      lastSyncAt={config?.lastSyncAt?.toISOString() ?? null}
    />
  );
}
