-- Add Decision Records subsystem
-- This migration adds the DecisionRecord model and ComponentDecision junction table

-- Create DecisionStatus enum
CREATE TYPE "DecisionStatus" AS ENUM ('PROPOSED', 'ACCEPTED', 'DEPRECATED', 'SUPERSEDED');

-- Create DecisionRecord table
CREATE TABLE "DecisionRecord" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "context" TEXT NOT NULL,
    "decision" TEXT NOT NULL,
    "rationale" TEXT NOT NULL,
    "consequences" TEXT NOT NULL,
    "status" "DecisionStatus" NOT NULL DEFAULT 'PROPOSED',
    "supersededBy" TEXT,
    "supersedes" TEXT,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "tags" TEXT[],

    CONSTRAINT "DecisionRecord_pkey" PRIMARY KEY ("id")
);

-- Create ComponentDecision junction table
CREATE TABLE "ComponentDecision" (
    "id" TEXT NOT NULL,
    "componentId" TEXT NOT NULL,
    "decisionId" TEXT NOT NULL,
    "linkedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ComponentDecision_pkey" PRIMARY KEY ("id")
);

-- Create indexes for DecisionRecord
CREATE INDEX "DecisionRecord_projectId_idx" ON "DecisionRecord"("projectId");
CREATE INDEX "DecisionRecord_status_idx" ON "DecisionRecord"("status");
CREATE INDEX "DecisionRecord_createdAt_idx" ON "DecisionRecord"("createdAt");

-- Create indexes and unique constraint for ComponentDecision
CREATE UNIQUE INDEX "ComponentDecision_componentId_decisionId_key" ON "ComponentDecision"("componentId", "decisionId");
CREATE INDEX "ComponentDecision_componentId_idx" ON "ComponentDecision"("componentId");
CREATE INDEX "ComponentDecision_decisionId_idx" ON "ComponentDecision"("decisionId");

-- Add foreign key constraints for DecisionRecord
ALTER TABLE "DecisionRecord" ADD CONSTRAINT "DecisionRecord_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DecisionRecord" ADD CONSTRAINT "DecisionRecord_supersededBy_fkey" FOREIGN KEY ("supersededBy") REFERENCES "DecisionRecord"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Add foreign key constraints for ComponentDecision
ALTER TABLE "ComponentDecision" ADD CONSTRAINT "ComponentDecision_componentId_fkey" FOREIGN KEY ("componentId") REFERENCES "Component"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ComponentDecision" ADD CONSTRAINT "ComponentDecision_decisionId_fkey" FOREIGN KEY ("decisionId") REFERENCES "DecisionRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;
