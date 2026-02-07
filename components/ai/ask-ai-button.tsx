'use client';

import { Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';

interface AskAIButtonProps {
    onClick: () => void;
    disabled?: boolean;
    variant?: 'default' | 'outline' | 'ghost';
    className?: string;
}

export function AskAIButton({ onClick, disabled, variant = 'default', className = '' }: AskAIButtonProps) {
    return (
        <TooltipProvider delayDuration={300}>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button
                        onClick={onClick}
                        disabled={disabled}
                        variant={variant}
                        className={`min-h-[44px] w-full bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white shadow-md hover:shadow-lg transition-all ${className}`}
                    >
                        <Sparkles className="h-4 w-4 mr-2" />
                        <span className="font-medium">Ask AI</span>
                    </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-xs">
                    <p className="text-xs">
                        Get AI-powered insights about this component, including explanations, risks, onboarding guidance, and design rationale.
                    </p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}
