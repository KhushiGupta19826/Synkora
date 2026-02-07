import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { CollaborativeCanvas } from '@/components/canvas/collaborative-canvas';
import { ComponentList } from '@/components/canvas/component-list';
import 'tldraw/tldraw.css';

interface CanvasPageProps {
    params: {
        projectId: string;
    };
}

export default async function CanvasPage({ params }: CanvasPageProps) {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
        redirect('/login');
    }

    // Verify user has access to this project
    const project = await prisma.project.findUnique({
        where: {
            id: params.projectId,
        },
        include: {
            canvas: true,
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
        redirect('/dashboard');
    }

    // Check access: personal project creator or team member
    const hasAccess = !project.teamId
        ? project.createdById === session.user.id
        : project.team?.members && project.team.members.length > 0;

    if (!hasAccess) {
        redirect('/dashboard');
    }

    // Get or create canvas for this project
    let canvas = project.canvas;
    if (!canvas) {
        canvas = await prisma.canvas.create({
            data: {
                projectId: params.projectId,
                state: {},
                version: 0,
            },
        });
    }

    return (
        <div className="h-[calc(100vh-8rem)] w-full flex">
            <div className="flex-1">
                <CollaborativeCanvas projectId={params.projectId} canvasId={canvas.id} />
            </div>
        </div>
    );
}
