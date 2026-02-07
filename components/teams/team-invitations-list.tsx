"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, Check, X, Clock } from "lucide-react";

interface TeamInvitation {
    id: string;
    email: string;
    role: string;
    status: string;
    createdAt: string;
    expiresAt: string;
    team: {
        id: string;
        name: string;
        _count: {
            members: number;
            projects: number;
        };
    };
}

export function TeamInvitationsList() {
    const [invitations, setInvitations] = useState<TeamInvitation[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    const fetchInvitations = async () => {
        try {
            const response = await fetch("/api/team-invitations");
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

    const handleAccept = async (invitationId: string) => {
        setActionLoading(invitationId);
        try {
            const response = await fetch(`/api/team-invitations/${invitationId}/accept`, {
                method: "POST",
            });

            if (response.ok) {
                setInvitations(invitations.filter((inv) => inv.id !== invitationId));
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
            const response = await fetch(`/api/team-invitations/${invitationId}/reject`, {
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
            <h2 className="text-xl font-semibold">Team Invitations</h2>
            {invitations.map((invitation) => (
                <Card key={invitation.id} className="p-4">
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-4 flex-1">
                            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                                <Users className="w-6 h-6 text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-lg">{invitation.team.name}</h3>
                                <p className="text-sm text-muted-foreground mt-1">
                                    You've been invited to join this team as a{" "}
                                    <Badge variant="secondary" className="ml-1">
                                        {invitation.role}
                                    </Badge>
                                </p>
                                <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                                    <span>{invitation.team._count.members} members</span>
                                    <span>·</span>
                                    <span>{invitation.team._count.projects} projects</span>
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
                                onClick={() => handleAccept(invitation.id)}
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
