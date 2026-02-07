import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import {
    getComponentByComponentId,
    updateComponent,
    deleteComponent,
} from '@/lib/architecture-service';

const updateComponentSchema = z.object({
    name: z.string().min(1).optional(),
    type: z.enum(['service', 'library', 'database', 'external', 'ui']).optional(),
    description: z.string().optional(),
    position: z.object({
        x: z.number(),
        y: z.number(),
    }).optional(),
    metadata: z.record(z.string(), z.any()).optional(),
});

// GET /api/projects/[id]/components/[componentId] - Get a specific component
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string; componentId: string } }
) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get component
        const component = await getComponentByComponentId(params.componentId);

        if (!component) {
            return NextResponse.json({ error: 'Component not found' }, { status: 404 });
        }

        // Verify user has access to the project
        const canvas = await prisma.canvas.findUnique({
            where: { id: component.canvasId },
            include: {
                project: {
                    include: {
                        team: {
                            include: {
                                members: {
                                    where: { userId: session.user.id },
                                },
                            },
                        },
                    },
                },
            },
        });

        if (!canvas) {
            return NextResponse.json({ error: 'Canvas not found' }, { status: 404 });
        }

        // Check access
        const project = canvas.project;
        const hasAccess = !project.teamId
            ? project.createdById === session.user.id
            : project.team?.members && project.team.members.length > 0;

        if (!hasAccess) {
            return NextResponse.json({ error: 'Access denied' }, { status: 403 });
        }

        return NextResponse.json({ component });
    } catch (error) {
        console.error('Error fetching component:', error);
        return NextResponse.json(
            { error: 'Failed to fetch component' },
            { status: 500 }
        );
    }
}

// PATCH /api/projects/[id]/components/[componentId] - Update a component
export async function PATCH(
    request: NextRequest,
    { params }: { params: { id: string; componentId: string } }
) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get component
        const component = await getComponentByComponentId(params.componentId);

        if (!component) {
            return NextResponse.json({ error: 'Component not found' }, { status: 404 });
        }

        // Verify user has write access
        const canvas = await prisma.canvas.findUnique({
            where: { id: component.canvasId },
            include: {
                project: {
                    include: {
                        team: {
                            include: {
                                members: {
                                    where: { userId: session.user.id },
                                },
                            },
                        },
                    },
                },
            },
        });

        if (!canvas) {
            return NextResponse.json({ error: 'Canvas not found' }, { status: 404 });
        }

        const project = canvas.project;
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

        // Validate and update
        const body = await request.json();
        const validatedData = updateComponentSchema.parse(body);

        const updatedComponent = await updateComponent(component.id, validatedData);

        return NextResponse.json({ component: updatedComponent });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: 'Invalid request data', details: error.issues },
                { status: 400 }
            );
        }

        console.error('Error updating component:', error);
        return NextResponse.json(
            { error: 'Failed to update component' },
            { status: 500 }
        );
    }
}

// DELETE /api/projects/[id]/components/[componentId] - Delete a component
export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string; componentId: string } }
) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get component
        const component = await getComponentByComponentId(params.componentId);

        if (!component) {
            return NextResponse.json({ error: 'Component not found' }, { status: 404 });
        }

        // Verify user has write access
        const canvas = await prisma.canvas.findUnique({
            where: { id: component.canvasId },
            include: {
                project: {
                    include: {
                        team: {
                            include: {
                                members: {
                                    where: { userId: session.user.id },
                                },
                            },
                        },
                    },
                },
            },
        });

        if (!canvas) {
            return NextResponse.json({ error: 'Canvas not found' }, { status: 404 });
        }

        const project = canvas.project;
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

        // Delete component
        await deleteComponent(component.id);

        return NextResponse.json({ message: 'Component deleted successfully' });
    } catch (error) {
        console.error('Error deleting component:', error);
        return NextResponse.json(
            { error: 'Failed to delete component' },
            { status: 500 }
        );
    }
}
