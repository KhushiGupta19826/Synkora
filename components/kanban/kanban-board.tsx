"use client";

import { useState } from "react";
import { Task, TaskStatus, User } from "@/types";
import { KanbanColumn } from "./kanban-column";
import {
    DndContext,
    DragEndEvent,
    DragOverlay,
    DragStartEvent,
    PointerSensor,
    useSensor,
    useSensors,
    closestCorners,
} from "@dnd-kit/core";
import { TaskCard } from "./task-card";

interface KanbanBoardProps {
    projectId: string;
    initialTasks: (Task & { assignee?: User | null })[];
    onTaskMove?: (taskId: string, newStatus: TaskStatus) => Promise<void>;
    onTaskClick?: (task: Task) => void;
}

const columns: { title: string; status: TaskStatus }[] = [
    { title: "To Do", status: "TODO" },
    { title: "In Progress", status: "IN_PROGRESS" },
    { title: "Under Review", status: "UNDER_REVIEW" },
    { title: "Done", status: "DONE" },
];

export function KanbanBoard({
    projectId,
    initialTasks,
    onTaskMove,
    onTaskClick,
}: KanbanBoardProps) {
    const [activeTask, setActiveTask] = useState<Task | null>(null);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        })
    );

    const handleDragStart = (event: DragStartEvent) => {
        const task = initialTasks.find((t) => t.id === event.active.id);
        if (task) {
            setActiveTask(task);
        }
    };

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveTask(null);

        if (!over) return;

        const taskId = active.id as string;
        const newStatus = over.id as TaskStatus;

        const task = initialTasks.find((t) => t.id === taskId);
        if (!task || task.status === newStatus) return;

        // Call the parent handler which will update the state
        if (onTaskMove) {
            await onTaskMove(taskId, newStatus);
        }
    };

    const getTasksByStatus = (status: TaskStatus) => {
        return initialTasks.filter((task) => task.status === status);
    };

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
        >
            <div className="flex gap-4 overflow-x-auto pb-4">
                {columns.map((column) => (
                    <KanbanColumn
                        key={column.status}
                        title={column.title}
                        status={column.status}
                        tasks={getTasksByStatus(column.status)}
                        onTaskClick={onTaskClick}
                    />
                ))}
            </div>

            <DragOverlay>
                {activeTask ? (
                    <div className="rotate-3 scale-105">
                        <TaskCard task={activeTask} />
                    </div>
                ) : null}
            </DragOverlay>
        </DndContext>
    );
}
