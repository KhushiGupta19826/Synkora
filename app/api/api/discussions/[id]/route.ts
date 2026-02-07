import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/discussions/[id]
 * Fetch a single discussion with all messages
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

        const discussion = await prisma.discussion.findUnique({
            where: { id: params.id },
            include: {
                messages: {
                    orderBy: { createdAt: 'asc' },
                },
            },
        });

        if (!discussion) {
            return NextResponse.json(
                { error: 'Discussion not found' },
                { status: 404 }
            );
        }

        return NextResponse.json(discussion);
    } catch (error: any) {
        console.error('Error fetching discussion:', error);
        return NextResponse.json(
            { error: 'Failed to fetch discussion' },
            { status: 500 }
        );
    }
}

/**
 * POST /api/discussions/[id]
 * Add a message to a discussion
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

        const body = await request.json();
        const { content } = body;

        if (!content) {
            return NextResponse.json(
                { error: 'content is required' },
                { status: 400 }
            );
        }

        // Verify discussion exists
        const discussion = await prisma.discussion.findUnique({
            where: { id: params.id },
        });

        if (!discussion) {
            return NextResponse.json(
                { error: 'Discussion not found' },
                { status: 404 }
            );
        }

        // Create message and update discussion timestamp
        const message = await prisma.discussionMessage.create({
            data: {
                discussionId: params.id,
                authorId: session.user.id,
                content,
            },
        });

        // Update discussion updatedAt
        await prisma.discussion.update({
            where: { id: params.id },
            data: { updatedAt: new Date() },
        });

        return NextResponse.json(message, { status: 201 });
    } catch (error: any) {
        console.error('Error adding message:', error);
        return NextResponse.json(
            { error: 'Failed to add message' },
            { status: 500 }
        );
    }
}
