"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, ActivityType } from "@prisma/client";
import {
    CheckCircle2,
    FileText,
    GitCommit,
    Lightbulb,
    ListTodo,
    UserPlus,
    Edit
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface ActivityFeedProps {
    activities: (Activity & {
        project: {
            name: string;
        };
    })[];
}

function getActivityIcon(type: ActivityType) {
    switch (type) {
        case "TASK_CREATED":
            return <ListTodo className="h-4 w-4" />;
        case "TASK_UPDATED":
            return <Edit className="h-4 w-4" />;
        case "TASK_COMPLETED":
            return <CheckCircle2 className="h-4 w-4" />;
        case "GIT_COMMIT":
            return <GitCommit className="h-4 w-4" />;
        case "MARKDOWN_CREATED":
        case "MARKDOWN_UPDATED":
            return <FileText className="h-4 w-4" />;
        case "AI_SUGGESTION":
            return <Lightbulb className="h-4 w-4" />;
        case "MEMBER_JOINED":
            return <UserPlus className="h-4 w-4" />;
        default:
            return <ListTodo className="h-4 w-4" />;
    }
}

function getActivityMessage(activity: Activity): string {
    const data = activity.data as any;

    switch (activity.type) {
        case "TASK_CREATED":
            return `Task "${data.taskTitle}" was created`;
        case "TASK_UPDATED":
            return `Task "${data.taskTitle}" was updated`;
        case "TASK_COMPLETED":
            return `Task "${data.taskTitle}" was completed`;
        case "GIT_COMMIT":
            return `New commit: ${data.message}`;
        case "MARKDOWN_CREATED":
            return `Document "${data.title}" was created`;
        case "MARKDOWN_UPDATED":
            return `Document "${data.title}" was updated`;
        case "AI_SUGGESTION":
            return `AI suggested: ${data.suggestion}`;
        case "MEMBER_JOINED":
            return `${data.userName} joined the project`;
        default:
            return "Activity occurred";
    }
}

export function ActivityFeed({ activities }: ActivityFeedProps) {
    if (activities.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Recent Activity</CardTitle>
                    <CardDescription>Stay updated with your team's work</CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground text-center py-8">
                        No recent activity to display
                    </p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Stay updated with your team's work</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {activities.map((activity) => (
                        <div key={activity.id} className="flex items-start gap-3">
                            <div className="mt-1 rounded-full bg-primary/10 p-2 text-primary">
                                {getActivityIcon(activity.type)}
                            </div>
                            <div className="flex-1 space-y-1">
                                <p className="text-sm font-medium leading-none">
                                    {getActivityMessage(activity)}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    {activity.project.name} • {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
