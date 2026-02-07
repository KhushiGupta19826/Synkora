/**
 * Individual Decision Record API Routes
 * 
 * Handles operations on individual Decision Records
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import {
    getDecisionById,
    updateDecision,
    deleteDecision,
    linkToComponent,
    unlinkFromComponent,
    supersede,
    getSupersessionChain,
} from '@/lib/decision-service';
import { UpdateDecisionInput } from '@/types/decision';

/**
 * GET /api/decisions/[id]
 * Get a Decision Record by ID
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

        const decisionId = params.id;
        const { searchParams } = new URL(request.url);
        const includeChain = searchParams.get('includeChain') === 'true';

        if (includeChain) {
            const chain = await getSupersessionChain(decisionId);
            return NextResponse.json({ chain });
        }

        const decision = await getDecisionById(decisionId);
        return NextResponse.json(decision);
    } catch (error: any) {
        console.error('Error fetching decision:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to fetch decision' },
            { status: 404 }
        );
    }
}

/**
 * PATCH /api/decisions/[id]
 * Update a Decision Record
 */
export async function PATCH(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const decisionId = params.id;
        const body = await request.json();

        const updates: UpdateDecisionInput = {
            title: body.title,
            context: body.context,
            decision: body.decision,
            rationale: body.rationale,
            consequences: body.consequences,
            status: body.status,
            tags: body.tags,
        };

        const decision = await updateDecision(decisionId, updates);

        return NextResponse.json(decision);
    } catch (error: any) {
        console.error('Error updating decision:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to update decision' },
            { status: 400 }
        );
    }
}

/**
 * DELETE /api/decisions/[id]
 * Delete a Decision Record
 */
export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const decisionId = params.id;
        await deleteDecision(decisionId);

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Error deleting decision:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to delete decision' },
            { status: 400 }
        );
    }
}
