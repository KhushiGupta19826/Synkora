import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateTaskSchema = z.object({
    title: z.string().min(1).optional(),
    description: z.string().optional(),
    priority: z.enum(["LOW", "MEDIUM", "HIGH"]).optional(),
    status: z.enum(["TODO", "IN_PROGRESS", "UNDER_REVIEW", "DONE"]).optional(),
    assigneeId: z.string().nullable().optional(),
    dueDate: z.string().nullable().optional(),
});

// PATCH /api/tasks/[id] - Update a task
export async function PATCH(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const taskId = params.id;

        // Get the task and check permissions
        const task = await prisma.task.findUnique({
            where: { id: taskId },
            include: {
                project: {
                    include: {
                        team: {
                            include: {
                                members: {
                                    where: {
                                        user: { email: session.user.email },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        });

        if (!task) {
            return NextResponse.json({ error: "Task not found" }, { status: 404 });
        }

        // Check permissions - allow if no team (personal project) or if user is a team member with edit rights
        if (task.project.team) {
            const teamMember = task.project.team.members[0];
            if (!teamMember || teamMember.role === "VIEWER") {
                return NextResponse.json(
                    { error: "Insufficient permissions" },
                    { status: 403 }
                );
            }
        }

        const body = await req.json();
        const validatedData = updateTaskSchema.parse(body);

        // If status is changing, update position
        let position = task.position;
        if (validatedData.status && validatedData.status !== task.status) {
            const lastTask = await prisma.task.findFirst({
                where: {
                    projectId: task.projectId,
                    status: validatedData.status,
                },
                orderBy: { position: "desc" },
            });
            position = lastTask ? lastTask.position + 1 : 0;
        }

        // Update the task
        const updatedTask = await prisma.task.update({
            where: { id: taskId },
            data: {
                title: validatedData.title,
                description: validatedData.description,
                priority: validatedData.priority,
                status: validatedData.status,
                position: validatedData.status ? position : undefined,
                assigneeId: validatedData.assigneeId === null ? null : validatedData.assigneeId,
                dueDate:
                    validatedData.dueDate === null
                        ? null
                        : validatedData.dueDate
                            ? new Date(validatedData.dueDate)
                            : undefined,
            },
            include: {
                assignee: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        image: true,
                    },
                },
                createdBy: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
        });

        // Log activity
        await prisma.activity.create({
            data: {
                projectId: task.projectId,
                type: "TASK_UPDATED",
                data: {
                    taskId: updatedTask.id,
                    taskTitle: updatedTask.title,
                    changes: validatedData,
                },
            },
        });

        // Check if task is completed
        if (validatedData.status === "DONE" && task.status !== "DONE") {
            await prisma.activity.create({
                data: {
                    projectId: task.projectId,
                    type: "TASK_COMPLETED",
                    data: {
                        taskId: updatedTask.id,
                        taskTitle: updatedTask.title,
                    },
                },
            });
        }

        return NextResponse.json(updatedTask);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: "Validation error", details: error.issues },
                { status: 400 }
            );
        }
        console.error("Error updating task:", error);
        return NextResponse.json(
            { error: "Failed to update task" },
            { status: 500 }
        );
    }
}

// DELETE /api/tasks/[id] - Delete a task
export async function DELETE(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const taskId = params.id;

        // Get the task and check permissions
        const task = await prisma.task.findUnique({
            where: { id: taskId },
            include: {
                project: {
                    include: {
                        team: {
                            include: {
                                members: {
                                    where: {
                                        user: { email: session.user.email },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        });

        if (!task) {
            return NextResponse.json({ error: "Task not found" }, { status: 404 });
        }
        else if (!task.project) {
            return NextResponse.json({error: "Task project not found"}, {status: 404});
        }
        else if (!task.project.team) {
            return NextResponse.json({error: "Task project team not found"}, {status: 404});
        }
        else if (!task.project.team.members) {
            return NextResponse.json({error: "Task project team members not found"}, {status: 404});
        }
        const teamMember = task.project.team.members[0];
        if (!teamMember || teamMember.role === "VIEWER") {
            return NextResponse.json(
                { error: "Insufficient permissions" },
                { status: 403 }
            );
        }

        // Delete the task
        await prisma.task.delete({
            where: { id: taskId },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting task:", error);
        return NextResponse.json(
            { error: "Failed to delete task" },
            { status: 500 }
        );
    }
}
