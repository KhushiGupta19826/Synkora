"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Task, User, TaskPriority } from "@/types";
import { Calendar, Flag, User as UserIcon, Edit } from "lucide-react";
import { format } from "date-fns";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface TaskDetailModalProps {
    open: boolean;
    onOpenChange(open: boolean): void;
    task: (Task & { assignee?: User | null; createdBy?: User | null }) | null;
    onEdit?: () => void;
}

const priorityColors: Record<TaskPriority, string> = {
    LOW: "bg-blue-100 text-blue-800 border-blue-300",
    MEDIUM: "bg-yellow-100 text-yellow-800 border-yellow-300",
    HIGH: "bg-red-100 text-red-800 border-red-300",
};

const priorityLabels: Record<TaskPriority, string> = {
    LOW: "Low Priority",
    MEDIUM: "Medium Priority",
    HIGH: "High Priority",
};

const statusLabels: Record<string, string> = {
    TODO: "To Do",
    IN_PROGRESS: "In Progress",
    UNDER_REVIEW: "Under Review",
    DONE: "Done",
};

export function TaskDetailModal({ open, onOpenChange, task, onEdit }: TaskDetailModalProps) {
    if (!task) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto dark:bg-gray-950 dark:border-gray-800">
                <DialogHeader>
                    <div className="flex items-start justify-between gap-4">
                        <DialogTitle className="text-xl text-foreground">{task.title}</DialogTitle>
                        <Button variant="outline" size="sm" onClick={onEdit}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                        </Button>
                    </div>
                </DialogHeader>

                <div className="space-y-6">
                    {/* Status and Priority */}
                    <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline">{statusLabels[task.status]}</Badge>
                        <Badge className={priorityColors[task.priority]}>
                            <Flag className="h-3 w-3 mr-1" />
                            {priorityLabels[task.priority]}
                        </Badge>
                    </div>

                    {/* Description with Markdown */}
                    {task.description && (
                        <div className="space-y-2">
                            <h3 className="font-semibold text-sm">Description</h3>
                            <div className="prose prose-sm max-w-none bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border dark:border-gray-800">
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                    {task.description}
                                </ReactMarkdown>
                            </div>
                        </div>
                    )}

                    {/* Task Details */}
                    <div className="grid grid-cols-2 gap-4">
                        {/* Assignee */}
                        <div className="space-y-2">
                            <h3 className="font-semibold text-sm flex items-center gap-2">
                                <UserIcon className="h-4 w-4" />
                                Assignee
                            </h3>
                            {task.assignee ? (
                                <div className="flex items-center gap-2">
                                    <Avatar className="h-8 w-8">
                                        <AvatarImage src={task.assignee.image || undefined} />
                                        <AvatarFallback className="text-xs">
                                            {task.assignee.name?.[0] || task.assignee.email[0].toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="text-sm font-medium">
                                            {task.assignee.name || task.assignee.email}
                                        </p>
                                        {task.assignee.name && (
                                            <p className="text-xs text-muted-foreground">{task.assignee.email}</p>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <p className="text-sm text-muted-foreground">Unassigned</p>
                            )}
                        </div>

                        {/* Due Date */}
                        <div className="space-y-2">
                            <h3 className="font-semibold text-sm flex items-center gap-2">
                                <Calendar className="h-4 w-4" />
                                Due Date
                            </h3>
                            {task.dueDate ? (
                                <p className="text-sm">
                                    {format(new Date(task.dueDate), "MMMM d, yyyy")}
                                </p>
                            ) : (
                                <p className="text-sm text-muted-foreground">No due date</p>
                            )}
                        </div>
                    </div>

                    {/* Created By */}
                    {task.createdBy && (
                        <div className="space-y-2">
                            <h3 className="font-semibold text-sm">Created By</h3>
                            <div className="flex items-center gap-2">
                                <Avatar className="h-6 w-6">
                                    <AvatarFallback className="text-xs">
                                        {task.createdBy.name?.[0] || task.createdBy.email[0].toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>
                                <p className="text-sm">{task.createdBy.name || task.createdBy.email}</p>
                            </div>
                        </div>
                    )}

                    {/* Timestamps */}
                    <div className="pt-4 border-t text-xs text-muted-foreground space-y-1">
                        <p>Created: {format(new Date(task.createdAt), "PPpp")}</p>
                        <p>Last updated: {format(new Date(task.updatedAt), "PPpp")}</p>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
