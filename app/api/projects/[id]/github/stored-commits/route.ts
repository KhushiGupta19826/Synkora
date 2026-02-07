import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
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

        const projectId = params.id;
        const searchParams = request.nextUrl.searchParams;
        const page = parseInt(searchParams.get("page") || "1");
        const perPage = parseInt(searchParams.get("perPage") || "30");
        const search = searchParams.get("search") || "";

        // Check if user has access to the project
        const project = await prisma.project.findFirst({
            where: {
                id: projectId,
                team: {
                    members: {
                        some: {
                            userId: session.user.id,
                        },
                    },
                },
            },
            include: {
                gitRepo: true,
            },
        });

        if (!project) {
            return NextResponse.json(
                { error: "Project not found or insufficient permissions" },
                { status: 404 }
            );
        }

        if (!project.gitRepo) {
            return NextResponse.json(
                { error: "No GitHub repository connected to this project" },
                { status: 404 }
            );
        }

        // Build where clause for search
        const whereClause = {
            repositoryId: project.gitRepo.id,
            ...(search && {
                OR: [
                    { message: { contains: search, mode: "insensitive" as const } },
                    { author: { contains: search, mode: "insensitive" as const } },
                    { sha: { contains: search, mode: "insensitive" as const } },
                ],
            }),
        };

        // Get total count
        const totalCount = await prisma.gitCommit.count({
            where: whereClause,
        });

        // Get commits with pagination
        const commits = await prisma.gitCommit.findMany({
            where: whereClause,
            orderBy: { committedAt: "desc" },
            skip: (page - 1) * perPage,
            take: perPage,
        });

        const totalPages = Math.ceil(totalCount / perPage);

        return NextResponse.json({
            commits,
            pagination: {
                page,
                perPage,
                totalCount,
                totalPages,
                hasMore: page < totalPages,
            },
        });
    } catch (error) {
        console.error("Error fetching stored commits:", error);
        return NextResponse.json(
            { error: "Failed to fetch commits" },
            { status: 500 }
        );
    }
}
