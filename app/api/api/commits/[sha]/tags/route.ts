import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
    request: NextRequest,
    { params }: { params: { sha: string } }
) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const commitSha = params.sha;

        // Find the commit and verify it exists
        const commit = await prisma.gitCommit.findFirst({
            where: { sha: commitSha },
            include: {
                repository: {
                    include: {
                        project: true,
                    },
                },
            },
        });

        if (!commit) {
            return NextResponse.json({ error: 'Commit not found' }, { status: 404 });
        }

        // Verify user has access to the project
        const project = commit.repository.project;

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

        // Get all component tags for this commit
        const componentCommits = await prisma.componentCommit.findMany({
            where: { commitSha },
            include: {
                component: {
                    select: {
                        id: true,
                        componentId: true,
                        name: true,
                        type: true,
                    },
                },
            },
            orderBy: {
                taggedAt: 'desc',
            },
        });

        const tags = componentCommits.map((cc) => ({
            componentId: cc.component.id,
            componentName: cc.component.name,
            componentType: cc.component.type,
            taggedAt: cc.taggedAt.toISOString(),
            autoDetected: cc.autoDetected,
        }));

        return NextResponse.json({ tags });
    } catch (error) {
        console.error('Error fetching commit tags:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}