import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const recs = await prisma.recommendation.findMany({
    select: {
      name: true,
      type: true,
      tier: true,
      businessCase: true,
      evidence: true,
      honestFraming: true,
      implementationNotes: true,
      systemSource: true,
      systemDestination: true,
      affectedScope: true,
      automationId: true,
      process: { select: { name: true } },
    },
    orderBy: { priorityOrder: "asc" },
  });

  for (const r of recs) {
    const fields = {
      businessCase: !!r.businessCase,
      evidence: !!r.evidence,
      honestFraming: !!r.honestFraming,
      implementationNotes: !!r.implementationNotes,
      systemSource: !!r.systemSource,
      systemDestination: !!r.systemDestination,
    };
    const missing = Object.entries(fields)
      .filter(([, v]) => !v)
      .map(([k]) => k);

    console.log(`\n${r.name} (${r.type} / ${r.tier})`);
    console.log(`  process: ${r.process?.name ?? "null"}`);
    console.log(`  affectedScope: ${r.affectedScope}`);
    console.log(`  automationId: ${r.automationId ?? "null"}`);
    console.log(`  missing fields: ${missing.length > 0 ? missing.join(", ") : "none"}`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
