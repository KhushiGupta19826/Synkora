/**
 * Architecture Map Validation
 * 
 * Validation utilities for Architecture Map elements and types.
 */

export type ArchitectureElementType = 'component' | 'dependency' | 'dataflow';

/**
 * Allowed Tldraw/Excalidraw element types that map to Architecture Map concepts
 * - rectangle, ellipse, diamond = component
 * - arrow = dependency
 * - line = dataflow
 * - text = labels (allowed for annotations)
 */
const ALLOWED_TLDRAW_TYPES = [
    'rectangle',
    'ellipse',
    'diamond',
    'arrow',
    'line',
    'text',
    'component',
    'dependency',
    'dataflow',
];

/**
 * Validate that an element type is allowed on the Architecture Map
 */
export function isAllowedElementType(elementType: string): boolean {
    return ALLOWED_TLDRAW_TYPES.includes(elementType.toLowerCase());
}

/**
 * Map Tldraw element type to Architecture Map concept
 */
export function mapToArchitectureType(tldrawType: string): ArchitectureElementType | 'label' {
    const type = tldrawType.toLowerCase();

    if (type === 'rectangle' || type === 'ellipse' || type === 'diamond' || type === 'component') {
        return 'component';
    }

    if (type === 'arrow' || type === 'dependency') {
        return 'dependency';
    }

    if (type === 'line' || type === 'dataflow') {
        return 'dataflow';
    }

    if (type === 'text') {
        return 'label';
    }

    throw new Error(`Invalid element type: ${tldrawType}`);
}

/**
 * Validate Architecture Map elements
 */
export function validateArchitectureMapElements(elements: any[]): {
    valid: boolean;
    errors: string[];
} {
    const errors: string[] = [];

    for (let i = 0; i < elements.length; i++) {
        const element = elements[i];

        // Check if element has a type
        if (!element.type) {
            continue; // Skip elements without type (might be metadata)
        }

        const elementType = element.type;

        if (!isAllowedElementType(elementType)) {
            errors.push(
                `Element at index ${i} has invalid type "${element.type}". ` +
                `Only Component, Dependency, and Data Flow elements are allowed on Architecture Map.`
            );
        }
    }

    return {
        valid: errors.length === 0,
        errors,
    };
}

/**
 * Filter out invalid elements from a canvas state
 */
export function filterValidElements(elements: any[]): any[] {
    return elements.filter((element) => {
        if (!element.type) {
            return true; // Keep elements without type
        }
        return isAllowedElementType(element.type);
    });
}

/**
 * Get a user-friendly error message for invalid element types
 */
export function getElementTypeErrorMessage(invalidType: string): string {
    return (
        `The element type "${invalidType}" is not allowed on the Architecture Map. ` +
        `Please use only:\n` +
        `- Components (rectangles, ellipses, diamonds)\n` +
        `- Dependencies (arrows)\n` +
        `- Data Flows (lines)\n` +
        `- Text labels for annotations`
    );
}
