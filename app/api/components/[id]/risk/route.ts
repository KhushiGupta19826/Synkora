import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { calculateComponentRisk } from '@/lib/risk-analysis';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/components/[id]/risk
 * Get risk metrics for a specific component
 */
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const componentId = params.id;

        // Verify component exists and user has access
        const component = await prisma.component.findUnique({
            where: { id: componentId },
            include: {
                canvas: {
                    include: {
                        project: {
                            select: {
                                id: true,
                                createdById: true,
                                teamId: true,
                                team: {
                                    include: {
                                        members: {
                                            where: {
                                                userId: session.user.id,
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        });

        if (!component) {
            return NextResponse.json(
                { error: 'Component not found' },
                { status: 404 }
            );
        }

        const project = component.canvas.project;

        // Check access
        const hasAccess =
            project.createdById === session.user.id ||
            (project.team && project.team.members.length > 0);

        if (!hasAccess) {
            return NextResponse.json(
                { error: 'Access denied' },
                { status: 403 }
            );
        }

        // Calculate risk metrics
        const riskMetrics = await calculateComponentRisk(componentId);

        return NextResponse.json(riskMetrics);
    } catch (error) {
        console.error('Error calculating component risk:', error);
        return NextResponse.json(
            { error: 'Failed to calculate risk metrics' },
            { status: 500 }
        );
    }
}
