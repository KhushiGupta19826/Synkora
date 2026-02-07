import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createMarkdownSchema = z.object({
    title: z.string().min(1, "Title is required"),
    content: z.string().default(""),
    linkedComponentIds: z.array(z.string()).optional().default([]),
    linkedDecisionIds: z.array(z.string()).optional().default([]),
});

// GET /api/projects/[id]/markdown - List all markdown files for a project
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

        // Check access: personal project creator or team member
        const hasAccess = !project.teamId
            ? project.createdById === user.id
            : project.team?.members && project.team.members.length > 0;

        if (!hasAccess) {
            return NextResponse.json({ error: "Access denied" }, { status: 403 });
        }

        // Fetch all markdown files for the project
        const markdownFiles = await prisma.markdownFile.findMany({
            where: { projectId },
            select: {
                id: true,
                title: true,
                createdAt: true,
                updatedAt: true,
                componentMarkdowns: {
                    select: {
                        component: {
                            select: {
                                id: true,
                                name: true,
                            },
                        },
                    },
                },
                decisionMarkdowns: {
                    select: {
                        decision: {
                            select: {
                                id: true,
                                title: true,
                            },
                        },
                    },
                },
            },
            orderBy: { updatedAt: "desc" },
        });

        // Transform to include orphan status
        const filesWithOrphanStatus = markdownFiles.map(file => ({
            id: file.id,
            title: file.title,
            createdAt: file.createdAt,
            updatedAt: file.updatedAt,
            isOrphaned: file.componentMarkdowns.length === 0 && file.decisionMarkdowns.length === 0,
            linkedComponents: file.componentMarkdowns.map(cm => cm.component),
            linkedDecisions: file.decisionMarkdowns.map(dm => dm.decision),
        }));

        return NextResponse.json(filesWithOrphanStatus);
    } catch (error) {
        console.error("Error fetching markdown files:", error);
        return NextResponse.json(
            { error: "Failed to fetch markdown files" },
            { status: 500 }
        );
    }
}

// POST /api/projects/[id]/markdown - Create a new markdown file
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

        // Check access and permissions
        let hasWriteAccess = false;
        if (!project.teamId) {
            // Personal project: only creator can edit
            hasWriteAccess = project.createdById === user.id;
        } else {
            // Team project: check role
            const member = project.team?.members[0];
            hasWriteAccess = !member ? false : member && member.role !== 'VIEWER';
        }

        if (!hasWriteAccess) {
            return NextResponse.json(
                { error: "Insufficient permissions" },
                { status: 403 }
            );
        }

        const body = await req.json();
        const validatedData = createMarkdownSchema.parse(body);

        // Create the markdown file
        const markdownFile = await prisma.markdownFile.create({
            data: {
                title: validatedData.title,
                content: validatedData.content,
                projectId,
            },
        });

        // Link to components if provided
        if (validatedData.linkedComponentIds.length > 0) {
            await prisma.componentMarkdown.createMany({
                data: validatedData.linkedComponentIds.map(componentId => ({
                    componentId,
                    markdownId: markdownFile.id,
                })),
            });
        }

        // Link to decisions if provided
        if (validatedData.linkedDecisionIds.length > 0) {
            await prisma.decisionMarkdown.createMany({
                data: validatedData.linkedDecisionIds.map(decisionId => ({
                    decisionId,
                    markdownId: markdownFile.id,
                })),
            });
        }

        // Log activity
        await prisma.activity.create({
            data: {
                projectId,
                type: "MARKDOWN_CREATED",
                data: {
                    fileId: markdownFile.id,
                    fileTitle: markdownFile.title,
                    userId: user.id,
                    userName: user.name || user.email,
                },
            },
        });

        return NextResponse.json(markdownFile, { status: 201 });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: "Validation error", details: error.issues },
                { status: 400 }
            );
        }
        console.error("Error creating markdown file:", error);
        return NextResponse.json(
            { error: "Failed to create markdown file" },
            { status: 500 }
        );
    }
}
