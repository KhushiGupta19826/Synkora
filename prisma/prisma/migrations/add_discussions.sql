-- Create AnchorType enum
CREATE TYPE "AnchorType" AS ENUM ('COMPONENT', 'DECISION', 'COMMIT', 'PULL_REQUEST');

-- Create Discussion table
CREATE TABLE "Discussion" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "anchorType" "AnchorType" NOT NULL,
    "anchorId" TEXT NOT NULL,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Discussion_pkey" PRIMARY KEY ("id")
);

-- Create DiscussionMessage table
CREATE TABLE "DiscussionMessage" (
    "id" TEXT NOT NULL,
    "discussionId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DiscussionMessage_pkey" PRIMARY KEY ("id")
);

-- Create indexes
CREATE INDEX "Discussion_projectId_idx" ON "Discussion"("projectId");
CREATE INDEX "Discussion_anchorType_anchorId_idx" ON "Discussion"("anchorType", "anchorId");
CREATE INDEX "DiscussionMessage_discussionId_idx" ON "DiscussionMessage"("discussionId");

-- Add foreign key constraint
ALTER TABLE "DiscussionMessage" ADD CONSTRAINT "DiscussionMessage_discussionId_fkey" FOREIGN KEY ("discussionId") REFERENCES "Discussion"("id") ON DELETE CASCADE ON UPDATE CASCADE;
