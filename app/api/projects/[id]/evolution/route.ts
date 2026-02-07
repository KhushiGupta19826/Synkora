import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

interface DecisionData {
    id: string;
    title: string;
    decision: string;
    createdBy: string;
    createdAt: Date;
    status: string;
}

interface CommitData {
    id: string;
    sha: string;
    message: string;
    author: string;
    committedAt: Date;
}

interface ComponentData {
    id: string;
    componentId: string;
    name: string;
    type: string;
    createdAt: Date;
    updatedAt: Date;
}

export async function GET(
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

        const projectId = params.id;

        // Verify user has access to the project
        const project = await prisma.project.findUnique({
            where: { id: projectId },
            include: {
                team: {
                    include: {
                        members: {
                            where: {
                                user: {
                                    email: session.user.email,
                                },
                            },
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

        // Check if user has access
        const hasAccess = project.team?.members.length ?? 0 > 0;
        if (!hasAccess) {
            return NextResponse.json(
                { error: "Access denied" },
                { status: 403 }
            );
        }

        // Fetch timeline events in parallel
        const [decisions, commits, components] = await Promise.all([
            // Fetch decision records
            prisma.decisionRecord.findMany({
                where: { projectId },
                select: {
                    id: true,
                    title: true,
                    decision: true,
                    createdBy: true,
                    createdAt: true,
                    status: true,
                },
                orderBy: { createdAt: 'desc' },
            }),

            // Fetch git commits
            prisma.gitCommit.findMany({
                where: {
                    repository: {
                        projectId,
                    },
                },
                select: {
                    id: true,
                    sha: true,
                    message: true,
                    author: true,
                    committedAt: true,
                },
                orderBy: { committedAt: 'desc' },
                take: 100, // Limit to recent commits
            }),

            // Fetch component changes (using updatedAt as proxy for changes)
            prisma.component.findMany({
                where: {
                    canvas: {
                        projectId,
                    },
                },
                select: {
                    id: true,
                    componentId: true,
                    name: true,
                    type: true,
                    createdAt: true,
                    updatedAt: true,
                },
                orderBy: { updatedAt: 'desc' },
            }),
        ]);

        // Transform data into timeline events
        const events = [
            // Decision events
            ...decisions.map((decision: DecisionData) => ({
                id: `decision-${decision.id}`,
                type: 'decision' as const,
                timestamp: decision.createdAt,
                title: decision.title,
                description: decision.decision.substring(0, 150) + (decision.decision.length > 150 ? '...' : ''),
                author: decision.createdBy,
                metadata: {
                    status: decision.status,
                    decisionId: decision.id,
                },
            })),

            // Commit events
            ...commits.map((commit: CommitData) => ({
                id: `commit-${commit.id}`,
                type: 'commit' as const,
                timestamp: commit.committedAt,
                title: commit.message.split('\n')[0], // First line of commit message
                description: commit.message.split('\n').slice(1).join('\n').trim().substring(0, 150),
                author: commit.author,
                metadata: {
                    sha: commit.sha,
                    commitId: commit.id,
                },
            })),

            // Component events (only include if updated after creation)
            ...components
                .filter((component: ComponentData) =>
                    component.updatedAt.getTime() > component.createdAt.getTime() + 1000 // More than 1 second difference
                )
                .map((component: ComponentData) => ({
                    id: `component-${component.id}`,
                    type: 'component' as const,
                    timestamp: component.updatedAt,
                    title: `Updated ${component.name}`,
                    description: `Component ${component.componentId} (${component.type}) was modified`,
                    metadata: {
                        componentId: component.componentId,
                        componentType: component.type,
                    },
                })),
        ];

        // Sort all events by timestamp (newest first)
        events.sort((a, b) =>
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );

        return NextResponse.json({
            events,
            summary: {
                total: events.length,
                decisions: decisions.length,
                commits: commits.length,
                components: components.filter((c: ComponentData) =>
                    c.updatedAt.getTime() > c.createdAt.getTime() + 1000
                ).length,
            },
        });
    } catch (error) {
        console.error("Error fetching evolution timeline:", error);
        return NextResponse.json(
            { error: "Failed to fetch timeline events" },
            { status: 500 }
        );
    }
}
