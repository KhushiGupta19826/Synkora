"use client";

import { useEffect, useCallback } from "react";
import { useSocket } from "./use-socket";
import { Task } from "@/types";

interface UseRealtimeKanbanProps {
    projectId: string;
    onTaskCreate?: (task: Task) => void;
    onTaskUpdate?: (task: Task) => void;
    onTaskDelete?: (taskId: string) => void;
    onTaskMove?: (taskId: string, status: string) => void;
}

export function useRealtimeKanban({
    projectId,
    onTaskCreate,
    onTaskUpdate,
    onTaskDelete,
    onTaskMove,
}: UseRealtimeKanbanProps) {
    const { socket, isConnected } = useSocket();

    useEffect(() => {
        if (!socket || !projectId) return;

        // Join the project room
        socket.emit("join-project", projectId);

        // Listen for task events
        const handleTaskCreate = (task: Task) => {
            onTaskCreate?.(task);
        };

        const handleTaskUpdate = (task: Task) => {
            onTaskUpdate?.(task);
        };

        const handleTaskDelete = ({ taskId }: { taskId: string }) => {
            onTaskDelete?.(taskId);
        };

        const handleTaskMove = ({ taskId, status }: { taskId: string; status: string }) => {
            onTaskMove?.(taskId, status);
        };

        socket.on("task:create", handleTaskCreate);
        socket.on("task:update", handleTaskUpdate);
        socket.on("task:delete", handleTaskDelete);
        socket.on("task:move", handleTaskMove);

        return () => {
            socket.off("task:create", handleTaskCreate);
            socket.off("task:update", handleTaskUpdate);
            socket.off("task:delete", handleTaskDelete);
            socket.off("task:move", handleTaskMove);
            socket.emit("leave-project", projectId);
        };
    }, [socket, projectId, onTaskCreate, onTaskUpdate, onTaskDelete, onTaskMove]);

    const broadcastTaskCreate = useCallback(
        (task: Task) => {
            if (socket && isConnected) {
                socket.emit("task:create", { projectId, task });
            }
        },
        [socket, isConnected, projectId]
    );

    const broadcastTaskUpdate = useCallback(
        (task: Task) => {
            if (socket && isConnected) {
                socket.emit("task:update", { projectId, task });
            }
        },
        [socket, isConnected, projectId]
    );

    const broadcastTaskDelete = useCallback(
        (taskId: string) => {
            if (socket && isConnected) {
                socket.emit("task:delete", { projectId, taskId });
            }
        },
        [socket, isConnected, projectId]
    );

    const broadcastTaskMove = useCallback(
        (taskId: string, status: string) => {
            if (socket && isConnected) {
                socket.emit("task:move", { projectId, taskId, status });
            }
        },
        [socket, isConnected, projectId]
    );

    return {
        isConnected,
        broadcastTaskCreate,
        broadcastTaskUpdate,
        broadcastTaskDelete,
        broadcastTaskMove,
    };
}
