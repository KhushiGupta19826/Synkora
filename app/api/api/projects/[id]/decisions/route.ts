/**
 * Decision Records API Routes
 * 
 * Handles CRUD operations for Decision Records within a project
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import {
    createDecision,
    getDecisionsByProject,
} from '@/lib/decision-service';
import { CreateDecisionInput, DecisionStatus } from '@/types/decision';

/**
 * GET /api/projects/[id]/decisions
 * Get all Decision Records for a project
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

        const projectId = params.id;
        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status') as DecisionStatus | null;

        const decisions = await getDecisionsByProject(
            projectId,
            status || undefined
        );

        return NextResponse.json(decisions);
    } catch (error: any) {
        console.error('Error fetching decisions:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to fetch decisions' },
            { status: 500 }
        );
    }
}

/**
 * POST /api/projects/[id]/decisions
 * Create a new Decision Record
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

        const projectId = params.id;
        const body = await request.json();

        const input: CreateDecisionInput = {
            projectId,
            title: body.title,
            context: body.context,
            decision: body.decision,
            rationale: body.rationale,
            consequences: body.consequences,
            status: body.status,
            createdBy: session.user.id,
            tags: body.tags || [],
            linkedComponentIds: body.linkedComponentIds || [],
        };

        const decision = await createDecision(input);

        return NextResponse.json(decision, { status: 201 });
    } catch (error: any) {
        console.error('Error creating decision:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to create decision' },
            { status: 400 }
        );
    }
}
