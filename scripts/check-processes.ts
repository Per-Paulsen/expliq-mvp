import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const recs = await prisma.recommendation.findMany({
    select: { name: true, tier: true, process: { select: { name: true } } },
    orderBy: { priorityOrder: "asc" },
  });

  console.log(`\n${recs.length} recommendations:\n`);
  for (const r of recs) {
    console.log(`  [${r.tier}] ${r.name} → process: ${r.process?.name ?? "NULL"}`);
  }

  const processes = await prisma.businessProcess.findMany({
    select: { name: true, _count: { select: { recommendations: true, automations: true } } },
    orderBy: { order: "asc" },
  });

  console.log(`\n${processes.length} processes:\n`);
  for (const p of processes) {
    console.log(`  ${p.name} (${p._count.automations} automations, ${p._count.recommendations} recs)`);
  }
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
