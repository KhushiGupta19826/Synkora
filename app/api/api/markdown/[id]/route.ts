import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateMarkdownSchema = z.object({
    title: z.string().min(1).optional(),
    content: z.string().optional(),
});

// Helper function to check markdown file access
async function checkMarkdownAccess(fileId: string, userEmail: string) {
    const user = await prisma.user.findUnique({
        where: { email: userEmail },
    });

    if (!user) {
        return { error: "User not found", status: 404 };
    }

    const markdownFile = await prisma.markdownFile.findUnique({
        where: { id: fileId },
        include: {
            project: {
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
            },
        },
    });

    if (!markdownFile) {
        return { error: "Markdown file not found", status: 404 };
    }

    // Check access: personal project creator or team member
    const hasAccess = !markdownFile.project.teamId
        ? markdownFile.project.createdById === user.id
        : markdownFile.project.team?.members && markdownFile.project.team.members.length > 0;

    if (!hasAccess) {
        return { error: "Access denied", status: 403 };
    }

    return { markdownFile, user };
}

// Helper function to check write permissions
function hasWritePermission(markdownFile: any, userId: string): boolean {
    if (!markdownFile.project.teamId) {
        // Personal project: only creator can edit
        return markdownFile.project.createdById === userId;
    } else {
        // Team project: check role
        const member = markdownFile.project.team?.members[0];
        return member && member.role !== 'VIEWER';
    }
}

// GET /api/markdown/[id] - Get markdown file content
export async function GET(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const result = await checkMarkdownAccess(params.id, session.user.email);

        if ('error' in result) {
            return NextResponse.json({ error: result.error }, { status: result.status });
        }

        return NextResponse.json(result.markdownFile);
    } catch (error) {
        console.error("Error fetching markdown file:", error);
        return NextResponse.json(
            { error: "Failed to fetch markdown file" },
            { status: 500 }
        );
    }
}

// PATCH /api/markdown/[id] - Update markdown file
export async function PATCH(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const result = await checkMarkdownAccess(params.id, session.user.email);

        if ('error' in result) {
            return NextResponse.json({ error: result.error }, { status: result.status });
        }

        const { markdownFile, user } = result;

        // Check write permissions
        if (!hasWritePermission(markdownFile, user.id)) {
            return NextResponse.json(
                { error: "Insufficient permissions" },
                { status: 403 }
            );
        }

        const body = await req.json();
        const validatedData = updateMarkdownSchema.parse(body);

        // Update the markdown file
        const updatedFile = await prisma.markdownFile.update({
            where: { id: params.id },
            data: {
                title: validatedData.title,
                content: validatedData.content,
            },
        });

        // Log activity
        await prisma.activity.create({
            data: {
                projectId: markdownFile.projectId,
                type: "MARKDOWN_UPDATED",
                data: {
                    fileId: updatedFile.id,
                    fileTitle: updatedFile.title,
                },
            },
        });

        return NextResponse.json(updatedFile);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: "Validation error", details: error.issues },
                { status: 400 }
            );
        }
        console.error("Error updating markdown file:", error);
        return NextResponse.json(
            { error: "Failed to update markdown file" },
            { status: 500 }
        );
    }
}

// DELETE /api/markdown/[id] - Delete markdown file
export async function DELETE(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const result = await checkMarkdownAccess(params.id, session.user.email);

        if ('error' in result) {
            return NextResponse.json({ error: result.error }, { status: result.status });
        }

        const { markdownFile, user } = result;

        // Check write permissions
        if (!hasWritePermission(markdownFile, user.id)) {
            return NextResponse.json(
                { error: "Insufficient permissions" },
                { status: 403 }
            );
        }

        // Delete the markdown file
        await prisma.markdownFile.delete({
            where: { id: params.id },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting markdown file:", error);
        return NextResponse.json(
            { error: "Failed to delete markdown file" },
            { status: 500 }
        );
    }
}
