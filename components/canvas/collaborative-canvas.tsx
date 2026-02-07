'use client';

import { useEffect, useState } from 'react';
import { Tldraw } from 'tldraw';
import { ComponentDetailPanel } from './component-detail-panel';
import { RiskBadgeOverlay } from './risk-badge-overlay';
import { CommitCountOverlay } from './commit-count-overlay';

interface CollaborativeCanvasProps {
    projectId: string;
    canvasId: string;
}

interface Component {
    id: string;
    componentId: string;
    name: string;
    position: { x: number; y: number };
}

export function CollaborativeCanvas({ projectId, canvasId }: CollaborativeCanvasProps) {
    const [mounted, setMounted] = useState(false);
    const [selectedComponentId, setSelectedComponentId] = useState<string | null>(null);
    const [components, setComponents] = useState<Component[]>([]);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        async function fetchComponents() {
            try {
                const response = await fetch(`/api/canvas/${canvasId}/components`);
                if (response.ok) {
                    const data = await response.json();
                    // API returns components directly as an array
                    setComponents(data || []);
                }
            } catch (error) {
                console.error('Error fetching components:', error);
            }
        }

        if (canvasId) {
            fetchComponents();
        }
    }, [canvasId]);

    if (!mounted) {
        return (
            <div className="flex items-center justify-center w-full h-full">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
                    <p className="text-sm text-gray-600">Loading Architecture Map...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="relative w-full h-full bg-white">
            <div className="absolute top-4 right-4 z-10 bg-green-100 border border-green-400 text-green-800 px-3 py-1 rounded-md text-sm">
                Architecture Map Ready
            </div>
            <Tldraw
                licenseKey='tldraw-2026-02-25/WyJDd1FjTzVOWiIsWyIqIl0sMTYsIjIwMjYtMDItMjUiXQ.6SjAGtDmbrZj+mebgzhmbiRN715/aKs0UbEV6KdpgzimEELQQQaQhB4ashVhZ0DxtL2MVfijw6wi5U60u3zQ2A'
            />

            {/* Risk Badge Overlay */}
            {components.length > 0 && (
                <RiskBadgeOverlay canvasId={canvasId} components={components} />
            )}

            {/* Commit Count Overlay */}
            {components.length > 0 && (
                <CommitCountOverlay canvasId={canvasId} components={components} />
            )}

            {selectedComponentId && (
                <ComponentDetailPanel
                    componentId={selectedComponentId}
                    onClose={() => setSelectedComponentId(null)}
                />
            )}
        </div>
    );
}