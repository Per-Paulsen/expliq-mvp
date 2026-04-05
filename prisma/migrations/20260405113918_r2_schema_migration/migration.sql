-- CreateEnum
CREATE TYPE "AnalysisStatus" AS ENUM ('pending', 'analyzing_workflows', 'analyzing_workspace', 'complete', 'failed');

-- AlterTable
ALTER TABLE "Automation" DROP COLUMN "businessContext",
DROP COLUMN "coreLogic",
DROP COLUMN "dataTypes",
DROP COLUMN "description",
DROP COLUMN "documentationLastUpdated",
DROP COLUMN "impactOverride",
DROP COLUMN "impactProposal",
DROP COLUMN "impactReasoning",
DROP COLUMN "lastReviewDate",
DROP COLUMN "owner",
DROP COLUMN "reviewCadenceDays",
DROP COLUMN "sideEffects",
DROP COLUMN "statusOverride",
DROP COLUMN "systemsTouched",
DROP COLUMN "trigger",
DROP COLUMN "triggerType",
ADD COLUMN     "analysisStatus" "AnalysisStatus",
ADD COLUMN     "avgDurationMs" DOUBLE PRECISION,
ADD COLUMN     "businessNarrative" TEXT,
ADD COLUMN     "dataFlow" TEXT,
ADD COLUMN     "detectability" JSONB,
ADD COLUMN     "downstreamIds" TEXT[],
ADD COLUMN     "errorRate" DOUBLE PRECISION,
ADD COLUMN     "impact" JSONB,
ADD COLUMN     "isRemoved" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "lastExecutedAt" TIMESTAMP(3),
ADD COLUMN     "processId" TEXT,
ADD COLUMN     "revenueImpactEstimate" TEXT,
ADD COLUMN     "runsPerWeek" DOUBLE PRECISION,
ADD COLUMN     "stepName" TEXT,
ADD COLUMN     "technicalEvidence" JSONB,
ADD COLUMN     "timeSavingsEstimate" TEXT,
ADD COLUMN     "upstreamIds" TEXT[];

-- AlterTable
ALTER TABLE "ConnectorConfig" ADD COLUMN     "discoveryData" JSONB,
ADD COLUMN     "selectedTags" TEXT[];

-- DropEnum
DROP TYPE "StatusOverride";

-- CreateTable
CREATE TABLE "BusinessProcess" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "summary" TEXT,
    "maturityLevel" TEXT,
    "steps" JSONB,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BusinessProcess_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Recommendation" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "processId" TEXT,
    "processSuggestionId" TEXT,
    "type" TEXT NOT NULL,
    "tier" TEXT NOT NULL,
    "stepName" TEXT,
    "name" TEXT NOT NULL,
    "brief" TEXT,
    "businessCase" TEXT,
    "evidence" JSONB,
    "confidence" TEXT,
    "honestFraming" TEXT,
    "implementationNotes" TEXT,
    "suggestedPlatform" TEXT,
    "systemSource" TEXT,
    "systemDestination" TEXT,
    "deployableJson" JSONB,
    "impactEstimate" TEXT,
    "priorityOrder" INTEGER NOT NULL DEFAULT 0,
    "affectedScope" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Recommendation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProcessSuggestion" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "basedOn" TEXT,
    "businessCase" TEXT,
    "connectedSystems" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProcessSuggestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompanyProfile" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "systemLandscape" JSONB,
    "nextMoveText" TEXT,
    "nextMoveReasoning" TEXT,
    "processMetrics" JSONB,
    "benchmarks" JSONB,
    "insights" JSONB,
    "aggregateEstimates" JSONB,
    "analyzedAt" TIMESTAMP(3),
    "analysisStatus" "AnalysisStatus" NOT NULL DEFAULT 'pending',
    "previousSnapshot" JSONB,
    "deltaSummary" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CompanyProfile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CompanyProfile_workspaceId_key" ON "CompanyProfile"("workspaceId");

-- AddForeignKey
ALTER TABLE "Automation" ADD CONSTRAINT "Automation_processId_fkey" FOREIGN KEY ("processId") REFERENCES "BusinessProcess"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusinessProcess" ADD CONSTRAINT "BusinessProcess_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Recommendation" ADD CONSTRAINT "Recommendation_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Recommendation" ADD CONSTRAINT "Recommendation_processId_fkey" FOREIGN KEY ("processId") REFERENCES "BusinessProcess"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Recommendation" ADD CONSTRAINT "Recommendation_processSuggestionId_fkey" FOREIGN KEY ("processSuggestionId") REFERENCES "ProcessSuggestion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProcessSuggestion" ADD CONSTRAINT "ProcessSuggestion_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompanyProfile" ADD CONSTRAINT "CompanyProfile_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
