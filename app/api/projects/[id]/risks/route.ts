import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { calculateProjectRisks, getHighRiskComponents } from '@/lib/risk-analysis';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/projects/[id]/risks
 * Get risk analysis for all components in a project
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

        const projectId = params.id;

        // Verify project exists and user has access
        const project = await prisma.project.findUnique({
            where: { id: projectId },
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
        });

        if (!project) {
            return NextResponse.json(
                { error: 'Project not found' },
                { status: 404 }
            );
        }

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

        // Get query parameters
        const { searchParams } = new URL(request.url);
        const highRiskOnly = searchParams.get('highRiskOnly') === 'true';
        const minSeverity = (searchParams.get('minSeverity') || 'medium') as 'medium' | 'high' | 'critical';

        // Calculate risks
        const risks = highRiskOnly
            ? await getHighRiskComponents(projectId, minSeverity)
            : await calculateProjectRisks(projectId);

        // Calculate summary statistics
        const summary = {
            totalComponents: risks.length,
            criticalRisk: risks.filter(r => r.overallSeverity === 'critical').length,
            highRisk: risks.filter(r => r.overallSeverity === 'high').length,
            mediumRisk: risks.filter(r => r.overallSeverity === 'medium').length,
            lowRisk: risks.filter(r => r.overallSeverity === 'low').length,
            averageRiskScore: risks.length > 0
                ? Math.round(risks.reduce((sum, r) => sum + r.riskScore, 0) / risks.length)
                : 0,
        };

        return NextResponse.json({
            risks,
            summary,
        });
    } catch (error) {
        console.error('Error calculating project risks:', error);
        return NextResponse.json(
            { error: 'Failed to calculate risk metrics' },
            { status: 500 }
        );
    }
}
