'use client';

import { useState, useEffect } from 'react';
import { X, FileText, MessageSquare, GitCommit, AlertTriangle, AlertCircle, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { DiscussionModal } from '@/components/discussions/discussion-modal';
import { getComponentColorScheme, getComponentTypeLabel } from '@/lib/component-colors';
import { ComponentType } from '@/types/architecture';
import { AskAIButton } from '@/components/ai/ask-ai-button';
import { AIChatPanel } from '@/components/ai/ai-chat-panel';

interface ComponentDetailPanelProps {
    componentId: string;
    onClose: () => void;
}

interface RiskFactor {
    type: 'high_churn' | 'low_decision_coverage' | 'high_coupling';
    description: string;
    metric: number;
    severity: 'low' | 'medium' | 'high' | 'critical';
}

interface RiskMetrics {
    componentId: string;
    churnRate: number;
    decisionCount: number;
    couplingScore: number;
    riskFactors: RiskFactor[];
    overallSeverity: 'low' | 'medium' | 'high' | 'critical';
    riskScore: number;
}

interface ComponentData {
    id: string;
    componentId: string;
    name: string;
    type: ComponentType;
    description?: string;
    projectId: string;
    decisions: Array<{
        id: string;
        title: string;
        status: string;
        createdAt: string;
    }>;
    knowledgeArtifacts: Array<{
        id: string;
        title: string;
        type: string;
        updatedAt: string;
    }>;
    discussions: Array<{
        id: string;
        title: string;
        messageCount: number;
        updatedAt: string;
    }>;
    recentCommits: Array<{
        sha: string;
        message: string;
        author: string;
        committedAt: string;
    }>;
}

export function ComponentDetailPanel({ componentId, onClose }: ComponentDetailPanelProps) {
    const [component, setComponent] = useState<ComponentData | null>(null);
    const [riskMetrics, setRiskMetrics] = useState<RiskMetrics | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isDiscussionModalOpen, setIsDiscussionModalOpen] = useState(false);
    const [discussionCount, setDiscussionCount] = useState(0);
    const [isMobile, setIsMobile] = useState(false);
    const [isAIChatOpen, setIsAIChatOpen] = useState(false);

    // Detect mobile viewport
    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768);
        };

        checkMobile();
        window.addEventListener('resize', checkMobile);

        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    useEffect(() => {
        async function fetchComponentDetails() {
            try {
                setLoading(true);

                // Fetch component details and risk metrics in parallel
                const [detailsResponse, riskResponse] = await Promise.all([
                    fetch(`/api/components/${componentId}/relationships`),
                    fetch(`/api/components/${componentId}/risk`),
                ]);

                if (!detailsResponse.ok) {
                    throw new Error('Failed to fetch component details');
                }

                const detailsData = await detailsResponse.json();
                setComponent(detailsData);
                setDiscussionCount(detailsData.discussions?.length || 0);

                // Risk metrics are optional - don't fail if they're not available
                if (riskResponse.ok) {
                    const riskData = await riskResponse.json();
                    setRiskMetrics(riskData);
                }
            } catch (err) {
                setError(err instanceof Error ? err.message : 'An error occurred');
            } finally {
                setLoading(false);
            }
        }

        fetchComponentDetails();
    }, [componentId]);

    if (loading) {
        const LoadingContent = (
            <div className="flex items-center justify-center h-full min-h-[200px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
            </div>
        );

        if (isMobile) {
            return (
                <Sheet open={true} onOpenChange={onClose}>
                    <SheetContent side="bottom" className="p-6">
                        {LoadingContent}
                    </SheetContent>
                </Sheet>
            );
        }

        return (
            <div className="fixed right-0 top-0 h-full w-96 bg-white dark:bg-gray-950 shadow-xl border-l border-gray-200 dark:border-gray-800 p-6 overflow-y-auto z-50">
                {LoadingContent}
            </div>
        );
    }

    if (error || !component) {
        const ErrorContent = (
            <>
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-semibold">Component Details</h2>
                    <Button variant="ghost" size="sm" onClick={onClose} className="min-h-[44px] min-w-[44px]">
                        <X className="h-4 w-4" />
                    </Button>
                </div>
                <div className="text-red-600">
                    <AlertTriangle className="h-5 w-5 inline mr-2" />
                    {error || 'Component not found'}
                </div>
            </>
        );

        if (isMobile) {
            return (
                <Sheet open={true} onOpenChange={onClose}>
                    <SheetContent side="bottom" className="p-6">
                        {ErrorContent}
                    </SheetContent>
                </Sheet>
            );
        }

        return (
            <div className="fixed right-0 top-0 h-full w-96 bg-white dark:bg-gray-950 shadow-xl border-l border-gray-200 dark:border-gray-800 p-6 overflow-y-auto z-50">
                {ErrorContent}
            </div>
        );
    }

    const colorScheme = getComponentColorScheme(component.type);

    const PanelContent = (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-start">
                <div>
                    <h2 className="text-xl font-semibold">{component.name}</h2>
                    <Badge variant="outline" className={`mt-2 ${colorScheme.badgeClass}`}>
                        {getComponentTypeLabel(component.type)}
                    </Badge>
                </div>
                {!isMobile && (
                    <Button variant="ghost" size="sm" onClick={onClose} className="min-h-[44px] min-w-[44px]">
                        <X className="h-4 w-4" />
                    </Button>
                )}
            </div>

            {/* Ask AI Button */}
            <div>
                <AskAIButton
                    onClick={() => setIsAIChatOpen(true)}
                />
            </div>

            {/* Discuss Button - Touch-friendly */}
            <div>
                <Button
                    onClick={() => setIsDiscussionModalOpen(true)}
                    variant="outline"
                    className="w-full min-h-[44px]"
                    size="sm"
                >
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Discuss this component
                    {discussionCount > 0 && (
                        <Badge variant="secondary" className="ml-2">
                            {discussionCount}
                        </Badge>
                    )}
                </Button>
            </div>

            {/* Risk Indicators */}
            {riskMetrics && riskMetrics.riskFactors.length > 0 && (
                <div>
                    <h3 className="text-sm font-semibold mb-3 flex items-center">
                        <AlertCircle className="h-4 w-4 mr-2" />
                        Risk Indicators
                    </h3>
                    <Card className={`p-4 border-l-4 ${riskMetrics.overallSeverity === 'critical' ? 'border-l-red-600 bg-red-50 dark:bg-red-950/20' :
                        riskMetrics.overallSeverity === 'high' ? 'border-l-orange-600 bg-orange-50 dark:bg-orange-950/20' :
                            riskMetrics.overallSeverity === 'medium' ? 'border-l-yellow-600 bg-yellow-50 dark:bg-yellow-950/20' :
                                'border-l-green-600 bg-green-50 dark:bg-green-950/20'
                        }`}>
                        <div className="flex items-center justify-between mb-3">
                            <Badge variant={
                                riskMetrics.overallSeverity === 'critical' ? 'destructive' :
                                    riskMetrics.overallSeverity === 'high' ? 'destructive' :
                                        riskMetrics.overallSeverity === 'medium' ? 'secondary' :
                                            'default'
                            } className="text-xs uppercase">
                                {riskMetrics.overallSeverity} Risk
                            </Badge>
                            <span className="text-sm font-semibold">
                                Score: {riskMetrics.riskScore}/100
                            </span>
                        </div>
                        <div className="space-y-2">
                            {riskMetrics.riskFactors.map((factor, index) => (
                                <div key={index} className="text-sm">
                                    <div className="flex items-start gap-2">
                                        <AlertTriangle className={`h-4 w-4 mt-0.5 flex-shrink-0 ${factor.severity === 'critical' ? 'text-red-600' :
                                            factor.severity === 'high' ? 'text-orange-600' :
                                                factor.severity === 'medium' ? 'text-yellow-600' :
                                                    'text-gray-600'
                                            }`} />
                                        <span className="text-gray-700 dark:text-gray-300">{factor.description}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>
                </div>
            )}

            {/* No Risk Indicator */}
            {riskMetrics && riskMetrics.riskFactors.length === 0 && (
                <div>
                    <Card className="p-4 border-l-4 border-l-green-600 bg-green-50 dark:bg-green-950/20">
                        <div className="flex items-center gap-2">
                            <Shield className="h-4 w-4 text-green-600" />
                            <span className="text-sm font-medium text-green-800 dark:text-green-300">
                                No significant risks detected
                            </span>
                        </div>
                    </Card>
                </div>
            )}

            {/* Description */}
            {component.description && (
                <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{component.description}</p>
                </div>
            )}

            {/* Component ID */}
            <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Component ID</p>
                <code className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">{component.componentId}</code>
            </div>

            {/* Linked Decisions */}
            <div>
                <h3 className="text-sm font-semibold mb-3 flex items-center">
                    <FileText className="h-4 w-4 mr-2" />
                    Decision Records ({component.decisions.length})
                </h3>
                {component.decisions.length === 0 ? (
                    <p className="text-sm text-gray-500 dark:text-gray-400">No linked decisions</p>
                ) : (
                    <div className="space-y-2">
                        {component.decisions.map((decision) => (
                            <Card key={decision.id} className="p-3 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer min-h-[44px] flex items-center">
                                <div className="flex justify-between items-start w-full">
                                    <div className="flex-1">
                                        <p className="text-sm font-medium">{decision.title}</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                            {new Date(decision.createdAt).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <Badge variant={
                                        decision.status === 'ACCEPTED' ? 'default' :
                                            decision.status === 'PROPOSED' ? 'secondary' :
                                                'outline'
                                    } className="text-xs">
                                        {decision.status}
                                    </Badge>
                                </div>
                            </Card>
                        ))}
                    </div>
                )}
            </div>

            {/* Knowledge Artifacts */}
            <div>
                <h3 className="text-sm font-semibold mb-3 flex items-center">
                    <FileText className="h-4 w-4 mr-2" />
                    System Knowledge ({component.knowledgeArtifacts.length})
                </h3>
                {component.knowledgeArtifacts.length === 0 ? (
                    <p className="text-sm text-gray-500 dark:text-gray-400">No linked knowledge artifacts</p>
                ) : (
                    <div className="space-y-2">
                        {component.knowledgeArtifacts.map((artifact) => (
                            <Card key={artifact.id} className="p-3 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer min-h-[44px] flex items-center">
                                <div className="w-full">
                                    <p className="text-sm font-medium">{artifact.title}</p>
                                    <div className="flex justify-between items-center mt-1">
                                        <Badge variant="outline" className="text-xs">{artifact.type}</Badge>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                            {new Date(artifact.updatedAt).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                )}
            </div>

            {/* Discussions */}
            <div>
                <h3 className="text-sm font-semibold mb-3 flex items-center">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Discussions ({component.discussions.length})
                </h3>
                {component.discussions.length === 0 ? (
                    <p className="text-sm text-gray-500 dark:text-gray-400">No discussions</p>
                ) : (
                    <div className="space-y-2">
                        {component.discussions.map((discussion) => (
                            <Card key={discussion.id} className="p-3 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer min-h-[44px] flex items-center">
                                <div className="w-full">
                                    <p className="text-sm font-medium">{discussion.title}</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                        {discussion.messageCount} messages · {new Date(discussion.updatedAt).toLocaleDateString()}
                                    </p>
                                </div>
                            </Card>
                        ))}
                    </div>
                )}
            </div>

            {/* Recent Git Commits */}
            <div>
                <h3 className="text-sm font-semibold mb-3 flex items-center">
                    <GitCommit className="h-4 w-4 mr-2" />
                    Recent Commits ({component.recentCommits.length})
                </h3>
                {component.recentCommits.length === 0 ? (
                    <p className="text-sm text-gray-500 dark:text-gray-400">No recent commits</p>
                ) : (
                    <div className="space-y-2">
                        {component.recentCommits.map((commit) => (
                            <Card key={commit.sha} className="p-3 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer min-h-[44px] flex items-center">
                                <div className="w-full">
                                    <p className="text-sm font-medium truncate">{commit.message}</p>
                                    <div className="flex justify-between items-center mt-1">
                                        <p className="text-xs text-gray-500 dark:text-gray-400">{commit.author}</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                            {new Date(commit.committedAt).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <code className="text-xs text-gray-400 mt-1 block">{commit.sha.substring(0, 7)}</code>
                                </div>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );

    // Mobile: Bottom sheet (Jira-like)
    if (isMobile) {
        return (
            <>
                <Sheet open={true} onOpenChange={onClose}>
                    <SheetContent side="bottom" className="p-6">
                        <SheetHeader className="mb-6">
                            <SheetTitle>{component.name}</SheetTitle>
                        </SheetHeader>
                        {PanelContent}
                    </SheetContent>
                </Sheet>

                {/* Discussion Modal */}
                {component && (
                    <DiscussionModal
                        isOpen={isDiscussionModalOpen}
                        onClose={() => setIsDiscussionModalOpen(false)}
                        anchorType="COMPONENT"
                        anchorId={component.componentId}
                        anchorName={component.name}
                        projectId={component.projectId}
                    />
                )}
            </>
        );
    }

    // Desktop: Side panel
    return (
        <>
            <div className="fixed right-0 top-0 h-full w-96 bg-white dark:bg-gray-950 shadow-xl border-l border-gray-200 dark:border-gray-800 overflow-y-auto z-50">
                <div className="p-6">
                    {PanelContent}
                </div>
            </div>

            {/* Discussion Modal */}
            {component && (
                <DiscussionModal
                    isOpen={isDiscussionModalOpen}
                    onClose={() => setIsDiscussionModalOpen(false)}
                    anchorType="COMPONENT"
                    anchorId={component.componentId}
                    anchorName={component.name}
                    projectId={component.projectId}
                />
            )}

            {/* AI Chat Panel */}
            {component && (
                <AIChatPanel
                    isOpen={isAIChatOpen}
                    onClose={() => setIsAIChatOpen(false)}
                    componentContext={{
                        componentId: component.componentId,
                        componentName: component.name,
                        projectId: component.projectId,
                    }}
                />
            )}

            {/* AI Chat Panel */}
            {component && (
                <AIChatPanel
                    isOpen={isAIChatOpen}
                    onClose={() => setIsAIChatOpen(false)}
                    componentContext={{
                        componentId: component.componentId,
                        componentName: component.name,
                        projectId: component.projectId,
                    }}
                />
            )}
        </>
    );
}
