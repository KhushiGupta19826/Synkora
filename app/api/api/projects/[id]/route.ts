import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateProjectSchema = z.object({
    name: z.string().min(1).max(100).optional(),
    description: z.string().max(500).optional(),
});

// Helper function to check user's access to project
async function checkProjectAccess(userId: string, projectId: string) {
    const project = await prisma.project.findUnique({
        where: { id: projectId },
        include: {
            team: {
                include: {
                    members: {
                        where: {
                            userId: userId,
                        },
                    },
                },
            },
        },
    });

    if (!project) {
        return null;
    }

    // For personal projects (no team), check if user is the creator
    if (!project.teamId) {
        if (project.createdById !== userId) {
            return null;
        }
        return {
            project,
            role: "OWNER" as const, // Creator has owner role for personal projects
        };
    }

    // For team projects, check team membership
    if (!project.team || project.team.members.length === 0) {
        return null;
    }

    return {
        project,
        role: project.team.members[0].role,
    };
}

// GET /api/projects/[id] - Get project details
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const result = await checkProjectAccess(session.user.id, params.id);

        if (!result) {
            return NextResponse.json(
                { error: "Project not found or access denied" },
                { status: 404 }
            );
        }

        const project = await prisma.project.findUnique({
            where: { id: params.id },
            include: {
                team: {
                    include: {
                        members: {
                            include: {
                                user: {
                                    select: {
                                        id: true,
                                        name: true,
                                        email: true,
                                        image: true,
                                    },
                                },
                            },
                        },
                    },
                },
                _count: {
                    select: {
                        tasks: true,
                        markdownFiles: true,
                    },
                },
            },
        });

        return NextResponse.json(project);
    } catch (error) {
        console.error("Error fetching project:", error);
        return NextResponse.json(
            { error: "Failed to fetch project" },
            { status: 500 }
        );
    }
}

// PATCH /api/projects/[id] - Update project
export async function PATCH(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const result = await checkProjectAccess(session.user.id, params.id);

        if (!result) {
            return NextResponse.json(
                { error: "Project not found or access denied" },
                { status: 404 }
            );
        }

        // Only OWNER and EDITOR can update projects
        if (result.role === "VIEWER") {
            return NextResponse.json(
                { error: "You don't have permission to update this project" },
                { status: 403 }
            );
        }

        const body = await request.json();
        const validatedData = updateProjectSchema.parse(body);

        const project = await prisma.project.update({
            where: { id: params.id },
            data: validatedData,
            include: {
                team: {
                    include: {
                        members: {
                            select: {
                                id: true,
                            },
                        },
                    },
                },
                _count: {
                    select: {
                        tasks: true,
                    },
                },
            },
        });

        return NextResponse.json(project);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: "Invalid input", details: error.issues },
                { status: 400 }
            );
        }

        console.error("Error updating project:", error);
        return NextResponse.json(
            { error: "Failed to update project" },
            { status: 500 }
        );
    }
}

// DELETE /api/projects/[id] - Delete project
export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const result = await checkProjectAccess(session.user.id, params.id);

        if (!result) {
            return NextResponse.json(
                { error: "Project not found or access denied" },
                { status: 404 }
            );
        }

        // Only OWNER can delete projects
        if (result.role !== "OWNER") {
            return NextResponse.json(
                { error: "Only project owners can delete projects" },
                { status: 403 }
            );
        }

        await prisma.project.delete({
            where: { id: params.id },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting project:", error);
        return NextResponse.json(
            { error: "Failed to delete project" },
            { status: 500 }
        );
    }
}
