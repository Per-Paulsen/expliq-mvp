/**
 * Extracts the 9 "Reference"-tagged fairtix workflows from
 * n8n-api-examples/fairtix/workflows-list.json, redacts the 3 known real
 * email addresses, and writes the cleaned workflow set as a fixture.
 *
 * Output: scripts/seed-fixtures/fairtix-workflows-redacted.json
 *
 * Run: npx tsx scripts/redact-fairtix.ts
 */
import "dotenv/config";
import * as fs from "node:fs";
import * as path from "node:path";

const SOURCE = path.join(
  process.cwd(),
  "n8n-api-examples",
  "fairtix",
  "workflows-list.json",
);
const OUT = path.join(
  process.cwd(),
  "scripts",
  "seed-fixtures",
  "fairtix-workflows-redacted.json",
);

const EMAIL_REDACTIONS: Array<[RegExp, string]> = [
  [/mail@andreasstephan\.com/gi, "demo-author@fairtix.example.com"],
  [/dlschoolautomations@gmail\.com/gi, "ops@fairtix.example.com"],
  [/lena\.bergstrom84@gmail\.com/gi, "customer@fairtix.example.com"],
];

function main(): number {
  if (!fs.existsSync(SOURCE)) {
    console.error("Source not found:", SOURCE);
    return 1;
  }

  const raw = JSON.parse(fs.readFileSync(SOURCE, "utf8"));
  const all: Array<{
    id: string;
    name: string;
    tags?: Array<{ name: string }>;
  }> = raw.data ?? raw;

  const refs = all.filter((w) =>
    (w.tags ?? []).some((t) => t.name === "Reference"),
  );

  if (refs.length === 0) {
    console.error('No workflows with "Reference" tag found.');
    return 1;
  }

  // Stringify, redact, parse back — deterministic find/replace across the
  // entire workflow tree (parameters, descriptions, nested values).
  let json = JSON.stringify(refs);
  let totalReplacements = 0;
  for (const [pattern, replacement] of EMAIL_REDACTIONS) {
    const matches = json.match(pattern);
    if (matches) {
      totalReplacements += matches.length;
      json = json.replace(pattern, replacement);
    }
  }

  const redacted = JSON.parse(json);

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(redacted, null, 2) + "\n");

  console.log(`[OK] Wrote ${refs.length} Reference workflows to`);
  console.log(`     ${path.relative(process.cwd(), OUT)}`);
  console.log(`     ${totalReplacements} email occurrences redacted.`);
  console.log("");
  console.log("Workflows:");
  for (const w of refs) {
    console.log(`  - ${w.id} :: ${w.name}`);
  }

  return 0;
}

process.exit(main());
