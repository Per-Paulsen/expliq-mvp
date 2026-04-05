-- AlterTable
ALTER TABLE "Automation" ADD COLUMN     "systemsTouched" TEXT[],
ADD COLUMN     "trigger" TEXT,
ADD COLUMN     "triggerType" TEXT;

-- AlterTable
ALTER TABLE "BusinessProcess" ADD COLUMN     "valueAtStake" TEXT;
