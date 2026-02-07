"use client";

import { useEffect, useState } from "react";
import { useSocket } from "@/hooks/use-socket";

interface TypingUser {
    socketId: string;
    userId: string;
    userName: string;
}

interface MarkdownTypingIndicatorProps {
    projectId: string;
    fileId: string;
}

export function MarkdownTypingIndicator({ projectId, fileId }: MarkdownTypingIndicatorProps) {
    const { socket } = useSocket({ projectId, autoConnect: false });
    const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);

    useEffect(() => {
        // Only set up listeners if socket is connected
        if (!socket?.connected) return;

        const handleTypingStart = (data: TypingUser & { context?: string }) => {
            if (data.context === `markdown:${fileId}`) {
                setTypingUsers((prev) => {
                    const exists = prev.some((u) => u.socketId === data.socketId);
                    if (exists) return prev;
                    return [...prev, { socketId: data.socketId, userId: data.userId, userName: data.userName }];
                });
            }
        };

        const handleTypingStop = (data: { socketId: string; context?: string }) => {
            if (data.context === `markdown:${fileId}`) {
                setTypingUsers((prev) => prev.filter((u) => u.socketId !== data.socketId));
            }
        };

        socket.on("typing:start", handleTypingStart);
        socket.on("typing:stop", handleTypingStop);

        return () => {
            socket.off("typing:start", handleTypingStart);
            socket.off("typing:stop", handleTypingStop);
        };
    }, [socket, fileId]);

    if (typingUsers.length === 0) return null;

    return (
        <div className="px-4 py-2 text-xs text-slate-500 border-t bg-slate-50">
            {typingUsers.length === 1 ? (
                <span>{typingUsers[0].userName} is typing...</span>
            ) : (
                <span>{typingUsers.map((u) => u.userName).join(", ")} are typing...</span>
            )}
        </div>
    );
}
