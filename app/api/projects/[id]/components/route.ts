import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import {
    createComponent,
    getComponentsByCanvasId,
} from '@/lib/architecture-service';

const createComponentSchema = z.object({
    name: z.string().min(1, 'Component name is required'),
    type: z.enum(['service', 'library', 'database', 'external', 'ui']),
    description: z.string().optional(),
    position: z.object({
        x: z.number(),
        y: z.number(),
    }),
    metadata: z.record(z.string(), z.any()).optional(),
});

// GET /api/projects/[id]/components - Get all components for a project
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Verify user has access to this project
        const project = await prisma.project.findUnique({
            where: { id: params.id },
            include: {
                canvas: true,
                team: {
                    include: {
                        members: {
                            where: { userId: session.user.id },
                        },
                    },
                },
            },
        });

        if (!project) {
            return NextResponse.json({ error: 'Project not found' }, { status: 404 });
        }

        // Check access
        const hasAccess = !project.teamId
            ? project.createdById === session.user.id
            : project.team?.members && project.team.members.length > 0;

        if (!hasAccess) {
            return NextResponse.json({ error: 'Access denied' }, { status: 403 });
        }

        // Get or create canvas
        let canvas = project.canvas;
        if (!canvas) {
            canvas = await prisma.canvas.create({
                data: {
                    projectId: params.id,
                    state: { elements: [], appState: {}, files: {} },
                },
            });
        }

        // Get all components
        const components = await getComponentsByCanvasId(canvas.id);

        return NextResponse.json({ components });
    } catch (error) {
        console.error('Error fetching components:', error);
        return NextResponse.json(
            { error: 'Failed to fetch components' },
            { status: 500 }
        );
    }
}

// POST /api/projects/[id]/components - Create a new component
export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Verify user has write access
        const project = await prisma.project.findUnique({
            where: { id: params.id },
            include: {
                canvas: true,
                team: {
                    include: {
                        members: {
                            where: { userId: session.user.id },
                        },
                    },
                },
            },
        });

        if (!project) {
            return NextResponse.json({ error: 'Project not found' }, { status: 404 });
        }

        // Check write access
        let hasWriteAccess = false;
        if (!project.teamId) {
            hasWriteAccess = project.createdById === session.user.id;
        } else {
            const member = project.team?.members[0];
            hasWriteAccess = member ? member.role === 'OWNER' || member.role === 'EDITOR' : false;
        }

        if (!hasWriteAccess) {
            return NextResponse.json(
                { error: 'Insufficient permissions' },
                { status: 403 }
            );
        }

        // Get or create canvas
        let canvas = project.canvas;
        if (!canvas) {
            canvas = await prisma.canvas.create({
                data: {
                    projectId: params.id,
                    state: { elements: [], appState: {}, files: {} },
                },
            });
        }

        // Validate request body
        const body = await request.json();
        const validatedData = createComponentSchema.parse(body);

        // Create component
        const component = await createComponent({
            canvasId: canvas.id,
            ...validatedData,
        });

        return NextResponse.json({ component }, { status: 201 });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: 'Invalid request data', details: error.issues },
                { status: 400 }
            );
        }

        console.error('Error creating component:', error);
        return NextResponse.json(
            { error: 'Failed to create component' },
            { status: 500 }
        );
    }
}
