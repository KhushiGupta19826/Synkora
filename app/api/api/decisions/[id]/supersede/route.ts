/**
 * Decision Supersession API Routes
 * 
 * Handles superseding old decisions with new ones
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supersede } from '@/lib/decision-service';

/**
 * POST /api/decisions/[id]/supersede
 * Supersede this decision with a new one
 */
export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const oldDecisionId = params.id;
        const body = await request.json();
        const { newDecisionId } = body;

        if (!newDecisionId) {
            return NextResponse.json(
                { error: 'newDecisionId is required' },
                { status: 400 }
            );
        }

        await supersede({ oldDecisionId, newDecisionId });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Error superseding decision:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to supersede decision' },
            { status: 400 }
        );
    }
}
