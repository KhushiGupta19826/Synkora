import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { decrypt } from "@/lib/encryption";
import { GitHubClient } from "@/lib/github-client";

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
        const state = searchParams.get("state") as "open" | "closed" | "all" || "all";

        // Check if user has access to the project and get GitHub repo
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

        // Decrypt the access token
        const accessToken = decrypt(project.gitRepo.accessToken);

        // Create GitHub client and fetch pull requests
        const githubClient = new GitHubClient(accessToken);
        const result = await githubClient.getPullRequests(
            project.gitRepo.owner,
            project.gitRepo.name,
            {
                page,
                perPage,
                state,
            }
        );

        return NextResponse.json({
            pullRequests: result.pullRequests,
            hasMore: result.hasMore,
            page,
            perPage,
        });
    } catch (error) {
        console.error("Error fetching pull requests:", error);
        return NextResponse.json(
            { error: "Failed to fetch pull requests" },
            { status: 500 }
        );
    }
}
