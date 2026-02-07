import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { Role } from "@prisma/client";

const updateMemberSchema = z.object({
    role: z.enum(["OWNER", "EDITOR", "VIEWER"]),
});

// PATCH /api/teams/[id]/members/[userId] - Update member role
export async function PATCH(
    request: NextRequest,
    { params }: { params: { id: string; userId: string } }
) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        // Check if current user is OWNER of the team
        const currentUserMember = await prisma.teamMember.findFirst({
            where: {
                teamId: params.id,
                userId: session.user.id,
                role: "OWNER",
            },
        });

        if (!currentUserMember) {
            return NextResponse.json(
                { error: "Access denied. Only team owners can update member roles." },
                { status: 403 }
            );
        }

        const body = await request.json();
        const validatedData = updateMemberSchema.parse(body);

        // Prevent removing the last owner
        if (validatedData.role !== "OWNER") {
            const ownerCount = await prisma.teamMember.count({
                where: {
                    teamId: params.id,
                    role: "OWNER",
                },
            });

            const targetMember = await prisma.teamMember.findFirst({
                where: {
                    teamId: params.id,
                    userId: params.userId,
                },
            });

            if (ownerCount === 1 && targetMember?.role === "OWNER") {
                return NextResponse.json(
                    { error: "Cannot change role. Team must have at least one owner." },
                    { status: 400 }
                );
            }
        }

        const updatedMember = await prisma.teamMember.update({
            where: {
                teamId_userId: {
                    teamId: params.id,
                    userId: params.userId,
                },
            },
            data: {
                role: validatedData.role as Role,
            },
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
        });

        return NextResponse.json(updatedMember);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: "Invalid input", details: error.issues },
                { status: 400 }
            );
        }

        console.error("Error updating team member:", error);
        return NextResponse.json(
            { error: "Failed to update team member" },
            { status: 500 }
        );
    }
}

// DELETE /api/teams/[id]/members/[userId] - Remove member from team
export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string; userId: string } }
) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        // Check if current user is OWNER of the team or removing themselves
        const currentUserMember = await prisma.teamMember.findFirst({
            where: {
                teamId: params.id,
                userId: session.user.id,
            },
        });

        if (!currentUserMember) {
            return NextResponse.json(
                { error: "Access denied." },
                { status: 403 }
            );
        }

        const isOwner = currentUserMember.role === "OWNER";
        const isSelf = session.user.id === params.userId;

        if (!isOwner && !isSelf) {
            return NextResponse.json(
                { error: "Access denied. Only team owners can remove members." },
                { status: 403 }
            );
        }

        // Prevent removing the last owner
        const targetMember = await prisma.teamMember.findFirst({
            where: {
                teamId: params.id,
                userId: params.userId,
            },
        });

        if (targetMember?.role === "OWNER") {
            const ownerCount = await prisma.teamMember.count({
                where: {
                    teamId: params.id,
                    role: "OWNER",
                },
            });

            if (ownerCount === 1) {
                return NextResponse.json(
                    { error: "Cannot remove the last owner. Assign another owner first." },
                    { status: 400 }
                );
            }
        }

        await prisma.teamMember.delete({
            where: {
                teamId_userId: {
                    teamId: params.id,
                    userId: params.userId,
                },
            },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error removing team member:", error);
        return NextResponse.json(
            { error: "Failed to remove team member" },
            { status: 500 }
        );
    }
}
