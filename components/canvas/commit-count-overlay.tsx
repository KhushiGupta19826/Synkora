'use client';

import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { GitCommit } from 'lucide-react';

interface CommitCountOverlayProps {
    canvasId: string;
    components: Array<{
        id: string;
        componentId: string;
        name: string;
        position: { x: number; y: number };
    }>;
}

interface CommitCountData {
    componentId: string;
    commitCount: number;
}

export function CommitCountOverlay({ canvasId, components }: CommitCountOverlayProps) {
    const [commitCounts, setCommitCounts] = useState<Record<string, number>>({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchCommitCounts() {
            try {
                const response = await fetch(`/api/canvas/${canvasId}/components/commit-counts`);
                if (response.ok) {
                    const data = await response.json();
                    const countsMap: Record<string, number> = {};
                    data.commitCounts?.forEach((item: CommitCountData) => {
                        countsMap[item.componentId] = item.commitCount;
                    });
                    setCommitCounts(countsMap);
                }
            } catch (error) {
                console.error('Error fetching commit counts:', error);
            } finally {
                setLoading(false);
            }
        }

        if (canvasId) {
            fetchCommitCounts();
        }
    }, [canvasId]);

    if (loading) {
        return null;
    }

    return (
        <div className="pointer-events-none absolute inset-0 z-10">
            {components.map((component) => {
                const commitCount = commitCounts[component.componentId];
                if (!commitCount || commitCount === 0) return null;

                return (
                    <div
                        key={`commit-${component.id}`}
                        className="absolute pointer-events-auto"
                        style={{
                            left: `${component.position.x + 120}px`, // Position to the right of risk badge
                            top: `${component.position.y - 30}px`,
                        }}
                    >
                        <Badge
                            variant="secondary"
                            className="text-xs font-semibold shadow-lg border-2 border-blue-200 bg-blue-100 text-blue-800 flex items-center gap-1"
                            title={`${commitCount} commit${commitCount !== 1 ? 's' : ''} tagged to this component`}
                        >
                            <GitCommit className="h-3 w-3" />
                            <span>{commitCount}</span>
                        </Badge>
                    </div>
                );
            })}
        </div>
    );
}