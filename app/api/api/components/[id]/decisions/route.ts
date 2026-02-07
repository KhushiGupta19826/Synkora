/**
 * Component Decisions API Routes
 * 
 * Get all Decision Records linked to a specific component
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getDecisionsByComponent } from '@/lib/decision-service';

/**
 * GET /api/components/[id]/decisions
 * Get all Decision Records for a component
 */
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
        const decisions = await getDecisionsByComponent(componentId);

        return NextResponse.json(decisions);
    } catch (error: any) {
        console.error('Error fetching component decisions:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to fetch component decisions' },
            { status: 500 }
        );
    }
}
