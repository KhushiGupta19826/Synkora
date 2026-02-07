"use client";

import { useSocket } from "@/hooks/use-socket";
import { ConnectionStatus } from "@/components/ui/connection-status";
import { UserPresence } from "@/components/project/user-presence";
import { useSession } from "next-auth/react";

interface ProjectCollaborationProps {
    projectId: string;
}

/**
 * Component that provides real-time collaboration features for a project.
 * This includes connection status, active users, and presence indicators.
 * 
 * Usage:
 * <ProjectCollaboration projectId={projectId} />
 */
export function ProjectCollaboration({ projectId }: ProjectCollaborationProps) {
    const { data: session } = useSession();
    const { isConnected, isReconnecting, activeUsers } = useSocket({
        projectId,
        autoConnect: true,
    });

    return (
        <div className="flex items-center gap-4">
            <ConnectionStatus
                isConnected={isConnected}
                isReconnecting={isReconnecting}
                showText={false}
            />
            <UserPresence
                users={activeUsers}
                currentUserId={session?.user?.id}
            />
        </div>
    );
}
