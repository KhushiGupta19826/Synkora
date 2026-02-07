import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const inviteSchema = z.object({
    email: z.string().email("Invalid email address"),
    role: z.enum(["OWNER", "EDITOR", "VIEWER"]).default("EDITOR"),
});

// POST /api/projects/[id]/invite - Invite user to project by email
export async function POST(
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

        // Check if current user has access to the project and is OWNER or EDITOR
        const project = await prisma.project.findUnique({
            where: { id: params.id },
            include: {
                team: {
                    include: {
                        members: {
                            where: { userId: session.user.id },
                        },
                    },
                },
            },
        });

        if (!project) {
            return NextResponse.json(
                { error: "Project not found" },
                { status: 404 }
            );
        }
        else if (!project.team || !project.teamId) {
            return NextResponse.json(
                {error: "Project Team not found!"},
                { status: 404 }
            )
        }

        const teamMember = project.team.members[0];
        if (!teamMember) {
            return NextResponse.json(
                { error: "Access denied. You are not a member of this project's team." },
                { status: 403 }
            );
        }

        // Only OWNER and EDITOR can invite
        if (teamMember.role === "VIEWER") {
            return NextResponse.json(
                { error: "Access denied. Only project owners and editors can invite members." },
                { status: 403 }
            );
        }

        const body = await request.json();
        const validatedData = inviteSchema.parse(body);

        // Check if user is already a team member (and thus has project access)
        const existingUser = await prisma.user.findUnique({
            where: { email: validatedData.email },
        });

        if (existingUser) {
            const existingMember = await prisma.teamMember.findFirst({
                where: {
                    teamId: project.teamId,
                    userId: existingUser.id,
                },
            });

            if (existingMember) {
                return NextResponse.json(
                    { error: "User is already a member of this project's team" },
                    { status: 400 }
                );
            }
        }

        // Check if there's already a pending invitation
        const existingInvitation = await prisma.projectInvitation.findFirst({
            where: {
                projectId: params.id,
                email: validatedData.email,
                status: "PENDING",
            },
        });

        if (existingInvitation) {
            return NextResponse.json(
                { error: "An invitation has already been sent to this email" },
                { status: 400 }
            );
        }

        // Create invitation (expires in 7 days)
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);

        const invitation = await prisma.projectInvitation.create({
            data: {
                projectId: params.id,
                email: validatedData.email,
                role: validatedData.role,
                invitedBy: session.user.id,
                expiresAt,
            },
            include: {
                project: {
                    select: {
                        id: true,
                        name: true,
                        description: true,
                    },
                },
            },
        });

        // TODO: Send invitation email
        // For now, we'll just return the invitation
        // In a real app, you would send an email with a link to accept the invitation

        return NextResponse.json(invitation, { status: 201 });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: "Invalid input", details: error.issues },
                { status: 400 }
            );
        }

        console.error("Error creating project invitation:", error);
        return NextResponse.json(
            { error: "Failed to create invitation" },
            { status: 500 }
        );
    }
}
