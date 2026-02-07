'use client';

import { useState } from 'react';
import { Brain, AlertTriangle, GraduationCap, HelpCircle, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';

export type AIIntent = 'explain' | 'risks' | 'onboard' | 'why';

interface AIIntentButtonsProps {
    onIntentSelect: (intent: AIIntent) => void;
    disabled?: boolean;
    componentContext?: {
        componentId: string;
        componentName: string;
    };
}

interface IntentConfig {
    id: AIIntent;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    color: string;
    hoverColor: string;
    exampleQuestions: string[];
}

const intents: IntentConfig[] = [
    {
        id: 'explain',
        label: 'Explain',
        icon: Brain,
        color: 'text-blue-600 dark:text-blue-400',
        hoverColor: 'hover:bg-blue-50 dark:hover:bg-blue-950/20',
        exampleQuestions: [
            'What does this component do?',
            'How does it fit in the system?',
            'What are its responsibilities?',
        ],
    },
    {
        id: 'risks',
        label: 'Risks',
        icon: AlertTriangle,
        color: 'text-orange-600 dark:text-orange-400',
        hoverColor: 'hover:bg-orange-50 dark:hover:bg-orange-950/20',
        exampleQuestions: [
            'What risks exist here?',
            'Is this component stable?',
            'What should I watch out for?',
        ],
    },
    {
        id: 'onboard',
        label: 'Onboard',
        icon: GraduationCap,
        color: 'text-purple-600 dark:text-purple-400',
        hoverColor: 'hover:bg-purple-50 dark:hover:bg-purple-950/20',
        exampleQuestions: [
            'How do I get started?',
            'What should I learn first?',
            'Show me a learning path',
        ],
    },
    {
        id: 'why',
        label: 'Why',
        icon: HelpCircle,
        color: 'text-green-600 dark:text-green-400',
        hoverColor: 'hover:bg-green-50 dark:hover:bg-green-950/20',
        exampleQuestions: [
            'Why was this designed this way?',
            'What decisions led to this?',
            'What were the alternatives?',
        ],
    },
];

export function AIIntentButtons({ onIntentSelect, disabled, componentContext }: AIIntentButtonsProps) {
    return (
        <TooltipProvider delayDuration={300}>
            <div className="grid grid-cols-2 gap-2">
                {intents.map((intent) => {
                    const Icon = intent.icon;
                    return (
                        <Tooltip key={intent.id}>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="outline"
                                    onClick={() => onIntentSelect(intent.id)}
                                    disabled={disabled}
                                    className={`min-h-[44px] justify-start transition-all ${intent.hoverColor} border-gray-200 dark:border-gray-700`}
                                >
                                    <Icon className={`h-4 w-4 mr-2 ${intent.color}`} />
                                    <span className="font-medium">{intent.label}</span>
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent side="bottom" className="max-w-xs">
                                <div className="space-y-1">
                                    <p className="font-semibold text-xs mb-2">Example questions:</p>
                                    {intent.exampleQuestions.map((question, idx) => (
                                        <p key={idx} className="text-xs text-muted-foreground">
                                            • {question}
                                        </p>
                                    ))}
                                </div>
                            </TooltipContent>
                        </Tooltip>
                    );
                })}
            </div>
        </TooltipProvider>
    );
}
