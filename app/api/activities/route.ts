import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/activities - Fetch recent activities for user's projects
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const { searchParams } = new URL(request.url);
        const limit = parseInt(searchParams.get("limit") || "20");
        const offset = parseInt(searchParams.get("offset") || "0");

        // Get all teams the user is a member of
        const teamMemberships = await prisma.teamMember.findMany({
            where: {
                userId: session.user.id,
            },
            select: {
                teamId: true,
            },
        });

        const teamIds = teamMemberships.map((tm: { teamId: string }) => tm.teamId);

        // Get all project IDs from those teams
        const projects = await prisma.project.findMany({
            where: {
                teamId: {
                    in: teamIds,
                },
            },
            select: {
                id: true,
            },
        });

        const projectIds = projects.map((p: { id: string }) => p.id);

        // Fetch activities from those projects
        const activities = await prisma.activity.findMany({
            where: {
                projectId: {
                    in: projectIds,
                },
            },
            include: {
                project: {
                    select: {
                        name: true,
                    },
                },
            },
            orderBy: {
                createdAt: "desc",
            },
            take: limit,
            skip: offset,
        });

        // Get total count for pagination
        const totalCount = await prisma.activity.count({
            where: {
                projectId: {
                    in: projectIds,
                },
            },
        });

        return NextResponse.json({
            activities,
            pagination: {
                total: totalCount,
                limit,
                offset,
                hasMore: offset + limit < totalCount,
            },
        });
    } catch (error) {
        console.error("Error fetching activities:", error);
        return NextResponse.json(
            { error: "Failed to fetch activities" },
            { status: 500 }
        );
    }
}
