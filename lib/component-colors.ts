/**
 * Component Type Color System
 * 
 * Inspired by Miro's color-coded element system, this provides
 * consistent color theming for different component types across the UI.
 */

import { ComponentType } from '@/types/architecture';

export interface ComponentColorScheme {
    primary: string;        // Main color for badges, borders
    light: string;          // Light background
    border: string;         // Border color for cards
    text: string;           // Text color for contrast
    badgeClass: string;     // Tailwind classes for badges
    borderClass: string;    // Tailwind classes for left borders
}

/**
 * Get color scheme for a component type
 */
export function getComponentColorScheme(type: ComponentType): ComponentColorScheme {
    switch (type) {
        case 'service':
            return {
                primary: '#3B82F6',      // Blue
                light: '#EFF6FF',        // Blue-50
                border: '#3B82F6',
                text: '#1E40AF',         // Blue-800
                badgeClass: 'bg-blue-100 text-blue-800 border-blue-300',
                borderClass: 'border-l-4 border-l-blue-500',
            };

        case 'database':
            return {
                primary: '#A855F7',      // Purple
                light: '#FAF5FF',        // Purple-50
                border: '#A855F7',
                text: '#6B21A8',         // Purple-800
                badgeClass: 'bg-purple-100 text-purple-800 border-purple-300',
                borderClass: 'border-l-4 border-l-purple-500',
            };

        case 'ui':
            return {
                primary: '#B8FF14',      // Neon Green (existing brand color)
                light: '#F7FEE7',        // Lime-50
                border: '#84CC16',       // Lime-500
                text: '#3F6212',         // Lime-800
                badgeClass: 'bg-lime-100 text-lime-800 border-lime-300',
                borderClass: 'border-l-4 border-l-lime-500',
            };

        case 'external':
            return {
                primary: '#F97316',      // Orange
                light: '#FFF7ED',        // Orange-50
                border: '#F97316',
                text: '#9A3412',         // Orange-800
                badgeClass: 'bg-orange-100 text-orange-800 border-orange-300',
                borderClass: 'border-l-4 border-l-orange-500',
            };

        case 'library':
            return {
                primary: '#06B6D4',      // Cyan
                light: '#ECFEFF',        // Cyan-50
                border: '#06B6D4',
                text: '#164E63',         // Cyan-900
                badgeClass: 'bg-cyan-100 text-cyan-800 border-cyan-300',
                borderClass: 'border-l-4 border-l-cyan-500',
            };

        default:
            return {
                primary: '#6B7280',      // Gray
                light: '#F9FAFB',        // Gray-50
                border: '#6B7280',
                text: '#374151',         // Gray-700
                badgeClass: 'bg-gray-100 text-gray-800 border-gray-300',
                borderClass: 'border-l-4 border-l-gray-500',
            };
    }
}

/**
 * Get a readable label for component type
 */
export function getComponentTypeLabel(type: ComponentType): string {
    switch (type) {
        case 'service':
            return 'Service';
        case 'database':
            return 'Database';
        case 'ui':
            return 'UI Component';
        case 'external':
            return 'External API';
        case 'library':
            return 'Library';
        default:
            return type;
    }
}

/**
 * Get icon name for component type (for future use with icon libraries)
 */
export function getComponentTypeIcon(type: ComponentType): string {
    switch (type) {
        case 'service':
            return 'server';
        case 'database':
            return 'database';
        case 'ui':
            return 'layout';
        case 'external':
            return 'cloud';
        case 'library':
            return 'package';
        default:
            return 'box';
    }
}
