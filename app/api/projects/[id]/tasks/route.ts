import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createTaskSchema = z.object({
    title: z.string().min(1, "Title is required"),
    description: z.string().optional(),
    priority: z.enum(["LOW", "MEDIUM", "HIGH"]).default("MEDIUM"),
    status: z.enum(["TODO", "IN_PROGRESS", "UNDER_REVIEW", "DONE"]).default("TODO"),
    assigneeId: z.string().optional(),
    dueDate: z.string().optional(),
});

// GET /api/projects/[id]/tasks - List all tasks for a project
export async function GET(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const projectId = params.id;

        // Check if user has access to this project
        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const project = await prisma.project.findUnique({
            where: { id: projectId },
            include: {
                team: {
                    include: {
                        members: {
                            where: {
                                userId: user.id,
                            },
                        },
                    },
                },
            },
        });

        if (!project) {
            return NextResponse.json({ error: "Project not found" }, { status: 404 });
        }

        // For personal projects, check if user is the creator
        if (!project.teamId) {
            if (project.createdById !== user.id) {
                return NextResponse.json({ error: "Access denied" }, { status: 403 });
            }
        } else {
            // For team projects, check team membership
            if (!project.team || project.team.members.length === 0) {
                return NextResponse.json({ error: "Access denied" }, { status: 403 });
            }
        }

        // Fetch all tasks for the project
        const tasks = await prisma.task.findMany({
            where: { projectId },
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
            orderBy: [{ status: "asc" }, { position: "asc" }, { createdAt: "desc" }],
        });

        return NextResponse.json(tasks);
    } catch (error) {
        console.error("Error fetching tasks:", error);
        return NextResponse.json(
            { error: "Failed to fetch tasks" },
            { status: 500 }
        );
    }
}

// POST /api/projects/[id]/tasks - Create a new task
export async function POST(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const projectId = params.id;

        // Get user
        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Check if user has access to this project
        const project = await prisma.project.findUnique({
            where: { id: projectId },
            include: {
                team: {
                    include: {
                        members: {
                            where: {
                                userId: user.id,
                            },
                        },
                    },
                },
            },
        });

        if (!project) {
            return NextResponse.json({ error: "Project not found" }, { status: 404 });
        }

        // For personal projects, check if user is the creator
        if (!project.teamId) {
            if (project.createdById !== user.id) {
                return NextResponse.json({ error: "Access denied" }, { status: 403 });
            }
        } else {
            // For team projects, check permissions
            const teamMember = project.team?.members[0];
            if (!teamMember || teamMember.role === "VIEWER") {
                return NextResponse.json(
                    { error: "Insufficient permissions" },
                    { status: 403 }
                );
            }
        }

        const body = await req.json();
        const validatedData = createTaskSchema.parse(body);

        // Get the highest position for the status
        const lastTask = await prisma.task.findFirst({
            where: {
                projectId,
                status: validatedData.status,
            },
            orderBy: { position: "desc" },
        });

        const position = lastTask ? lastTask.position + 1 : 0;

        // Create the task
        const task = await prisma.task.create({
            data: {
                title: validatedData.title,
                description: validatedData.description,
                priority: validatedData.priority,
                status: validatedData.status,
                position,
                projectId,
                assigneeId: validatedData.assigneeId,
                dueDate: validatedData.dueDate ? new Date(validatedData.dueDate) : null,
                createdById: user.id,
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
                projectId,
                type: "TASK_CREATED",
                data: {
                    taskId: task.id,
                    taskTitle: task.title,
                    userId: user.id,
                    userName: user.name || user.email,
                },
            },
        });

        return NextResponse.json(task, { status: 201 });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: "Validation error", details: error.issues },
                { status: 400 }
            );
        }
        console.error("Error creating task:", error);
        return NextResponse.json(
            { error: "Failed to create task" },
            { status: 500 }
        );
    }
}
