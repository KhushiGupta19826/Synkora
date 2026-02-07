import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST /api/project-invitations/[id]/accept - Accept project invitation
export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id || !session?.user?.email) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        // Get the invitation
        const invitation = await prisma.projectInvitation.findUnique({
            where: {
                id: params.id,
            },
            include: {
                project: {
                    include: {
                        team: true,
                    },
                },
            },
        });

        if (!invitation) {
            return NextResponse.json(
                { error: "Invitation not found" },
                { status: 404 }
            );
        }

        // Verify the invitation is for the current user
        if (invitation.email !== session.user.email) {
            return NextResponse.json(
                { error: "This invitation is not for you" },
                { status: 403 }
            );
        }

        // Check if invitation is still pending
        if (invitation.status !== "PENDING") {
            return NextResponse.json(
                { error: `Invitation has already been ${invitation.status.toLowerCase()}` },
                { status: 400 }
            );
        }

        // Check if invitation has expired
        if (invitation.expiresAt < new Date()) {
            await prisma.projectInvitation.update({
                where: { id: params.id },
                data: { status: "EXPIRED" },
            });
            return NextResponse.json(
                { error: "Invitation has expired" },
                { status: 400 }
            );
        }

        // Check if user is already a member of the project's team
        const existingMember = invitation.project.teamId ? await prisma.teamMember.findFirst({
            where: {
                teamId: invitation.project.teamId,
                userId: session.user.id,
            },
        }) : null;

        if (existingMember) {
            // Update invitation status
            await prisma.projectInvitation.update({
                where: { id: params.id },
                data: { status: "ACCEPTED" },
            });
            return NextResponse.json({
                message: "You are already a member of this project's team",
                project: invitation.project,
            });
        }

        // Add user to team and update invitation status
        if (!invitation.project.teamId) {
            return NextResponse.json(
                { error: "Project does not have a team" },
                { status: 400 }
            );
        }

        const [teamMember] = await prisma.$transaction([
            prisma.teamMember.create({
                data: {
                    teamId: invitation.project.teamId,
                    userId: session.user.id,
                    role: invitation.role,
                },
                include: {
                    team: {
                        select: {
                            id: true,
                            name: true,
                        },
                    },
                    user: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            image: true,
                        },
                    },
                },
            }),
            prisma.projectInvitation.update({
                where: { id: params.id },
                data: { status: "ACCEPTED" },
            }),
        ]);

        return NextResponse.json({
            teamMember,
            project: invitation.project,
        });
    } catch (error) {
        console.error("Error accepting project invitation:", error);
        return NextResponse.json(
            { error: "Failed to accept invitation" },
            { status: 500 }
        );
    }
}
