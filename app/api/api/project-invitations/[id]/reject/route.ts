import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST /api/project-invitations/[id]/reject - Reject project invitation
export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.email) {
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

        // Update invitation status
        const updatedInvitation = await prisma.projectInvitation.update({
            where: { id: params.id },
            data: { status: "REJECTED" },
        });

        return NextResponse.json(updatedInvitation);
    } catch (error) {
        console.error("Error rejecting project invitation:", error);
        return NextResponse.json(
            { error: "Failed to reject invitation" },
            { status: 500 }
        );
    }
}
