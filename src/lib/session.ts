import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export async function getRequiredSession() {
  const session = await auth();

  if (!session?.user?.id || !session?.user?.workspaceId) {
    redirect("/login");
  }

  return session;
}
