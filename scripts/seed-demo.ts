/**
 * One-time seed of the demo workspace against the configured DATABASE_URL.
 *
 * Run after first production deploy with the production DATABASE_URL:
 *   DATABASE_URL=<prod-url> npx tsx scripts/seed-demo.ts
 *
 * After this, the daily cron at /api/cron/reset-demo handles re-seeds.
 */
import "dotenv/config";

import { prisma } from "@/lib/prisma";
import { seedDemo, DEMO_EMAIL, DEMO_PASSWORD } from "@/lib/seed-demo";

async function main(): Promise<number> {
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL not set.");
    return 1;
  }

  console.log("Seeding demo workspace…");
  const result = await seedDemo(prisma);
  console.log(`\nDemo seed complete.`);
  console.log(`  User:            ${DEMO_EMAIL}  (password: ${DEMO_PASSWORD})`);
  console.log(`  UserId:          ${result.userId}`);
  console.log(`  Workspace:       ${result.workspaceId}`);
  console.log(`  Automations:     ${result.automationCount}`);
  console.log(`  Processes:       ${result.processCount}`);
  console.log(`  Recommendations: ${result.recommendationCount}`);
  console.log(`  ResetAt:         ${result.resetAt}`);
  return 0;
}

main()
  .then((code) => process.exit(code))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
