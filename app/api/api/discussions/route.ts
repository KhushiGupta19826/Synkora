import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/discussions
 * Fetch discussions by anchor (component, decision, commit)
 */
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const anchorType = searchParams.get('anchorType');
        const anchorId = searchParams.get('anchorId');
        const projectId = searchParams.get('projectId');

        if (!anchorType || !anchorId) {
            return NextResponse.json(
                { error: 'anchorType and anchorId are required' },
                { status: 400 }
            );
        }

        const discussions = await prisma.discussion.findMany({
            where: {
                anchorType: anchorType as any,
                anchorId,
                ...(projectId && { projectId }),
            },
            include: {
                messages: {
                    orderBy: { createdAt: 'asc' },
                    take: 1, // Just get first message for preview
                },
            },
            orderBy: { updatedAt: 'desc' },
        });

        // Add message count to each discussion
        const discussionsWithCount = await Promise.all(
            discussions.map(async (discussion) => {
                const messageCount = await prisma.discussionMessage.count({
                    where: { discussionId: discussion.id },
                });
                return {
                    ...discussion,
                    messageCount,
                };
            })
        );

        return NextResponse.json(discussionsWithCount);
    } catch (error: any) {
        console.error('Error fetching discussions:', error);
        return NextResponse.json(
            { error: 'Failed to fetch discussions' },
            { status: 500 }
        );
    }
}

/**
 * POST /api/discussions
 * Create a new discussion
 */
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { projectId, title, anchorType, anchorId, initialMessage } = body;

        if (!projectId || !title || !anchorType || !anchorId) {
            return NextResponse.json(
                { error: 'projectId, title, anchorType, and anchorId are required' },
                { status: 400 }
            );
        }

        // Validate anchor type
        const validAnchorTypes = ['COMPONENT', 'DECISION', 'COMMIT', 'PULL_REQUEST'];
        if (!validAnchorTypes.includes(anchorType)) {
            return NextResponse.json(
                { error: 'Invalid anchor type' },
                { status: 400 }
            );
        }

        // Create discussion with optional initial message
        const discussion = await prisma.discussion.create({
            data: {
                projectId,
                title,
                anchorType,
                anchorId,
                createdBy: session.user.id,
                ...(initialMessage && {
                    messages: {
                        create: {
                            authorId: session.user.id,
                            content: initialMessage,
                        },
                    },
                }),
            },
            include: {
                messages: true,
            },
        });

        return NextResponse.json(discussion, { status: 201 });
    } catch (error: any) {
        console.error('Error creating discussion:', error);
        return NextResponse.json(
            { error: 'Failed to create discussion' },
            { status: 500 }
        );
    }
}
