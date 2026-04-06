import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const autos = await prisma.automation.findMany({
    where: { isRemoved: false },
    select: { name: true, businessNarrative: true, analysisStatus: true, updatedAt: true },
  });
  const profile = await prisma.companyProfile.findFirst({
    select: { analysisStatus: true, analyzedAt: true },
  });

  console.log(`CompanyProfile: status=${profile?.analysisStatus}, analyzedAt=${profile?.analyzedAt}`);
  console.log(`\n${autos.length} automations:`);
  for (const a of autos) {
    console.log(`  ${a.name}: narrative=${a.businessNarrative ? "YES" : "NULL"}, status=${a.analysisStatus}, updated=${a.updatedAt.toISOString()}`);
  }
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
