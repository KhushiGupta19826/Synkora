import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/team-invitations - Get pending invitations for current user
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.email) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        // Update expired invitations
        await prisma.teamInvitation.updateMany({
            where: {
                email: session.user.email,
                status: "PENDING",
                expiresAt: {
                    lt: new Date(),
                },
            },
            data: {
                status: "EXPIRED",
            },
        });

        // Get pending invitations
        const invitations = await prisma.teamInvitation.findMany({
            where: {
                email: session.user.email,
                status: "PENDING",
            },
            include: {
                team: {
                    select: {
                        id: true,
                        name: true,
                        _count: {
                            select: {
                                members: true,
                                projects: true,
                            },
                        },
                    },
                },
            },
            orderBy: {
                createdAt: "desc",
            },
        });

        return NextResponse.json(invitations);
    } catch (error) {
        console.error("Error fetching team invitations:", error);
        return NextResponse.json(
            { error: "Failed to fetch invitations" },
            { status: 500 }
        );
    }
}
