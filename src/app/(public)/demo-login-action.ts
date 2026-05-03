"use server";

/**
 * Auto-login as the demo user. Used by the landing-page "Open demo" button
 * when DEMO_MODE=true so visitors land directly on the dashboard without
 * retyping the credentials shown on the banner.
 */
import { signIn } from "@/lib/auth";
import { DEMO_EMAIL, DEMO_PASSWORD } from "@/lib/seed-demo";

export async function demoLoginAction(): Promise<void> {
  if (process.env.DEMO_MODE !== "true") {
    throw new Error("Demo mode not enabled");
  }

  await signIn("credentials", {
    email: DEMO_EMAIL,
    password: DEMO_PASSWORD,
    redirectTo: "/dashboard",
  });
}
