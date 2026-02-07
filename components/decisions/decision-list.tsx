'use client';

/**
 * Decision Record List
 * 
 * Displays a list of Decision Records with filtering by status
 */

import { useState, useEffect } from 'react';
import { DecisionRecordWithRelations, DecisionStatus } from '@/types/decision';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FadeIn } from '@/components/ui/fade-in';
import toast from 'react-hot-toast';

interface DecisionListProps {
    projectId: string;
    onDecisionClick?: (decision: DecisionRecordWithRelations) => void;
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

export function DecisionList({ projectId, onDecisionClick }: DecisionListProps) {
    const [decisions, setDecisions] = useState<DecisionRecordWithRelations[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState<DecisionStatus | 'ALL'>('ALL');

    useEffect(() => {
        fetchDecisions();
    }, [projectId, statusFilter]);

    const fetchDecisions = async () => {
        try {
            setIsLoading(true);
            const url =
                statusFilter === 'ALL'
                    ? `/api/projects/${projectId}/decisions`
                    : `/api/projects/${projectId}/decisions?status=${statusFilter}`;

            const response = await fetch(url);

            if (!response.ok) {
                throw new Error('Failed to fetch decisions');
            }

            const data = await response.json();
            setDecisions(data);
        } catch (error: any) {
            console.error('Error fetching decisions:', error);
            toast.error('Failed to load decisions');
        } finally {
            setIsLoading(false);
        }
    };

    const formatDate = (date: string | Date) => {
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="text-gray-500">Loading decisions...</div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Filter Bar */}
            <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-medium">Filter by status:</span>
                <Button
                    variant={statusFilter === 'ALL' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setStatusFilter('ALL')}
                >
                    All ({decisions.length})
                </Button>
                {(['PROPOSED', 'ACCEPTED', 'DEPRECATED', 'SUPERSEDED'] as DecisionStatus[]).map(
                    (status) => (
                        <Button
                            key={status}
                            variant={statusFilter === status ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setStatusFilter(status)}
                        >
                            {statusLabels[status]}
                        </Button>
                    )
                )}
            </div>

            {/* Decision List */}
            {decisions.length === 0 ? (
                <Card className="p-8 text-center">
                    <p className="text-gray-500">
                        {statusFilter === 'ALL'
                            ? 'No decisions yet. Create your first decision record.'
                            : `No ${statusLabels[statusFilter].toLowerCase()} decisions found.`}
                    </p>
                </Card>
            ) : (
                <div className="space-y-3">
                    {decisions.map((decision, index) => (
                        <FadeIn key={decision.id} delay={index * 50}>
                            <Card
                                className="p-4 hover:shadow-md transition-shadow cursor-pointer"
                                onClick={() => onDecisionClick?.(decision)}
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-2">
                                            <h3 className="font-semibold text-lg truncate">{decision.title}</h3>
                                            <Badge className={statusColors[decision.status]}>
                                                {statusLabels[decision.status]}
                                            </Badge>
                                        </div>

                                        <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                                            {decision.context}
                                        </p>

                                        <div className="flex items-center gap-4 text-xs text-gray-500">
                                            <span>Created {formatDate(decision.createdAt)}</span>
                                            {decision.linkedComponentIds && decision.linkedComponentIds.length > 0 && (
                                                <span>
                                                    {decision.linkedComponentIds.length} component
                                                    {decision.linkedComponentIds.length !== 1 ? 's' : ''}
                                                </span>
                                            )}
                                            {decision.tags && decision.tags.length > 0 && (
                                                <div className="flex gap-1">
                                                    {decision.tags.slice(0, 3).map((tag) => (
                                                        <Badge key={tag} variant="outline" className="text-xs">
                                                            {tag}
                                                        </Badge>
                                                    ))}
                                                    {decision.tags.length > 3 && (
                                                        <Badge variant="outline" className="text-xs">
                                                            +{decision.tags.length - 3}
                                                        </Badge>
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        {decision.supersededBy && (
                                            <div className="mt-2 text-xs text-red-600">
                                                ⚠️ Superseded by another decision
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </Card>
                        </FadeIn>
                    ))}
                </div>
            )}
        </div>
    );
}
