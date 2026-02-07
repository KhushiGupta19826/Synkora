import { prisma } from "./prisma";
import { ActivityType } from "@prisma/client";

export async function logActivity(
    projectId: string,
    type: ActivityType,
    data: Record<string, any>
) {
    try {
        await prisma.activity.create({
            data: {
                projectId,
                type,
                data,
            },
        });
    } catch (error) {
        console.error("Error logging activity:", error);
        // Don't throw - activity logging should not break the main flow
    }
}

// Helper functions for common activity types
export async function logTaskCreated(projectId: string, taskTitle: string, createdBy: string) {
    return logActivity(projectId, "TASK_CREATED", {
        taskTitle,
        createdBy,
    });
}

export async function logTaskUpdated(projectId: string, taskTitle: string, updatedBy: string) {
    return logActivity(projectId, "TASK_UPDATED", {
        taskTitle,
        updatedBy,
    });
}

export async function logTaskCompleted(projectId: string, taskTitle: string, completedBy: string) {
    return logActivity(projectId, "TASK_COMPLETED", {
        taskTitle,
        completedBy,
    });
}

export async function logGitCommit(projectId: string, message: string, author: string) {
    return logActivity(projectId, "GIT_COMMIT", {
        message,
        author,
    });
}

export async function logMarkdownCreated(projectId: string, title: string, createdBy: string) {
    return logActivity(projectId, "MARKDOWN_CREATED", {
        title,
        createdBy,
    });
}

export async function logMarkdownUpdated(projectId: string, title: string, updatedBy: string) {
    return logActivity(projectId, "MARKDOWN_UPDATED", {
        title,
        updatedBy,
    });
}

export async function logAISuggestion(projectId: string, suggestion: string) {
    return logActivity(projectId, "AI_SUGGESTION", {
        suggestion,
    });
}

export async function logMemberJoined(projectId: string, userName: string) {
    return logActivity(projectId, "MEMBER_JOINED", {
        userName,
    });
}
