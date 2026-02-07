"use client";

import { Task, User, TaskPriority } from "@/types";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Calendar, Flag } from "lucide-react";
import { format } from "date-fns";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface TaskCardProps {
    task: Task & { assignee?: User | null };
    onClick?: () => void;
}

const priorityColors: Record<TaskPriority, string> = {
    LOW: "text-blue-600 dark:text-blue-400",
    MEDIUM: "text-yellow-600 dark:text-yellow-400",
    HIGH: "text-red-600 dark:text-red-400",
};

const priorityLabels: Record<TaskPriority, string> = {
    LOW: "Low",
    MEDIUM: "Medium",
    HIGH: "High",
};

export function TaskCard({ task, onClick }: TaskCardProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: task.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <Card
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            className="p-4 cursor-pointer hover:shadow-md dark:hover:shadow-lime-500/10 transition-shadow bg-white dark:bg-gray-950 border-gray-200 dark:border-gray-800"
            onClick={onClick}
        >
            <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-sm line-clamp-2">{task.title}</h3>
                    <Flag
                        className={`h-4 w-4 flex-shrink-0 ${priorityColors[task.priority]}`}
                        fill="currentColor"
                    />
                </div>

                {task.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2">
                        {task.description}
                    </p>
                )}

                <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                        {task.assignee && (
                            <Avatar className="h-6 w-6">
                                <AvatarImage src={task.assignee.image || undefined} />
                                <AvatarFallback className="text-xs">
                                    {task.assignee.name?.[0] || task.assignee.email[0].toUpperCase()}
                                </AvatarFallback>
                            </Avatar>
                        )}
                    </div>

                    {task.dueDate && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            <span>{format(new Date(task.dueDate), "MMM d")}</span>
                        </div>
                    )}
                </div>

                <Badge variant="outline" className="text-xs">
                    {priorityLabels[task.priority]}
                </Badge>
            </div>
        </Card>
    );
}
