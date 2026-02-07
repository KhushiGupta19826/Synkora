"use client";

import { Wifi, WifiOff, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

interface ConnectionStatusProps {
    isConnected: boolean;
    isReconnecting?: boolean;
    className?: string;
    showText?: boolean;
}

export function ConnectionStatus({
    isConnected,
    isReconnecting = false,
    className,
    showText = true,
}: ConnectionStatusProps) {
    return (
        <div
            className={cn(
                "flex items-center gap-2 text-sm",
                className
            )}
        >
            {isReconnecting ? (
                <>
                    <RefreshCw className="h-4 w-4 animate-spin text-yellow-500" />
                    {showText && (
                        <span className="text-yellow-600">Reconnecting...</span>
                    )}
                </>
            ) : isConnected ? (
                <>
                    <Wifi className="h-4 w-4 text-green-500" />
                    {showText && (
                        <span className="text-green-600">Connected</span>
                    )}
                </>
            ) : (
                <>
                    <WifiOff className="h-4 w-4 text-red-500" />
                    {showText && (
                        <span className="text-red-600">Disconnected</span>
                    )}
                </>
            )}
        </div>
    );
}
