'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { AIIntentButtons, AIIntent } from './ai-intent-buttons';
import { AIMessage } from './ai-message';

interface AIChatPanelProps {
    isOpen: boolean;
    onClose: () => void;
    componentContext?: {
        componentId: string;
        componentName: string;
        projectId: string;
    };
}

interface Message {
    id: string;
    type: 'user' | 'ai';
    content: string;
    timestamp: Date;
    intent?: AIIntent;
    context?: {
        componentsUsed: number;
        decisionsUsed: number;
        commitsUsed: number;
        sources: {
            components: Array<{
                id: string;
                componentId: string;
                name: string;
                type: string;
            }>;
            decisions: Array<{
                id: string;
                title: string;
                status: string;
            }>;
        };
    };
}

export function AIChatPanel({ isOpen, onClose, componentContext }: AIChatPanelProps) {
    const [loading, setLoading] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);

    const handleIntentSelect = async (intent: AIIntent) => {
        setLoading(true);

        // Get intent label for user message
        const intentLabels: Record<AIIntent, string> = {
            explain: 'Explain this system',
            risks: 'What risks exist?',
            onboard: 'Onboard a new engineer',
            why: 'Why was this design chosen?',
        };

        // Add user message
        const userMessage: Message = {
            id: `user-${Date.now()}`,
            type: 'user',
            content: intentLabels[intent],
            timestamp: new Date(),
            intent,
        };
        setMessages(prev => [...prev, userMessage]);

        try {
            // Map intent to API format
            const intentMap: Record<AIIntent, string> = {
                explain: 'explain_system',
                risks: 'identify_risks',
                onboard: 'onboard_engineer',
                why: 'why_design_chosen',
            };

            const apiIntent = intentMap[intent];

            const res = await fetch(`/api/projects/${componentContext?.projectId}/system-intelligence`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    intent: apiIntent,
                    context: componentContext ? {
                        componentId: componentContext.componentId,
                    } : undefined,
                }),
            });

            if (!res.ok) {
                throw new Error('Failed to get AI response');
            }

            const data = await res.json();

            // Add AI response message with context
            const aiMessage: Message = {
                id: `ai-${Date.now()}`,
                type: 'ai',
                content: data.response || 'No response received from AI.',
                timestamp: new Date(),
                context: data.context,
            };
            setMessages(prev => [...prev, aiMessage]);
        } catch (error) {
            console.error('Error getting AI response:', error);

            // Add error message
            const errorMessage: Message = {
                id: `ai-error-${Date.now()}`,
                type: 'ai',
                content: 'Sorry, I encountered an error processing your request. Please try again.',
                timestamp: new Date(),
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setMessages([]);
        onClose();
    };

    const formatTimestamp = (date: Date) => {
        return date.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
        });
    };

    return (
        <Sheet open={isOpen} onOpenChange={handleClose}>
            <SheetContent side="right" className="w-full sm:w-[540px] sm:max-w-[540px] p-0 overflow-hidden">
                <div className="flex flex-col h-full">
                    {/* Header */}
                    <SheetHeader className="px-6 py-4 border-b border-gray-200 dark:border-gray-800">
                        <div className="flex items-center justify-between">
                            <SheetTitle className="text-lg font-semibold">
                                {componentContext ? `AI Assistant: ${componentContext.componentName}` : 'AI Assistant'}
                            </SheetTitle>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleClose}
                                className="min-h-[44px] min-w-[44px]"
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    </SheetHeader>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-6">
                        {/* Intent Buttons */}
                        <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                                What would you like to know?
                            </p>
                            <AIIntentButtons
                                onIntentSelect={handleIntentSelect}
                                disabled={loading}
                                componentContext={componentContext}
                            />
                        </div>

                        {/* Messages */}
                        {messages.length > 0 && (
                            <div className="space-y-4">
                                {messages.map((message) => (
                                    message.type === 'user' ? (
                                        <div
                                            key={message.id}
                                            className="flex justify-end animate-in fade-in slide-in-from-bottom-2 duration-300"
                                        >
                                            <div
                                                className="group relative max-w-[85%] rounded-2xl px-4 py-3 shadow-sm bg-[#B8FF14] text-black"
                                            >
                                                <div className="whitespace-pre-wrap text-sm leading-relaxed">
                                                    {message.content}
                                                </div>
                                                {/* Timestamp on hover */}
                                                <div className="absolute -bottom-6 right-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-xs text-gray-500 dark:text-gray-400">
                                                    {formatTimestamp(message.timestamp)}
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <AIMessage
                                            key={message.id}
                                            content={message.content}
                                            timestamp={message.timestamp}
                                            context={message.context}
                                            projectId={componentContext?.projectId}
                                        />
                                    )
                                ))}
                            </div>
                        )}

                        {/* Typing Indicator */}
                        {loading && (
                            <div className="flex justify-start animate-in fade-in slide-in-from-bottom-2 duration-300">
                                <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl px-5 py-3 shadow-sm">
                                    <div className="flex items-center space-x-1.5">
                                        <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms', animationDuration: '1s' }}></div>
                                        <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms', animationDuration: '1s' }}></div>
                                        <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms', animationDuration: '1s' }}></div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Empty State */}
                        {!loading && messages.length === 0 && (
                            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                                <p className="text-sm">
                                    Select an option above to get AI-powered insights
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
}
