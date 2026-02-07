"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { SystemEvolutionTimeline } from "@/components/analytics/system-evolution-timeline";

export interface TimelineEvent {
    id: string;
    type: 'decision' | 'commit' | 'component';
    timestamp: Date;
    title: string;
    description?: string;
    author?: string;
    metadata?: Record<string, any>;
}

export default function SystemEvolutionPage() {
    const params = useParams();
    const projectId = params.projectId as string;
    const [events, setEvents] = useState<TimelineEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchTimelineEvents() {
            try {
                setLoading(true);
                const response = await fetch(`/api/projects/${projectId}/evolution`);

                if (!response.ok) {
                    throw new Error("Failed to fetch timeline events");
                }

                const data = await response.json();
                setEvents(data.events || []);
            } catch (err) {
                console.error("Error fetching timeline:", err);
                setError(err instanceof Error ? err.message : "Failed to load timeline");
            } finally {
                setLoading(false);
            }
        }

        if (projectId) {
            fetchTimelineEvents();
        }
    }, [projectId]);

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold text-foreground">System Evolution</h1>
                </div>
                <div className="bg-card rounded-lg border border-border p-8 text-center text-muted-foreground">
                    Loading timeline...
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold text-foreground">System Evolution</h1>
                </div>
                <div className="bg-card rounded-lg border border-border p-8 text-center text-red-600 dark:text-red-400">
                    {error}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-foreground">System Evolution</h1>
                <p className="text-sm text-muted-foreground">
                    Track architectural changes, decisions, and code evolution
                </p>
            </div>

            <SystemEvolutionTimeline events={events} />
        </div>
    );
}
