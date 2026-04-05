// TODO: Epic 10 — R1 LLM pipeline stubbed out. R2 replaces with multi-step
// analysis pipeline (workflow analysis → workspace analysis). The new pipeline
// will be implemented in Epic 11.

export interface LLMPipelineResult {
  name: string;
}

/**
 * @deprecated R1 LLM pipeline — fields removed in Epic 10 schema migration.
 * Throws at runtime. Will be replaced by R2 pipeline in Epic 11.
 */
export async function processAutomation(
  _automationId: string,
  _workspaceId: string,
): Promise<LLMPipelineResult> {
  throw new Error(
    "R1 LLM pipeline disabled — Epic 10 schema migration removed target fields. " +
    "Use the R2 analysis pipeline instead.",
  );
}
