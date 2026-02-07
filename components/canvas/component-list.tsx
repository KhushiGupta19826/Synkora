'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, AlertTriangle, Shield, GitCommit, FileText, MessageSquare } from 'lucide-react';
import { getComponentColorScheme, getComponentTypeLabel } from '@/lib/component-colors';
import { ComponentType } from '@/types/architecture';

interface Component {
    id: string;
    componentId: string;
    name: string;
    type: ComponentType;
    description?: string;
    _count?: {
        decisions: number;
        discussions: number;
    };
}

interface RiskMetrics {
    componentId: string;
    overallSeverity: 'low' | 'medium' | 'high' | 'critical';
    riskScore: number;
    riskFactors: Array<{
        type: string;
        severity: string;
    }>;
}

interface ComponentListProps {
    canvasId: string;
    projectId: string;
    onViewDetails: (componentId: string) => void;
}

export function ComponentList({ canvasId, projectId, onViewDetails }: ComponentListProps) {
    const [components, setComponents] = useState<Component[]>([]);
    const [riskMetrics, setRiskMetrics] = useState<Map<string, RiskMetrics>>(new Map());
    const [commitCounts, setCommitCounts] = useState<Map<string, number>>(new Map());
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchComponentsAndRisks() {
            try {
                // Fetch components
                const componentsResponse = await fetch(`/api/canvas/${canvasId}/components`);
                if (componentsResponse.ok) {
                    const componentsData = await componentsResponse.json();
                    setComponents(componentsData);

                    // Fetch risk metrics for the project
                    const risksResponse = await fetch(`/api/projects/${projectId}/risks`);
                    if (risksResponse.ok) {
                        const risksData = await risksResponse.json();
                        const risksMap = new Map<string, RiskMetrics>();
                        risksData.risks.forEach((risk: RiskMetrics) => {
                            risksMap.set(risk.componentId, risk);
                        });
                        setRiskMetrics(risksMap);
                    }

                    // Fetch commit counts
                    try {
                        const commitsResponse = await fetch(`/api/canvas/${canvasId}/components/commit-counts`);
                        if (commitsResponse.ok) {
                            const commitsData = await commitsResponse.json();
                            const commitsMap = new Map<string, number>();
                            commitsData.forEach((item: { componentId: string; count: number }) => {
                                commitsMap.set(item.componentId, item.count);
                            });
                            setCommitCounts(commitsMap);
                        }
                    } catch (error) {
                        console.error('Error fetching commit counts:', error);
                    }
                }
            } catch (error) {
                console.error('Error fetching components and risks:', error);
            } finally {
                setLoading(false);
            }
        }

        fetchComponentsAndRisks();
    }, [canvasId, projectId]);

    if (loading) {
        return (
            <div className="p-4">
                <div className="animate-pulse space-y-2">
                    <div className="h-16 bg-gray-200 rounded"></div>
                    <div className="h-16 bg-gray-200 rounded"></div>
                    <div className="h-16 bg-gray-200 rounded"></div>
                </div>
            </div>
        );
    }

    if (components.length === 0) {
        return (
            <div className="p-4 text-center text-gray-500">
                <p className="text-sm">No components yet</p>
                <p className="text-xs mt-1">Add components to the Architecture Map</p>
            </div>
        );
    }

    return (
        <div className="p-4 space-y-2">
            <h3 className="text-sm font-semibold mb-3">Components ({components.length})</h3>
            {components.map((component) => {
                const risk = riskMetrics.get(component.id);
                const hasRisk = risk && risk.riskFactors.length > 0;
                const colorScheme = getComponentColorScheme(component.type);
                const commitCount = commitCounts.get(component.id) || 0;
                const decisionCount = component._count?.decisions || 0;
                const discussionCount = component._count?.discussions || 0;

                // Determine health status
                const healthStatus = hasRisk && risk.overallSeverity === 'critical' ? 'critical' :
                    hasRisk && risk.overallSeverity === 'high' ? 'high' :
                        hasRisk && risk.overallSeverity === 'medium' ? 'medium' :
                            'healthy';

                // Health dot color
                const healthDotClass = healthStatus === 'critical' ? 'bg-red-500' :
                    healthStatus === 'high' ? 'bg-orange-500' :
                        healthStatus === 'medium' ? 'bg-yellow-500' :
                            'bg-green-500';

                // Determine border class: risk takes precedence, otherwise use component type color
                const borderClass = hasRisk && risk.overallSeverity === 'critical' ? 'border-l-4 border-l-red-600' :
                    hasRisk && risk.overallSeverity === 'high' ? 'border-l-4 border-l-orange-600' :
                        hasRisk && risk.overallSeverity === 'medium' ? 'border-l-4 border-l-yellow-600' :
                            colorScheme.borderClass;

                return (
                    <Card
                        key={component.id}
                        className={`p-3 ${borderClass} transition-all duration-200 hover:shadow-md hover:scale-[1.02] cursor-pointer relative`}
                        onClick={() => onViewDetails(component.id)}
                    >
                        {/* Health Indicator Dot */}
                        <div className="absolute top-2 right-2">
                            <div
                                className={`w-2 h-2 rounded-full ${healthDotClass}`}
                                title={`Health: ${healthStatus}`}
                            />
                        </div>

                        <div className="flex justify-between items-start pr-4">
                            <div className="flex-1">
                                <div className="flex items-center gap-2">
                                    <p className="text-sm font-medium">{component.name}</p>
                                    {hasRisk && (
                                        <AlertTriangle className={`h-3 w-3 ${risk.overallSeverity === 'critical' ? 'text-red-600' :
                                            risk.overallSeverity === 'high' ? 'text-orange-600' :
                                                risk.overallSeverity === 'medium' ? 'text-yellow-600' :
                                                    'text-gray-600'
                                            }`} />
                                    )}
                                </div>
                                <div className="flex items-center gap-2 mt-1">
                                    <Badge variant="outline" className={`text-xs ${colorScheme.badgeClass}`}>
                                        {getComponentTypeLabel(component.type)}
                                    </Badge>
                                    <span className="text-xs text-gray-500 font-mono">
                                        {component.componentId}
                                    </span>
                                </div>
                                {component.description && (
                                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                                        {component.description}
                                    </p>
                                )}

                                {/* Quick Stats Row */}
                                <div className="flex items-center gap-3 mt-2 text-xs text-gray-600">
                                    <div className="flex items-center gap-1" title="Commits">
                                        <GitCommit className="h-3 w-3" />
                                        <span>{commitCount}</span>
                                    </div>
                                    <div className="flex items-center gap-1" title="Decisions">
                                        <FileText className="h-3 w-3" />
                                        <span>{decisionCount}</span>
                                    </div>
                                    <div className="flex items-center gap-1" title="Discussions">
                                        <MessageSquare className="h-3 w-3" />
                                        <span>{discussionCount}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Card>
                );
            })}
        </div>
    );
}
