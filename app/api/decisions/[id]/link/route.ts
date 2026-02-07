/**
 * Decision-Component Linking API Routes
 * 
 * Handles linking and unlinking Decision Records to Components
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { linkToComponent, unlinkFromComponent } from '@/lib/decision-service';

/**
 * POST /api/decisions/[id]/link
 * Link a Decision Record to a Component
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

        const decisionId = params.id;
        const body = await request.json();
        const { componentId } = body;

        if (!componentId) {
            return NextResponse.json(
                { error: 'componentId is required' },
                { status: 400 }
            );
        }

        await linkToComponent(decisionId, componentId);

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Error linking decision to component:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to link decision to component' },
            { status: 400 }
        );
    }
}

/**
 * DELETE /api/decisions/[id]/link
 * Unlink a Decision Record from a Component
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
        const { searchParams } = new URL(request.url);
        const componentId = searchParams.get('componentId');

        if (!componentId) {
            return NextResponse.json(
                { error: 'componentId is required' },
                { status: 400 }
            );
        }

        await unlinkFromComponent(decisionId, componentId);

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Error unlinking decision from component:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to unlink decision from component' },
            { status: 400 }
        );
    }
}
