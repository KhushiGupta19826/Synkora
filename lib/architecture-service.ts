/**
 * Architecture Service
 * 
 * Service for managing Architecture Map components with unique Component IDs.
 * Implements component CRUD operations and ID generation logic.
 */

import { prisma } from './prisma';
import type { Component, CreateComponentInput, UpdateComponentInput, ComponentType } from '@/types/architecture';

/**
 * Generate a unique Component ID
 * Format: COMP-{timestamp}-{random}
 */
export function generateComponentId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `COMP-${timestamp}-${random}`.toUpperCase();
}

/**
 * Create a new component with a unique Component ID
 */
export async function createComponent(input: CreateComponentInput): Promise<Component> {
    const componentId = generateComponentId();

    const component = await prisma.component.create({
        data: {
            componentId,
            canvasId: input.canvasId,
            name: input.name,
            type: input.type,
            description: input.description,
            position: input.position as any,
            metadata: input.metadata || {},
        },
    });

    return {
        ...component,
        type: component.type as ComponentType,
        position: component.position as { x: number; y: number },
        metadata: component.metadata as Record<string, any> | undefined,
        description: component.description || undefined,
    };
}

/**
 * Get a component by its unique Component ID
 */
export async function getComponentByComponentId(componentId: string): Promise<Component | null> {
    const component = await prisma.component.findUnique({
        where: { componentId },
    });

    if (!component) {
        return null;
    }

    return {
        ...component,
        type: component.type as ComponentType,
        position: component.position as { x: number; y: number },
        metadata: component.metadata as Record<string, any> | undefined,
        description: component.description || undefined,
    };
}

/**
 * Get a component by its database ID
 */
export async function getComponentById(id: string): Promise<Component | null> {
    const component = await prisma.component.findUnique({
        where: { id },
    });

    if (!component) {
        return null;
    }

    return {
        ...component,
        type: component.type as ComponentType,
        position: component.position as { x: number; y: number },
        metadata: component.metadata as Record<string, any> | undefined,
        description: component.description || undefined,
    };
}

/**
 * Get all components for a canvas
 */
export async function getComponentsByCanvasId(canvasId: string): Promise<Component[]> {
    const components = await prisma.component.findMany({
        where: { canvasId },
        orderBy: { createdAt: 'asc' },
    });

    return components.map((component) => ({
        ...component,
        type: component.type as ComponentType,
        position: component.position as { x: number; y: number },
        metadata: component.metadata as Record<string, any> | undefined,
        description: component.description || undefined,
    }));
}

/**
 * Update a component
 */
export async function updateComponent(
    id: string,
    input: UpdateComponentInput
): Promise<Component> {
    const component = await prisma.component.update({
        where: { id },
        data: {
            name: input.name,
            type: input.type,
            description: input.description,
            position: input.position as any,
            metadata: input.metadata as any,
        },
    });

    return {
        ...component,
        type: component.type as ComponentType,
        position: component.position as { x: number; y: number },
        metadata: component.metadata as Record<string, any> | undefined,
        description: component.description || undefined,
    };
}

/**
 * Delete a component
 */
export async function deleteComponent(id: string): Promise<void> {
    await prisma.component.delete({
        where: { id },
    });
}

/**
 * Check if a Component ID already exists
 */
export async function componentIdExists(componentId: string): Promise<boolean> {
    const count = await prisma.component.count({
        where: { componentId },
    });
    return count > 0;
}

/**
 * Get all Component IDs for a canvas
 */
export async function getAllComponentIds(canvasId: string): Promise<string[]> {
    const components = await prisma.component.findMany({
        where: { canvasId },
        select: { componentId: true },
    });
    return components.map((c) => c.componentId);
}
