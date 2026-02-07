import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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

        const projectId = params.id;

        // Check if user has access to the project
        const project = await prisma.project.findFirst({
            where: {
                id: projectId,
                team: {
                    members: {
                        some: {
                            userId: session.user.id,
                        },
                    },
                },
            },
            include: {
                gitRepo: {
                    select: {
                        id: true,
                        githubRepoId: true,
                        owner: true,
                        name: true,
                        fullName: true,
                        lastSyncedAt: true,
                        createdAt: true,
                        updatedAt: true,
                    },
                },
            },
        });

        if (!project) {
            return NextResponse.json(
                { error: "Project not found or insufficient permissions" },
                { status: 404 }
            );
        }

        return NextResponse.json({
            gitRepo: project.gitRepo,
        });
    } catch (error) {
        console.error("Error fetching GitHub repository:", error);
        return NextResponse.json(
            { error: "Failed to fetch repository" },
            { status: 500 }
        );
    }
}

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

        const projectId = params.id;

        // Check if user has access to the project
        const project = await prisma.project.findFirst({
            where: {
                id: projectId,
                team: {
                    members: {
                        some: {
                            userId: session.user.id,
                            role: {
                                in: ["OWNER", "EDITOR"],
                            },
                        },
                    },
                },
            },
        });

        if (!project) {
            return NextResponse.json(
                { error: "Project not found or insufficient permissions" },
                { status: 404 }
            );
        }

        // Delete the GitHub repository connection
        await prisma.gitRepository.deleteMany({
            where: {
                projectId: projectId,
            },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error disconnecting GitHub repository:", error);
        return NextResponse.json(
            { error: "Failed to disconnect repository" },
            { status: 500 }
        );
    }
}
