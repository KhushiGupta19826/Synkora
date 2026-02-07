import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const componentId = params.id;

        // Fetch component with all relationships
        const component = await prisma.component.findUnique({
            where: { id: componentId },
            include: {
                canvas: {
                    include: {
                        project: true,
                    },
                },
                decisionComponents: {
                    include: {
                        decision: true,
                    },
                },
            },
        });

        if (!component) {
            return NextResponse.json({ error: 'Component not found' }, { status: 404 });
        }

        // Verify user has access to the project
        const project = component.canvas.project;

        if (project.teamId) {
            const teamMember = await prisma.teamMember.findUnique({
                where: {
                    teamId_userId: {
                        teamId: project.teamId,
                        userId: session.user.id,
                    },
                },
            });

            if (!teamMember) {
                return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
            }
        } else if (project.createdById !== session.user.id) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Fetch linked decisions
        const decisions = component.decisionComponents.map((dc) => ({
            id: dc.decision.id,
            title: dc.decision.title,
            status: dc.decision.status,
            createdAt: dc.decision.createdAt.toISOString(),
        }));

        // Fetch knowledge artifacts (markdown files linked to this component)
        const componentMarkdowns = await prisma.componentMarkdown.findMany({
            where: { componentId: component.id },
            include: {
                markdown: true,
            },
        });

        const knowledgeArtifacts = componentMarkdowns.map((cm) => ({
            id: cm.markdown.id,
            title: cm.markdown.title,
            type: 'markdown',
            updatedAt: cm.markdown.updatedAt.toISOString(),
        }));

        // Fetch discussions anchored to this component
        const discussionsData = await prisma.discussion.findMany({
            where: {
                anchorType: 'COMPONENT',
                anchorId: component.componentId,
            },
            include: {
                messages: true,
            },
            orderBy: { updatedAt: 'desc' },
        });

        const discussions = discussionsData.map((d) => ({
            id: d.id,
            title: d.title,
            messageCount: d.messages.length,
            updatedAt: d.updatedAt.toISOString(),
        }));

        // Fetch recent Git commits tagged with this component
        const componentCommits = await prisma.componentCommit.findMany({
            where: { componentId: component.id },
            include: {
                repository: {
                    include: {
                        commits: {
                            where: {
                                sha: {
                                    in: [], // Will be populated below
                                },
                            },
                        },
                    },
                },
            },
            orderBy: { taggedAt: 'desc' },
            take: 10, // Limit to recent commits
        });

        // Get the actual commit data
        const commitShas = componentCommits.map(cc => cc.commitSha);
        const commits = await prisma.gitCommit.findMany({
            where: {
                sha: { in: commitShas },
            },
            orderBy: { committedAt: 'desc' },
        });

        const recentCommits = commits.map((commit) => ({
            sha: commit.sha,
            message: commit.message,
            author: commit.author,
            committedAt: commit.committedAt.toISOString(),
        }));

        // Return component with all relationships
        return NextResponse.json({
            id: component.id,
            componentId: component.componentId,
            name: component.name,
            type: component.type,
            description: component.description,
            projectId: project.id,
            decisions,
            knowledgeArtifacts,
            discussions,
            recentCommits,
        });
    } catch (error) {
        console.error('Error fetching component relationships:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
