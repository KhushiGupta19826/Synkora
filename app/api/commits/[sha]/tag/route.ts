import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(
    request: NextRequest,
    { params }: { params: { sha: string } }
) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { componentId } = await request.json();
        const commitSha = params.sha;

        if (!componentId) {
            return NextResponse.json({ error: 'Component ID is required' }, { status: 400 });
        }

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

        // Verify the component exists and belongs to the same project
        const component = await prisma.component.findUnique({
            where: { id: componentId },
            include: {
                canvas: {
                    include: {
                        project: true,
                    },
                },
            },
        });

        if (!component) {
            return NextResponse.json({ error: 'Component not found' }, { status: 404 });
        }

        if (component.canvas.project.id !== project.id) {
            return NextResponse.json({ error: 'Component and commit must belong to the same project' }, { status: 400 });
        }

        // Create or update the component-commit relationship
        const componentCommit = await prisma.componentCommit.upsert({
            where: {
                componentId_commitSha: {
                    componentId,
                    commitSha,
                },
            },
            update: {
                taggedAt: new Date(),
                autoDetected: false,
            },
            create: {
                componentId,
                commitSha,
                repositoryId: commit.repositoryId,
                autoDetected: false,
            },
        });

        return NextResponse.json({
            success: true,
            componentCommit: {
                id: componentCommit.id,
                componentId: componentCommit.componentId,
                commitSha: componentCommit.commitSha,
                taggedAt: componentCommit.taggedAt,
                autoDetected: componentCommit.autoDetected,
            },
        });
    } catch (error) {
        console.error('Error tagging commit with component:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: { sha: string } }
) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { componentId } = await request.json();
        const commitSha = params.sha;

        if (!componentId) {
            return NextResponse.json({ error: 'Component ID is required' }, { status: 400 });
        }

        // Find and delete the component-commit relationship
        const componentCommit = await prisma.componentCommit.findUnique({
            where: {
                componentId_commitSha: {
                    componentId,
                    commitSha,
                },
            },
            include: {
                component: {
                    include: {
                        canvas: {
                            include: {
                                project: true,
                            },
                        },
                    },
                },
            },
        });

        if (!componentCommit) {
            return NextResponse.json({ error: 'Component-commit relationship not found' }, { status: 404 });
        }

        // Verify user has access to the project
        const project = componentCommit.component.canvas.project;

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

        // Delete the relationship
        await prisma.componentCommit.delete({
            where: {
                componentId_commitSha: {
                    componentId,
                    commitSha,
                },
            },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error removing component tag from commit:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}