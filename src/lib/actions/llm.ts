// TODO: Epic 10 — R1 LLM actions stubbed. documentationLastUpdated removed
// in schema migration. R2 analysis pipeline (Epic 11) will replace these.
"use server";

/**
 * @deprecated R1 batch processing — fields removed in Epic 10.
 */
export async function processUnprocessedAutomations() {
  return {
    success: false,
    summary: { total: 0, processed: 0, errors: ["R1 LLM pipeline disabled — Epic 10 schema migration removed target fields."] },
  };
}

/**
 * @deprecated R1 single regeneration — fields removed in Epic 10.
 */
export async function regenerateAutomation(_automationId: string) {
  return { error: "R1 LLM pipeline disabled — Epic 10 schema migration removed target fields." };
}
