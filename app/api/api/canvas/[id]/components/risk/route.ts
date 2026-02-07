import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { calculateProjectRisks } from '@/lib/risk-analysis';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/canvas/[id]/components/risk
 * Get risk badges for all components in a canvas
 * Returns a map of componentId -> risk severity for efficient lookup
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

        const canvasId = params.id;

        // Verify canvas exists and user has access
        const canvas = await prisma.canvas.findUnique({
            where: { id: canvasId },
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
        });

        if (!canvas) {
            return NextResponse.json(
                { error: 'Canvas not found' },
                { status: 404 }
            );
        }

        const project = canvas.project;

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

        // Calculate risks for all components in the project
        const risks = await calculateProjectRisks(project.id);

        // Create a map of componentId -> risk data for efficient lookup
        const riskMap: Record<string, {
            severity: 'low' | 'medium' | 'high' | 'critical';
            riskScore: number;
            riskFactorCount: number;
        }> = {};

        risks.forEach(risk => {
            riskMap[risk.componentId] = {
                severity: risk.overallSeverity,
                riskScore: risk.riskScore,
                riskFactorCount: risk.riskFactors.length,
            };
        });

        return NextResponse.json({ riskMap });
    } catch (error) {
        console.error('Error calculating canvas component risks:', error);
        return NextResponse.json(
            { error: 'Failed to calculate risk metrics' },
            { status: 500 }
        );
    }
}
