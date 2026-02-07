"use client";

import { Task, TaskStatus, User } from "@/types";
import { TaskCard } from "./task-card";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";

interface KanbanColumnProps {
    title: string;
    status: TaskStatus;
    tasks: (Task & { assignee?: User | null })[];
    onTaskClick?: (task: Task) => void;
}

const statusColors: Record<TaskStatus, string> = {
    TODO: "bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-600",
    IN_PROGRESS: "bg-blue-50 dark:bg-blue-950/50 border-blue-300 dark:border-blue-700",
    UNDER_REVIEW: "bg-yellow-50 dark:bg-yellow-950/50 border-yellow-300 dark:border-yellow-700",
    DONE: "bg-green-50 dark:bg-green-950/50 border-green-300 dark:border-green-700",
};

const statusTitleColors: Record<TaskStatus, string> = {
    TODO: "text-gray-700 dark:text-gray-300",
    IN_PROGRESS: "text-blue-700 dark:text-blue-300",
    UNDER_REVIEW: "text-yellow-700 dark:text-yellow-300",
    DONE: "text-green-700 dark:text-green-300",
};

export function KanbanColumn({ title, status, tasks, onTaskClick }: KanbanColumnProps) {
    const { setNodeRef, isOver } = useDroppable({
        id: status,
    });

    return (
        <div className="flex flex-col h-full min-w-[280px] w-full">
            <div className={`rounded-t-lg border-t-4 ${statusColors[status]} px-4 py-3`}>
                <div className="flex items-center justify-between">
                    <h2 className={`font-semibold text-sm ${statusTitleColors[status]}`}>{title}</h2>
                    <span className="text-xs text-muted-foreground bg-white dark:bg-gray-900 px-2 py-1 rounded-full">
                        {tasks.length}
                    </span>
                </div>
            </div>

            <div
                ref={setNodeRef}
                className={`flex-1 p-4 space-y-3 bg-gray-50 dark:bg-gray-900/50 rounded-b-lg border border-t-0 min-h-[500px] transition-colors ${isOver
                        ? "bg-gray-100 dark:bg-gray-800 border-gray-400 dark:border-gray-600"
                        : "border-gray-200 dark:border-gray-800"
                    }`}
            >
                <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
                    {tasks.map((task) => (
                        <TaskCard key={task.id} task={task} onClick={() => onTaskClick?.(task)} />
                    ))}
                </SortableContext>

                {tasks.length === 0 && (
                    <div className="flex items-center justify-center h-32 text-sm text-muted-foreground">
                        No tasks
                    </div>
                )}
            </div>
        </div>
    );
}
