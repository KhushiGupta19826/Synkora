import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateTeamSchema = z.object({
    name: z.string().min(1, "Team name is required").max(100).optional(),
});

// GET /api/teams/[id] - Get team details
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

        const team = await prisma.team.findFirst({
            where: {
                id: params.id,
                members: {
                    some: {
                        userId: session.user.id,
                    },
                },
            },
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
                    orderBy: {
                        role: "asc",
                    },
                },
                projects: {
                    select: {
                        id: true,
                        name: true,
                        description: true,
                        createdAt: true,
                        updatedAt: true,
                    },
                    orderBy: {
                        updatedAt: "desc",
                    },
                },
            },
        });

        if (!team) {
            return NextResponse.json(
                { error: "Team not found" },
                { status: 404 }
            );
        }

        return NextResponse.json(team);
    } catch (error) {
        console.error("Error fetching team:", error);
        return NextResponse.json(
            { error: "Failed to fetch team" },
            { status: 500 }
        );
    }
}

// PATCH /api/teams/[id] - Update team
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

        // Check if user is OWNER of the team
        const teamMember = await prisma.teamMember.findFirst({
            where: {
                teamId: params.id,
                userId: session.user.id,
                role: "OWNER",
            },
        });

        if (!teamMember) {
            return NextResponse.json(
                { error: "Access denied. Only team owners can update team details." },
                { status: 403 }
            );
        }

        const body = await request.json();
        const validatedData = updateTeamSchema.parse(body);

        const team = await prisma.team.update({
            where: {
                id: params.id,
            },
            data: validatedData,
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
                _count: {
                    select: {
                        projects: true,
                    },
                },
            },
        });

        return NextResponse.json(team);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: "Invalid input", details: error.issues },
                { status: 400 }
            );
        }

        console.error("Error updating team:", error);
        return NextResponse.json(
            { error: "Failed to update team" },
            { status: 500 }
        );
    }
}

// DELETE /api/teams/[id] - Delete team
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

        // Check if user is OWNER of the team
        const teamMember = await prisma.teamMember.findFirst({
            where: {
                teamId: params.id,
                userId: session.user.id,
                role: "OWNER",
            },
        });

        if (!teamMember) {
            return NextResponse.json(
                { error: "Access denied. Only team owners can delete teams." },
                { status: 403 }
            );
        }

        // Check if team has projects
        const projectCount = await prisma.project.count({
            where: {
                teamId: params.id,
            },
        });

        if (projectCount > 0) {
            return NextResponse.json(
                { error: "Cannot delete team with existing projects. Delete all projects first." },
                { status: 400 }
            );
        }

        await prisma.team.delete({
            where: {
                id: params.id,
            },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting team:", error);
        return NextResponse.json(
            { error: "Failed to delete team" },
            { status: 500 }
        );
    }
}
