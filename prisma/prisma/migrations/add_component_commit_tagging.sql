-- Add junction table for Component-Commit tagging
CREATE TABLE "ComponentCommit" (
    "id" TEXT NOT NULL,
    "componentId" TEXT NOT NULL,
    "commitSha" TEXT NOT NULL,
    "repositoryId" TEXT NOT NULL,
    "taggedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "autoDetected" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "ComponentCommit_pkey" PRIMARY KEY ("id")
);

-- Create unique constraint to prevent duplicate tagging
CREATE UNIQUE INDEX "ComponentCommit_componentId_commitSha_key" ON "ComponentCommit"("componentId", "commitSha");

-- Create indexes for efficient queries
CREATE INDEX "ComponentCommit_componentId_idx" ON "ComponentCommit"("componentId");
CREATE INDEX "ComponentCommit_commitSha_idx" ON "ComponentCommit"("commitSha");
CREATE INDEX "ComponentCommit_repositoryId_idx" ON "ComponentCommit"("repositoryId");

-- Add foreign key constraints
ALTER TABLE "ComponentCommit" ADD CONSTRAINT "ComponentCommit_componentId_fkey" FOREIGN KEY ("componentId") REFERENCES "Component"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ComponentCommit" ADD CONSTRAINT "ComponentCommit_repositoryId_fkey" FOREIGN KEY ("repositoryId") REFERENCES "GitRepository"("id") ON DELETE CASCADE ON UPDATE CASCADE;