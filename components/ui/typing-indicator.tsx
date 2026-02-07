"use client";

import { cn } from "@/lib/utils";

interface TypingIndicatorProps {
    userName: string;
    className?: string;
}

export function TypingIndicator({ userName, className }: TypingIndicatorProps) {
    return (
        <div className={cn("flex items-center gap-2 text-sm text-muted-foreground", className)}>
            <span>{userName} is typing</span>
            <div className="flex gap-1">
                <span className="animate-bounce" style={{ animationDelay: "0ms" }}>
                    .
                </span>
                <span className="animate-bounce" style={{ animationDelay: "150ms" }}>
                    .
                </span>
                <span className="animate-bounce" style={{ animationDelay: "300ms" }}>
                    .
                </span>
            </div>
        </div>
    );
}

interface MultipleTypingIndicatorProps {
    userNames: string[];
    className?: string;
}

export function MultipleTypingIndicator({ userNames, className }: MultipleTypingIndicatorProps) {
    if (userNames.length === 0) {
        return null;
    }

    const displayText =
        userNames.length === 1
            ? `${userNames[0]} is typing`
            : userNames.length === 2
                ? `${userNames[0]} and ${userNames[1]} are typing`
                : `${userNames[0]} and ${userNames.length - 1} others are typing`;

    return (
        <div className={cn("flex items-center gap-2 text-sm text-muted-foreground", className)}>
            <span>{displayText}</span>
            <div className="flex gap-1">
                <span className="animate-bounce" style={{ animationDelay: "0ms" }}>
                    .
                </span>
                <span className="animate-bounce" style={{ animationDelay: "150ms" }}>
                    .
                </span>
                <span className="animate-bounce" style={{ animationDelay: "300ms" }}>
                    .
                </span>
            </div>
        </div>
    );
}
