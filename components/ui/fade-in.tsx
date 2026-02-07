"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface FadeInProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
    delay?: number;
    duration?: number;
}

/**
 * FadeIn component for smooth content appearance
 * Uses 300ms ease-out animation as per design system
 */
const FadeIn = React.forwardRef<HTMLDivElement, FadeInProps>(
    ({ className, children, delay = 0, duration = 300, ...props }, ref) => {
        return (
            <div
                ref={ref}
                className={cn("animate-fade-in", className)}
                style={{
                    animationDelay: `${delay}ms`,
                    animationDuration: `${duration}ms`,
                }}
                {...props}
            >
                {children}
            </div>
        );
    }
);
FadeIn.displayName = "FadeIn";

export { FadeIn };
