import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST /api/team-invitations/[id]/accept - Accept team invitation
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
        const invitation = await prisma.teamInvitation.findUnique({
            where: {
                id: params.id,
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
            await prisma.teamInvitation.update({
                where: { id: params.id },
                data: { status: "EXPIRED" },
            });
            return NextResponse.json(
                { error: "Invitation has expired" },
                { status: 400 }
            );
        }

        // Check if user is already a member
        const existingMember = await prisma.teamMember.findFirst({
            where: {
                teamId: invitation.teamId,
                userId: session.user.id,
            },
        });

        if (existingMember) {
            // Update invitation status
            await prisma.teamInvitation.update({
                where: { id: params.id },
                data: { status: "ACCEPTED" },
            });
            return NextResponse.json(
                { error: "You are already a member of this team" },
                { status: 400 }
            );
        }

        // Add user to team and update invitation status
        const [teamMember] = await prisma.$transaction([
            prisma.teamMember.create({
                data: {
                    teamId: invitation.teamId,
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
            prisma.teamInvitation.update({
                where: { id: params.id },
                data: { status: "ACCEPTED" },
            }),
        ]);

        return NextResponse.json(teamMember);
    } catch (error) {
        console.error("Error accepting team invitation:", error);
        return NextResponse.json(
            { error: "Failed to accept invitation" },
            { status: 500 }
        );
    }
}
