import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { getRequiredSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getRequiredSession();
  const connector = await prisma.connectorConfig.findFirst({
    where: { workspaceId: session.user.workspaceId },
    select: { lastSyncAt: true },
  });

  return (
    <SidebarProvider>
      <AppSidebar lastSyncAt={connector?.lastSyncAt ?? null} />
      <SidebarInset className="overflow-x-hidden">
        <main className="flex-1 px-8 py-6 min-w-0">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
