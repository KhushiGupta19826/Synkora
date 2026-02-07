import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const inviteSchema = z.object({
    email: z.string().email("Invalid email address"),
    role: z.enum(["OWNER", "EDITOR", "VIEWER"]).default("EDITOR"),
});

// POST /api/teams/[id]/invite - Invite user to team
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

        // Check if current user is OWNER of the team
        const teamMember = await prisma.teamMember.findFirst({
            where: {
                teamId: params.id,
                userId: session.user.id,
                role: "OWNER",
            },
        });

        if (!teamMember) {
            return NextResponse.json(
                { error: "Access denied. Only team owners can invite members." },
                { status: 403 }
            );
        }

        const body = await request.json();
        const validatedData = inviteSchema.parse(body);

        // Check if user is already a team member
        const existingUser = await prisma.user.findUnique({
            where: { email: validatedData.email },
        });

        if (existingUser) {
            const existingMember = await prisma.teamMember.findFirst({
                where: {
                    teamId: params.id,
                    userId: existingUser.id,
                },
            });

            if (existingMember) {
                return NextResponse.json(
                    { error: "User is already a member of this team" },
                    { status: 400 }
                );
            }
        }

        // Check if there's already a pending invitation
        const existingInvitation = await prisma.teamInvitation.findFirst({
            where: {
                teamId: params.id,
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

        const invitation = await prisma.teamInvitation.create({
            data: {
                teamId: params.id,
                email: validatedData.email,
                role: validatedData.role,
                invitedBy: session.user.id,
                expiresAt,
            },
            include: {
                team: {
                    select: {
                        id: true,
                        name: true,
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

        console.error("Error creating team invitation:", error);
        return NextResponse.json(
            { error: "Failed to create invitation" },
            { status: 500 }
        );
    }
}
