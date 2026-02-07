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

        const canvasId = params.id;

        // Verify user has access to the canvas
        const canvas = await prisma.canvas.findUnique({
            where: { id: canvasId },
            include: {
                project: true,
            },
        });

        if (!canvas) {
            return NextResponse.json({ error: 'Canvas not found' }, { status: 404 });
        }

        const project = canvas.project;

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

        // Get commit counts for all components in this canvas
        const commitCounts = await prisma.componentCommit.groupBy({
            by: ['componentId'],
            where: {
                component: {
                    canvasId: canvasId,
                },
            },
            _count: {
                commitSha: true,
            },
        });

        // Get component IDs for the response
        const components = await prisma.component.findMany({
            where: { canvasId },
            select: {
                id: true,
                componentId: true,
            },
        });

        const componentIdMap = new Map(components.map(c => [c.id, c.componentId]));

        const result = commitCounts.map(cc => ({
            componentId: componentIdMap.get(cc.componentId) || cc.componentId,
            commitCount: cc._count.commitSha,
        }));

        return NextResponse.json({ commitCounts: result });
    } catch (error) {
        console.error('Error fetching commit counts:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}