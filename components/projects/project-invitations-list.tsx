"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FolderKanban, Check, X, Clock } from "lucide-react";
import { useRouter } from "next/navigation";

interface ProjectInvitation {
    id: string;
    email: string;
    role: string;
    status: string;
    createdAt: string;
    expiresAt: string;
    project: {
        id: string;
        name: string;
        description: string | null;
        team: {
            id: string;
            name: string;
        };
        _count: {
            tasks: number;
        };
    };
}

export function ProjectInvitationsList() {
    const router = useRouter();
    const [invitations, setInvitations] = useState<ProjectInvitation[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    const fetchInvitations = async () => {
        try {
            const response = await fetch("/api/project-invitations");
            if (response.ok) {
                const data = await response.json();
                setInvitations(data);
            }
        } catch (error) {
            console.error("Error fetching invitations:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchInvitations();
    }, []);

    const handleAccept = async (invitationId: string, projectId: string) => {
        setActionLoading(invitationId);
        try {
            const response = await fetch(`/api/project-invitations/${invitationId}/accept`, {
                method: "POST",
            });

            if (response.ok) {
                setInvitations(invitations.filter((inv) => inv.id !== invitationId));
                // Optionally redirect to the project
                router.push(`/projects/${projectId}`);
            } else {
                const data = await response.json();
                alert(data.error || "Failed to accept invitation");
            }
        } catch (error) {
            alert("An error occurred. Please try again.");
        } finally {
            setActionLoading(null);
        }
    };

    const handleReject = async (invitationId: string) => {
        setActionLoading(invitationId);
        try {
            const response = await fetch(`/api/project-invitations/${invitationId}/reject`, {
                method: "POST",
            });

            if (response.ok) {
                setInvitations(invitations.filter((inv) => inv.id !== invitationId));
            } else {
                const data = await response.json();
                alert(data.error || "Failed to reject invitation");
            }
        } catch (error) {
            alert("An error occurred. Please try again.");
        } finally {
            setActionLoading(null);
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
        });
    };

    if (loading) {
        return (
            <div className="text-center py-8 text-muted-foreground">
                Loading invitations...
            </div>
        );
    }

    if (invitations.length === 0) {
        return null;
    }

    return (
        <div className="space-y-4">
            <h2 className="text-xl font-semibold">Project Invitations</h2>
            {invitations.map((invitation) => (
                <Card key={invitation.id} className="p-4">
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-4 flex-1">
                            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                                <FolderKanban className="w-6 h-6 text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-lg">{invitation.project.name}</h3>
                                {invitation.project.description && (
                                    <p className="text-sm text-muted-foreground mt-1">
                                        {invitation.project.description}
                                    </p>
                                )}
                                <p className="text-sm text-muted-foreground mt-1">
                                    You've been invited to collaborate as a{" "}
                                    <Badge variant="secondary" className="ml-1">
                                        {invitation.role}
                                    </Badge>
                                </p>
                                <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                                    <span>Team: {invitation.project.team.name}</span>
                                    <span>·</span>
                                    <span>{invitation.project._count.tasks} tasks</span>
                                    <span>·</span>
                                    <div className="flex items-center gap-1">
                                        <Clock className="w-3 h-3" />
                                        <span>Expires {formatDate(invitation.expiresAt)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-2 flex-shrink-0">
                            <Button
                                size="sm"
                                onClick={() => handleAccept(invitation.id, invitation.project.id)}
                                disabled={actionLoading === invitation.id}
                            >
                                <Check className="w-4 h-4 mr-1" />
                                Accept
                            </Button>
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleReject(invitation.id)}
                                disabled={actionLoading === invitation.id}
                            >
                                <X className="w-4 h-4 mr-1" />
                                Decline
                            </Button>
                        </div>
                    </div>
                </Card>
            ))}
        </div>
    );
}
