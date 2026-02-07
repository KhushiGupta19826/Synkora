"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Socket } from "socket.io-client";

interface TypingUser {
    socketId: string;
    userId: string;
    userName: string;
    timestamp: number;
}

interface UseTypingIndicatorOptions {
    socket: Socket | null;
    projectId: string;
    context: string; // e.g., 'markdown:fileId' or 'architecture-map' or 'spreadsheet'
    debounceMs?: number;
    timeoutMs?: number;
}

export function useTypingIndicator({
    socket,
    projectId,
    context,
    debounceMs = 300,
    timeoutMs = 3000,
}: UseTypingIndicatorOptions) {
    const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
    const typingTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
    const lastTypingEmitRef = useRef<number>(0);

    // Emit typing event (debounced)
    const emitTyping = useCallback(() => {
        if (!socket?.connected) return;

        const now = Date.now();
        if (now - lastTypingEmitRef.current < debounceMs) {
            return;
        }

        lastTypingEmitRef.current = now;
        socket.emit("typing:start", {
            projectId,
            context,
            timestamp: now,
        });

        // Clear existing timeout
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }

        // Stop typing after timeout
        typingTimeoutRef.current = setTimeout(() => {
            socket.emit("typing:stop", {
                projectId,
                context,
            });
        }, timeoutMs);
    }, [socket, projectId, context, debounceMs, timeoutMs]);

    // Stop typing
    const stopTyping = useCallback(() => {
        if (!socket?.connected) return;

        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }

        socket.emit("typing:stop", {
            projectId,
            context,
        });
    }, [socket, projectId, context]);

    // Listen for typing events from other users
    useEffect(() => {
        if (!socket) return;

        const handleTypingStart = (data: {
            socketId: string;
            userId: string;
            userName: string;
            context: string;
            timestamp: number;
        }) => {
            // Only show typing for the same context
            if (data.context !== context) return;

            setTypingUsers((prev) => {
                // Remove existing entry for this user
                const filtered = prev.filter((u) => u.socketId !== data.socketId);
                // Add new entry
                return [
                    ...filtered,
                    {
                        socketId: data.socketId,
                        userId: data.userId,
                        userName: data.userName,
                        timestamp: data.timestamp,
                    },
                ];
            });

            // Auto-remove after timeout
            setTimeout(() => {
                setTypingUsers((prev) =>
                    prev.filter((u) => u.socketId !== data.socketId)
                );
            }, timeoutMs);
        };

        const handleTypingStop = (data: { socketId: string; context: string }) => {
            if (data.context !== context) return;

            setTypingUsers((prev) =>
                prev.filter((u) => u.socketId !== data.socketId)
            );
        };

        socket.on("typing:start", handleTypingStart);
        socket.on("typing:stop", handleTypingStop);

        return () => {
            socket.off("typing:start", handleTypingStart);
            socket.off("typing:stop", handleTypingStop);
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
            }
        };
    }, [socket, context, timeoutMs]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            stopTyping();
        };
    }, [stopTyping]);

    return {
        typingUsers,
        emitTyping,
        stopTyping,
    };
}
