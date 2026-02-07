'use client';

import { useState, useEffect } from 'react';
import { X, Send, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import toast from 'react-hot-toast';

interface DiscussionModalProps {
    isOpen: boolean;
    onClose: () => void;
    anchorType: 'COMPONENT' | 'DECISION' | 'COMMIT' | 'PULL_REQUEST';
    anchorId: string;
    anchorName: string;
    projectId: string;
}

interface Discussion {
    id: string;
    title: string;
    createdAt: string;
    updatedAt: string;
    messages: Message[];
    messageCount?: number;
}

interface Message {
    id: string;
    authorId: string;
    content: string;
    createdAt: string;
}

export function DiscussionModal({
    isOpen,
    onClose,
    anchorType,
    anchorId,
    anchorName,
    projectId,
}: DiscussionModalProps) {
    const [discussions, setDiscussions] = useState<Discussion[]>([]);
    const [selectedDiscussion, setSelectedDiscussion] = useState<Discussion | null>(null);
    const [newDiscussionTitle, setNewDiscussionTitle] = useState('');
    const [newMessage, setNewMessage] = useState('');
    const [isCreatingDiscussion, setIsCreatingDiscussion] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            fetchDiscussions();
        }
    }, [isOpen, anchorType, anchorId]);

    const fetchDiscussions = async () => {
        try {
            setLoading(true);
            const response = await fetch(
                `/api/discussions?anchorType=${anchorType}&anchorId=${anchorId}&projectId=${projectId}`
            );

            if (!response.ok) {
                throw new Error('Failed to fetch discussions');
            }

            const data = await response.json();
            setDiscussions(data);
        } catch (error) {
            console.error('Error fetching discussions:', error);
            toast.error('Failed to load discussions');
        } finally {
            setLoading(false);
        }
    };

    const createDiscussion = async () => {
        if (!newDiscussionTitle.trim()) {
            toast.error('Please enter a discussion title');
            return;
        }

        try {
            const response = await fetch('/api/discussions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    projectId,
                    title: newDiscussionTitle,
                    anchorType,
                    anchorId,
                    initialMessage: newMessage.trim() || undefined,
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to create discussion');
            }

            const newDiscussion = await response.json();
            setDiscussions([newDiscussion, ...discussions]);
            setNewDiscussionTitle('');
            setNewMessage('');
            setIsCreatingDiscussion(false);
            setSelectedDiscussion(newDiscussion);
            toast.success('Discussion created');
        } catch (error) {
            console.error('Error creating discussion:', error);
            toast.error('Failed to create discussion');
        }
    };

    const sendMessage = async () => {
        if (!selectedDiscussion || !newMessage.trim()) {
            return;
        }

        try {
            const response = await fetch(`/api/discussions/${selectedDiscussion.id}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: newMessage }),
            });

            if (!response.ok) {
                throw new Error('Failed to send message');
            }

            const message = await response.json();
            setSelectedDiscussion({
                ...selectedDiscussion,
                messages: [...selectedDiscussion.messages, message],
            });
            setNewMessage('');
            toast.success('Message sent');
        } catch (error) {
            console.error('Error sending message:', error);
            toast.error('Failed to send message');
        }
    };

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl h-[80vh] flex flex-col">
                {/* Header */}
                <div className="p-4 border-b flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-semibold flex items-center gap-2">
                            <MessageSquare className="h-5 w-5" />
                            Discussions
                        </h2>
                        <p className="text-sm text-gray-500 mt-1">
                            {anchorType.toLowerCase()}: {anchorName}
                        </p>
                    </div>
                    <Button variant="ghost" size="sm" onClick={onClose}>
                        <X className="h-4 w-4" />
                    </Button>
                </div>

                <div className="flex-1 flex overflow-hidden">
                    {/* Discussion List */}
                    <div className="w-1/3 border-r overflow-y-auto">
                        <div className="p-4">
                            <Button
                                onClick={() => setIsCreatingDiscussion(true)}
                                className="w-full mb-4"
                                size="sm"
                            >
                                New Discussion
                            </Button>

                            {loading ? (
                                <div className="text-center text-gray-500 py-8">
                                    Loading...
                                </div>
                            ) : discussions.length === 0 ? (
                                <div className="text-center text-gray-500 py-8">
                                    <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                    <p className="text-sm">No discussions yet</p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {discussions.map((discussion) => (
                                        <Card
                                            key={discussion.id}
                                            className={`p-3 cursor-pointer hover:bg-gray-50 ${selectedDiscussion?.id === discussion.id
                                                ? 'bg-emerald-50 border-emerald-200'
                                                : ''
                                                }`}
                                            onClick={() => setSelectedDiscussion(discussion)}
                                        >
                                            <p className="font-medium text-sm">{discussion.title}</p>
                                            <p className="text-xs text-gray-500 mt-1">
                                                {discussion.messageCount || discussion.messages.length} messages
                                                {' · '}
                                                {formatDate(discussion.updatedAt)}
                                            </p>
                                        </Card>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Discussion Content */}
                    <div className="flex-1 flex flex-col">
                        {isCreatingDiscussion ? (
                            <div className="p-6">
                                <h3 className="text-lg font-semibold mb-4">New Discussion</h3>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-2">
                                            Title
                                        </label>
                                        <input
                                            type="text"
                                            value={newDiscussionTitle}
                                            onChange={(e) => setNewDiscussionTitle(e.target.value)}
                                            className="w-full px-3 py-2 border rounded-md"
                                            placeholder="Enter discussion title"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-2">
                                            Initial Message (optional)
                                        </label>
                                        <textarea
                                            value={newMessage}
                                            onChange={(e) => setNewMessage(e.target.value)}
                                            className="w-full px-3 py-2 border rounded-md h-32"
                                            placeholder="Start the discussion..."
                                        />
                                    </div>
                                    <div className="flex gap-2">
                                        <Button onClick={createDiscussion}>
                                            Create Discussion
                                        </Button>
                                        <Button
                                            variant="outline"
                                            onClick={() => {
                                                setIsCreatingDiscussion(false);
                                                setNewDiscussionTitle('');
                                                setNewMessage('');
                                            }}
                                        >
                                            Cancel
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ) : selectedDiscussion ? (
                            <>
                                {/* Messages */}
                                <div className="flex-1 overflow-y-auto p-6">
                                    <h3 className="text-lg font-semibold mb-4">
                                        {selectedDiscussion.title}
                                    </h3>
                                    <div className="space-y-4">
                                        {selectedDiscussion.messages.map((message) => (
                                            <Card key={message.id} className="p-4">
                                                <p className="text-sm whitespace-pre-wrap">
                                                    {message.content}
                                                </p>
                                                <p className="text-xs text-gray-500 mt-2">
                                                    {formatDate(message.createdAt)}
                                                </p>
                                            </Card>
                                        ))}
                                    </div>
                                </div>

                                {/* Message Input */}
                                <div className="p-4 border-t">
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={newMessage}
                                            onChange={(e) => setNewMessage(e.target.value)}
                                            onKeyPress={(e) => {
                                                if (e.key === 'Enter' && !e.shiftKey) {
                                                    e.preventDefault();
                                                    sendMessage();
                                                }
                                            }}
                                            className="flex-1 px-3 py-2 border rounded-md"
                                            placeholder="Type a message..."
                                        />
                                        <Button onClick={sendMessage} disabled={!newMessage.trim()}>
                                            <Send className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="flex-1 flex items-center justify-center text-gray-500">
                                <div className="text-center">
                                    <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
                                    <p>Select a discussion or create a new one</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
