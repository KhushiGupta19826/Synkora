-- Migration: Add Component model for Architecture Map
-- This migration adds the Component table to support unique Component IDs
-- and structured component management for the Architecture Map.

-- Create Component table
CREATE TABLE IF NOT EXISTS "Component" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "componentId" TEXT NOT NULL UNIQUE,
    "canvasId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT,
    "position" JSONB NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    
    CONSTRAINT "Component_canvasId_fkey" FOREIGN KEY ("canvasId") 
        REFERENCES "Canvas"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS "Component_canvasId_idx" ON "Component"("canvasId");
CREATE INDEX IF NOT EXISTS "Component_componentId_idx" ON "Component"("componentId");

-- Add comment to table
COMMENT ON TABLE "Component" IS 'Architecture Map components with unique Component IDs';
COMMENT ON COLUMN "Component"."componentId" IS 'Unique Component ID for referencing (format: COMP-{timestamp}-{random})';
COMMENT ON COLUMN "Component"."type" IS 'Component type: service, library, database, external, ui';
COMMENT ON COLUMN "Component"."position" IS 'Component position on canvas: {x: number, y: number}';
COMMENT ON COLUMN "Component"."metadata" IS 'Additional component metadata as JSON';
