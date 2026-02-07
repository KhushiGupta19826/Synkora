'use client';

/**
 * Decision Records Page
 * 
 * Main page for viewing and managing Decision Records in a project
 */

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { DecisionRecordWithRelations } from '@/types/decision';
import { DecisionList } from '@/components/decisions/decision-list';
import { DecisionDetail } from '@/components/decisions/decision-detail';
import { CreateDecisionModal } from '@/components/decisions/create-decision-modal';
import { LinkComponentModal } from '@/components/decisions/link-component-modal';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export default function DecisionsPage() {
    const params = useParams();
    const projectId = params.projectId as string;

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [selectedDecision, setSelectedDecision] = useState<DecisionRecordWithRelations | null>(
        null
    );
    const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
    const [refreshKey, setRefreshKey] = useState(0);

    const handleDecisionCreated = () => {
        setRefreshKey((prev) => prev + 1);
    };

    const handleDecisionClick = (decision: DecisionRecordWithRelations) => {
        setSelectedDecision(decision);
    };

    const handleCloseDetail = () => {
        setSelectedDecision(null);
    };

    const handleOpenLinkModal = () => {
        setIsLinkModalOpen(true);
    };

    const handleLinksUpdated = () => {
        setRefreshKey((prev) => prev + 1);
        if (selectedDecision) {
            // Refresh the selected decision
            setSelectedDecision(null);
        }
    };

    return (
        <div className="container mx-auto py-8 px-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold">Decision Records</h1>
                    <p className="text-gray-600 mt-1">
                        Document and track architectural and engineering decisions
                    </p>
                </div>
                <Button onClick={() => setIsCreateModalOpen(true)}>Create Decision</Button>
            </div>

            {/* Content */}
            {selectedDecision ? (
                <div>
                    <Button variant="outline" onClick={handleCloseDetail} className="mb-4">
                        ← Back to List
                    </Button>
                    <div className="flex gap-4">
                        <div className="flex-1">
                            <DecisionDetail
                                decisionId={selectedDecision.id}
                                onClose={handleCloseDetail}
                            />
                        </div>
                        <div className="w-64">
                            <Card className="p-4 sticky top-4">
                                <h3 className="font-semibold mb-3">Actions</h3>
                                <div className="space-y-2">
                                    <Button
                                        variant="outline"
                                        className="w-full"
                                        onClick={handleOpenLinkModal}
                                    >
                                        Manage Components
                                    </Button>
                                </div>
                            </Card>
                        </div>
                    </div>
                </div>
            ) : (
                <DecisionList
                    key={refreshKey}
                    projectId={projectId}
                    onDecisionClick={handleDecisionClick}
                />
            )}

            {/* Modals */}
            <CreateDecisionModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                projectId={projectId}
                onDecisionCreated={handleDecisionCreated}
            />

            {selectedDecision && (
                <LinkComponentModal
                    isOpen={isLinkModalOpen}
                    onClose={() => setIsLinkModalOpen(false)}
                    decisionId={selectedDecision.id}
                    currentComponentIds={selectedDecision.linkedComponentIds || []}
                    onLinksUpdated={handleLinksUpdated}
                />
            )}
        </div>
    );
}
