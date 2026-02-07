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

        // Fetch canvas with project to verify access
        const canvas = await prisma.canvas.findUnique({
            where: { id: canvasId },
            include: {
                project: true,
                components: {
                    orderBy: {
                        createdAt: 'asc',
                    },
                },
            },
        });

        if (!canvas) {
            return NextResponse.json({ error: 'Canvas not found' }, { status: 404 });
        }

        // Verify user has access to the project
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

        // Return components
        return NextResponse.json(canvas.components);
    } catch (error) {
        console.error('Error fetching canvas components:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
