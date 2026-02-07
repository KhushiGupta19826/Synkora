"use client";

import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { FileCheck, GitCommit, Palette, Calendar } from "lucide-react";
import { format, isAfter, isBefore, startOfDay, endOfDay } from "date-fns";

export interface TimelineEvent {
    id: string;
    type: 'decision' | 'commit' | 'component';
    timestamp: Date;
    title: string;
    description?: string;
    author?: string;
    metadata?: Record<string, any>;
}

interface SystemEvolutionTimelineProps {
    events: TimelineEvent[];
}

export function SystemEvolutionTimeline({ events }: SystemEvolutionTimelineProps) {
    const [startDate, setStartDate] = useState<string>("");
    const [endDate, setEndDate] = useState<string>("");
    const [selectedType, setSelectedType] = useState<string>("all");

    // Filter and sort events
    const filteredEvents = useMemo(() => {
        let filtered = [...events];

        // Filter by type
        if (selectedType !== "all") {
            filtered = filtered.filter(event => event.type === selectedType);
        }

        // Filter by date range
        if (startDate) {
            const start = startOfDay(new Date(startDate));
            filtered = filtered.filter(event =>
                isAfter(new Date(event.timestamp), start) ||
                format(new Date(event.timestamp), 'yyyy-MM-dd') === startDate
            );
        }

        if (endDate) {
            const end = endOfDay(new Date(endDate));
            filtered = filtered.filter(event =>
                isBefore(new Date(event.timestamp), end) ||
                format(new Date(event.timestamp), 'yyyy-MM-dd') === endDate
            );
        }

        // Sort by timestamp (newest first)
        return filtered.sort((a, b) =>
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
    }, [events, selectedType, startDate, endDate]);

    const getEventIcon = (type: string) => {
        switch (type) {
            case 'decision':
                return FileCheck;
            case 'commit':
                return GitCommit;
            case 'component':
                return Palette;
            default:
                return Calendar;
        }
    };

    const getEventColor = (type: string) => {
        switch (type) {
            case 'decision':
                return {
                    icon: "text-purple-600",
                    bg: "bg-purple-50 dark:bg-purple-900/20",
                    border: "border-purple-200 dark:border-purple-800"
                };
            case 'commit':
                return {
                    icon: "text-green-600",
                    bg: "bg-green-50 dark:bg-green-900/20",
                    border: "border-green-200 dark:border-green-800"
                };
            case 'component':
                return {
                    icon: "text-blue-600",
                    bg: "bg-blue-50 dark:bg-blue-900/20",
                    border: "border-blue-200 dark:border-blue-800"
                };
            default:
                return {
                    icon: "text-gray-600",
                    bg: "bg-gray-50 dark:bg-gray-900/20",
                    border: "border-gray-200 dark:border-gray-800"
                };
        }
    };

    const getEventTypeLabel = (type: string) => {
        switch (type) {
            case 'decision':
                return 'Decision Record';
            case 'commit':
                return 'Git Commit';
            case 'component':
                return 'Component Change';
            default:
                return 'Event';
        }
    };

    const eventCounts = useMemo(() => {
        return {
            all: events.length,
            decision: events.filter(e => e.type === 'decision').length,
            commit: events.filter(e => e.type === 'commit').length,
            component: events.filter(e => e.type === 'component').length,
        };
    }, [events]);

    return (
        <div className="space-y-6">
            {/* Filters */}
            <Card className="p-6 dark:bg-gray-900 dark:border-gray-800">
                <div className="flex flex-col md:flex-row gap-4">
                    {/* Type Filter */}
                    <div className="flex-1">
                        <label className="block text-sm font-medium text-muted-foreground mb-2">
                            Event Type
                        </label>
                        <select
                            value={selectedType}
                            onChange={(e) => setSelectedType(e.target.value)}
                            className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                        >
                            <option value="all">All Events ({eventCounts.all})</option>
                            <option value="decision">Decision Records ({eventCounts.decision})</option>
                            <option value="commit">Git Commits ({eventCounts.commit})</option>
                            <option value="component">Component Changes ({eventCounts.component})</option>
                        </select>
                    </div>

                    {/* Date Range Filters */}
                    <div className="flex-1">
                        <label className="block text-sm font-medium text-muted-foreground mb-2">
                            Start Date
                        </label>
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                    </div>

                    <div className="flex-1">
                        <label className="block text-sm font-medium text-muted-foreground mb-2">
                            End Date
                        </label>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                    </div>

                    {/* Clear Filters */}
                    {(startDate || endDate || selectedType !== "all") && (
                        <div className="flex items-end">
                            <button
                                onClick={() => {
                                    setStartDate("");
                                    setEndDate("");
                                    setSelectedType("all");
                                }}
                                className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground border border-border rounded-md hover:bg-accent transition-colors"
                            >
                                Clear Filters
                            </button>
                        </div>
                    )}
                </div>
            </Card>

            {/* Timeline */}
            <div className="space-y-4">
                {filteredEvents.length === 0 ? (
                    <Card className="p-8 text-center dark:bg-gray-900 dark:border-gray-800">
                        <p className="text-muted-foreground">
                            No events found. Try adjusting your filters.
                        </p>
                    </Card>
                ) : (
                    <div className="relative">
                        {/* Timeline line */}
                        <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-border" />

                        {/* Events */}
                        <div className="space-y-6">
                            {filteredEvents.map((event, index) => {
                                const Icon = getEventIcon(event.type);
                                const colors = getEventColor(event.type);

                                return (
                                    <div key={event.id} className="relative pl-16">
                                        {/* Icon */}
                                        <div className={`absolute left-4 w-8 h-8 rounded-full ${colors.bg} border-2 ${colors.border} flex items-center justify-center`}>
                                            <Icon className={`h-4 w-4 ${colors.icon}`} />
                                        </div>

                                        {/* Event Card */}
                                        <Card className={`p-4 dark:bg-gray-900 dark:border-gray-800 hover:shadow-md transition-shadow`}>
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className={`text-xs font-medium px-2 py-0.5 rounded ${colors.bg} ${colors.icon}`}>
                                                            {getEventTypeLabel(event.type)}
                                                        </span>
                                                        <span className="text-xs text-muted-foreground">
                                                            {format(new Date(event.timestamp), 'MMM dd, yyyy • HH:mm')}
                                                        </span>
                                                    </div>
                                                    <h3 className="font-semibold text-foreground mb-1 truncate">
                                                        {event.title}
                                                    </h3>
                                                    {event.description && (
                                                        <p className="text-sm text-muted-foreground line-clamp-2">
                                                            {event.description}
                                                        </p>
                                                    )}
                                                    {event.author && (
                                                        <p className="text-xs text-muted-foreground mt-2">
                                                            by {event.author}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </Card>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>

            {/* Summary */}
            {filteredEvents.length > 0 && (
                <Card className="p-4 dark:bg-gray-900 dark:border-gray-800">
                    <p className="text-sm text-muted-foreground text-center">
                        Showing {filteredEvents.length} of {events.length} events
                    </p>
                </Card>
            )}
        </div>
    );
}
