"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Bell } from "lucide-react";
import { ProjectInvitationsList } from "@/components/projects/project-invitations-list";
import { TeamInvitationsList } from "@/components/teams/team-invitations-list";

export function InvitationNotificationBadge() {
    const [totalInvitations, setTotalInvitations] = useState(0);
    const [isOpen, setIsOpen] = useState(false);

    const fetchInvitationCount = async () => {
        try {
            const [projectRes, teamRes] = await Promise.all([
                fetch("/api/project-invitations"),
                fetch("/api/team-invitations"),
            ]);

            let count = 0;
            if (projectRes.ok) {
                const projectData = await projectRes.json();
                count += projectData.length;
            }
            if (teamRes.ok) {
                const teamData = await teamRes.json();
                count += teamData.length;
            }

            setTotalInvitations(count);
        } catch (error) {
            console.error("Error fetching invitation count:", error);
        }
    };

    useEffect(() => {
        fetchInvitationCount();
        // Refresh every 30 seconds
        const interval = setInterval(fetchInvitationCount, 30000);
        return () => clearInterval(interval);
    }, []);

    // Refresh when dropdown is opened
    useEffect(() => {
        if (isOpen) {
            fetchInvitationCount();
        }
    }, [isOpen]);

    return (
        <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="relative">
                    <Bell className="h-5 w-5" />
                    {totalInvitations > 0 && (
                        <Badge
                            variant="destructive"
                            className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
                        >
                            {totalInvitations}
                        </Badge>
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-96 max-h-[500px] overflow-y-auto">
                <div className="p-4 space-y-4">
                    <h3 className="font-semibold text-lg">Invitations</h3>
                    {totalInvitations === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-8">
                            No pending invitations
                        </p>
                    ) : (
                        <div className="space-y-4">
                            <ProjectInvitationsList />
                            <TeamInvitationsList />
                        </div>
                    )}
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
