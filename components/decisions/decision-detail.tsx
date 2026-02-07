'use client';

/**
 * Decision Record Detail View
 * 
 * Displays full details of a Decision Record including linked components
 */

import { useState, useEffect } from 'react';
import { DecisionRecordWithRelations, DecisionStatus } from '@/types/decision';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MessageSquare } from 'lucide-react';
import { DiscussionModal } from '@/components/discussions/discussion-modal';
import toast from 'react-hot-toast';
import { AskAIButton } from '@/components/ai/ask-ai-button';
import { AIChatPanel } from '@/components/ai/ai-chat-panel';

interface DecisionDetailProps {
    decisionId: string;
    onClose?: () => void;
    onEdit?: (decision: DecisionRecordWithRelations) => void;
}

const statusColors: Record<DecisionStatus, string> = {
    PROPOSED: 'bg-yellow-100 text-yellow-800',
    ACCEPTED: 'bg-green-100 text-green-800',
    DEPRECATED: 'bg-gray-100 text-gray-800',
    SUPERSEDED: 'bg-red-100 text-red-800',
};

const statusLabels: Record<DecisionStatus, string> = {
    PROPOSED: 'Proposed',
    ACCEPTED: 'Accepted',
    DEPRECATED: 'Deprecated',
    SUPERSEDED: 'Superseded',
};

export function DecisionDetail({ decisionId, onClose, onEdit }: DecisionDetailProps) {
    const [decision, setDecision] = useState<DecisionRecordWithRelations | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [supersessionChain, setSupersessionChain] = useState<DecisionRecordWithRelations[]>([]);
    const [isDiscussionModalOpen, setIsDiscussionModalOpen] = useState(false);
    const [discussionCount, setDiscussionCount] = useState(0);
    const [isAIChatOpen, setIsAIChatOpen] = useState(false);

    useEffect(() => {
        fetchDecision();
    }, [decisionId]);

    const fetchDecision = async () => {
        try {
            setIsLoading(true);
            const response = await fetch(`/api/decisions/${decisionId}`);

            if (!response.ok) {
                throw new Error('Failed to fetch decision');
            }

            const data = await response.json();
            setDecision(data);

            // Fetch discussion count
            const discussionsResponse = await fetch(
                `/api/discussions?anchorType=DECISION&anchorId=${decisionId}`
            );
            if (discussionsResponse.ok) {
                const discussions = await discussionsResponse.json();
                setDiscussionCount(discussions.length);
            }

            // Fetch supersession chain if decision is superseded
            if (data.supersededBy) {
                fetchSupersessionChain();
            }
        } catch (error: any) {
            console.error('Error fetching decision:', error);
            toast.error('Failed to load decision');
        } finally {
            setIsLoading(false);
        }
    };

    const fetchSupersessionChain = async () => {
        try {
            const response = await fetch(`/api/decisions/${decisionId}?includeChain=true`);

            if (!response.ok) {
                return;
            }

            const data = await response.json();
            setSupersessionChain(data.chain || []);
        } catch (error) {
            console.error('Error fetching supersession chain:', error);
        }
    };

    const formatDate = (date: string | Date) => {
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="text-gray-500">Loading decision...</div>
            </div>
        );
    }

    if (!decision) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="text-gray-500">Decision not found</div>
            </div>
        );
    }

    return (
        <>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                            <h1 className="text-2xl font-bold">{decision.title}</h1>
                            <Badge className={statusColors[decision.status]}>
                                {statusLabels[decision.status]}
                            </Badge>
                        </div>
                        <div className="text-sm text-gray-500">
                            Created {formatDate(decision.createdAt)}
                            {decision.updatedAt !== decision.createdAt && (
                                <span> • Updated {formatDate(decision.updatedAt)}</span>
                            )}
                        </div>
                    </div>
                    <div className="flex gap-2">
                        {onEdit && (
                            <Button variant="outline" onClick={() => onEdit(decision)}>
                                Edit
                            </Button>
                        )}
                        {onClose && (
                            <Button variant="outline" onClick={onClose}>
                                Close
                            </Button>
                        )}
                    </div>
                </div>

                {/* Ask AI and Discuss Buttons */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                    <AskAIButton
                        onClick={() => setIsAIChatOpen(true)}
                    />
                    <Button
                        onClick={() => setIsDiscussionModalOpen(true)}
                        variant="outline"
                        className="min-h-[44px]"
                        size="sm"
                    >
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Discuss this decision
                        {discussionCount > 0 && (
                            <Badge variant="secondary" className="ml-2">
                                {discussionCount}
                            </Badge>
                        )}
                    </Button>
                </div>

                {/* Supersession Warning */}
                {decision.supersededBy && (
                    <Card className="p-4 bg-red-50 border-red-200">
                        <div className="flex items-start gap-2">
                            <span className="text-red-600 text-xl">⚠️</span>
                            <div>
                                <p className="font-semibold text-red-900">This decision has been superseded</p>
                                <p className="text-sm text-red-700">
                                    A newer decision has replaced this one. View the supersession chain below.
                                </p>
                            </div>
                        </div>
                    </Card>
                )}

                {/* Context */}
                <Card className="p-6">
                    <h2 className="text-lg font-semibold mb-3">Context</h2>
                    <p className="text-gray-700 whitespace-pre-wrap">{decision.context}</p>
                </Card>

                {/* Decision */}
                <Card className="p-6">
                    <h2 className="text-lg font-semibold mb-3">Decision</h2>
                    <p className="text-gray-700 whitespace-pre-wrap">{decision.decision}</p>
                </Card>

                {/* Rationale */}
                <Card className="p-6">
                    <h2 className="text-lg font-semibold mb-3">Rationale</h2>
                    <p className="text-gray-700 whitespace-pre-wrap">{decision.rationale}</p>
                </Card>

                {/* Consequences */}
                <Card className="p-6">
                    <h2 className="text-lg font-semibold mb-3">Consequences</h2>
                    <p className="text-gray-700 whitespace-pre-wrap">{decision.consequences}</p>
                </Card>

                {/* Linked Components */}
                {decision.linkedComponentIds && decision.linkedComponentIds.length > 0 && (
                    <Card className="p-6">
                        <h2 className="text-lg font-semibold mb-3">Linked Components</h2>
                        <div className="space-y-2">
                            {decision.linkedComponentIds.map((componentId) => (
                                <div
                                    key={componentId}
                                    className="flex items-center gap-2 p-2 bg-gray-50 rounded"
                                >
                                    <Badge variant="outline">{componentId}</Badge>
                                </div>
                            ))}
                        </div>
                    </Card>
                )}

                {/* Tags */}
                {decision.tags && decision.tags.length > 0 && (
                    <Card className="p-6">
                        <h2 className="text-lg font-semibold mb-3">Tags</h2>
                        <div className="flex flex-wrap gap-2">
                            {decision.tags.map((tag) => (
                                <Badge key={tag} variant="outline">
                                    {tag}
                                </Badge>
                            ))}
                        </div>
                    </Card>
                )}

                {/* Supersession Chain */}
                {supersessionChain.length > 0 && (
                    <Card className="p-6">
                        <h2 className="text-lg font-semibold mb-3">Supersession Chain</h2>
                        <div className="space-y-3">
                            {supersessionChain.map((chainDecision, index) => (
                                <div
                                    key={chainDecision.id}
                                    className={`p-3 rounded border ${chainDecision.id === decisionId
                                        ? 'bg-blue-50 border-blue-200'
                                        : 'bg-gray-50 border-gray-200'
                                        }`}
                                >
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-sm font-medium">
                                            {index === 0 ? 'Original' : index === supersessionChain.length - 1 ? 'Current' : `Version ${index + 1}`}
                                        </span>
                                        <Badge className={statusColors[chainDecision.status]}>
                                            {statusLabels[chainDecision.status]}
                                        </Badge>
                                    </div>
                                    <p className="text-sm font-semibold">{chainDecision.title}</p>
                                    <p className="text-xs text-gray-500">
                                        {formatDate(chainDecision.createdAt)}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </Card>
                )}
            </div>

            {/* Discussion Modal */}
            {
                decision && (
                    <DiscussionModal
                        isOpen={isDiscussionModalOpen}
                        onClose={() => setIsDiscussionModalOpen(false)}
                        anchorType="DECISION"
                        anchorId={decision.id}
                        anchorName={decision.title}
                        projectId={decision.projectId}
                    />
                )
            }

            {/* AI Chat Panel */}
            {decision && (
                <AIChatPanel
                    isOpen={isAIChatOpen}
                    onClose={() => setIsAIChatOpen(false)}
                    componentContext={{
                        componentId: decision.id,
                        componentName: decision.title,
                        projectId: decision.projectId,
                    }}
                />
            )}
        </>
    );
}
