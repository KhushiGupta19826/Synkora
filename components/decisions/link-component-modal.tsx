'use client';

/**
 * Link Component Modal
 * 
 * Interface for linking/unlinking components to Decision Records
 */

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import toast from 'react-hot-toast';

interface LinkComponentModalProps {
    isOpen: boolean;
    onClose: () => void;
    decisionId: string;
    currentComponentIds: string[];
    onLinksUpdated?: () => void;
}

export function LinkComponentModal({
    isOpen,
    onClose,
    decisionId,
    currentComponentIds,
    onLinksUpdated,
}: LinkComponentModalProps) {
    const [componentId, setComponentId] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [linkedComponents, setLinkedComponents] = useState<string[]>(currentComponentIds);

    const handleLinkComponent = async () => {
        if (!componentId.trim()) {
            toast.error('Please enter a component ID');
            return;
        }

        if (linkedComponents.includes(componentId.trim())) {
            toast.error('Component is already linked');
            return;
        }

        setIsSubmitting(true);

        try {
            const response = await fetch(`/api/decisions/${decisionId}/link`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    componentId: componentId.trim(),
                }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to link component');
            }

            toast.success('Component linked successfully');
            setLinkedComponents([...linkedComponents, componentId.trim()]);
            setComponentId('');

            if (onLinksUpdated) {
                onLinksUpdated();
            }
        } catch (error: any) {
            console.error('Error linking component:', error);
            toast.error(error.message || 'Failed to link component');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleUnlinkComponent = async (componentIdToUnlink: string) => {
        setIsSubmitting(true);

        try {
            const response = await fetch(
                `/api/decisions/${decisionId}/link?componentId=${componentIdToUnlink}`,
                {
                    method: 'DELETE',
                }
            );

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to unlink component');
            }

            toast.success('Component unlinked successfully');
            setLinkedComponents(linkedComponents.filter((id) => id !== componentIdToUnlink));

            if (onLinksUpdated) {
                onLinksUpdated();
            }
        } catch (error: any) {
            console.error('Error unlinking component:', error);
            toast.error(error.message || 'Failed to unlink component');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Link Components to Decision</DialogTitle>
                </DialogHeader>

                <div className="space-y-6">
                    {/* Add Component */}
                    <div className="space-y-2">
                        <Label htmlFor="componentId">Add Component</Label>
                        <div className="flex gap-2">
                            <Input
                                id="componentId"
                                value={componentId}
                                onChange={(e) => setComponentId(e.target.value)}
                                placeholder="Enter Component ID (e.g., COMP-123)"
                                onKeyPress={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        handleLinkComponent();
                                    }
                                }}
                            />
                            <Button onClick={handleLinkComponent} disabled={isSubmitting}>
                                Link
                            </Button>
                        </div>
                    </div>

                    {/* Linked Components */}
                    <div className="space-y-2">
                        <Label>Linked Components ({linkedComponents.length})</Label>
                        {linkedComponents.length === 0 ? (
                            <p className="text-sm text-gray-500 py-4 text-center">
                                No components linked yet
                            </p>
                        ) : (
                            <div className="space-y-2 max-h-[300px] overflow-y-auto">
                                {linkedComponents.map((id) => (
                                    <div
                                        key={id}
                                        className="flex items-center justify-between p-3 bg-gray-50 rounded"
                                    >
                                        <Badge variant="outline">{id}</Badge>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleUnlinkComponent(id)}
                                            disabled={isSubmitting}
                                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                        >
                                            Unlink
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-2 pt-4 border-t">
                        <Button variant="outline" onClick={onClose}>
                            Done
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
