/**
 * Architecture Map Types
 * 
 * Types for the Architecture Map subsystem including components,
 * dependencies, and data flows.
 */

export type ComponentType = 'service' | 'library' | 'database' | 'external' | 'ui';

export interface ComponentPosition {
    x: number;
    y: number;
}

export interface Component {
    id: string;
    componentId: string; // Unique Component ID for referencing
    canvasId: string;
    name: string;
    type: ComponentType;
    description?: string;
    position: ComponentPosition;
    metadata?: Record<string, any>;
    createdAt: Date;
    updatedAt: Date;
}

export interface CreateComponentInput {
    canvasId: string;
    name: string;
    type: ComponentType;
    description?: string;
    position: ComponentPosition;
    metadata?: Record<string, any>;
}

export interface UpdateComponentInput {
    name?: string;
    type?: ComponentType;
    description?: string;
    position?: ComponentPosition;
    metadata?: Record<string, any>;
}

/**
 * Element types allowed on Architecture Map
 */
export type ArchitectureElementType = 'component' | 'dependency' | 'dataflow';

export interface ArchitectureElement {
    type: ArchitectureElementType;
    id: string;
    [key: string]: any;
}
