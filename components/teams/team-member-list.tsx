"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MoreVertical, Trash2, Shield, Eye, Edit } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

interface TeamMember {
    id: string;
    role: string;
    user: {
        id: string;
        name: string | null;
        email: string;
        image: string | null;
    };
}

interface TeamMemberListProps {
    teamId: string;
    members: TeamMember[];
    currentUserRole: string | null;
    onMembersUpdated(): void;
}

export function TeamMemberList({
    teamId,
    members,
    currentUserRole,
    onMembersUpdated,
}: TeamMemberListProps) {
    const [loading, setLoading] = useState<string | null>(null);

    const isOwner = currentUserRole === "OWNER";

    const handleUpdateRole = async (userId: string, newRole: string) => {
        setLoading(userId);
        try {
            const response = await fetch(`/api/teams/${teamId}/members/${userId}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ role: newRole }),
            });

            if (response.ok) {
                onMembersUpdated();
            } else {
                const data = await response.json();
                alert(data.error || "Failed to update member role");
            }
        } catch (error) {
            alert("An error occurred. Please try again.");
        } finally {
            setLoading(null);
        }
    };

    const handleRemoveMember = async (userId: string, userName: string) => {
        if (!confirm(`Are you sure you want to remove ${userName} from this team?`)) {
            return;
        }

        setLoading(userId);
        try {
            const response = await fetch(`/api/teams/${teamId}/members/${userId}`, {
                method: "DELETE",
            });

            if (response.ok) {
                onMembersUpdated();
            } else {
                const data = await response.json();
                alert(data.error || "Failed to remove member");
            }
        } catch (error) {
            alert("An error occurred. Please try again.");
        } finally {
            setLoading(null);
        }
    };

    const getRoleBadgeVariant = (role: string) => {
        switch (role) {
            case "OWNER":
                return "default";
            case "EDITOR":
                return "secondary";
            case "VIEWER":
                return "outline";
            default:
                return "outline";
        }
    };

    const getRoleIcon = (role: string) => {
        switch (role) {
            case "OWNER":
                return <Shield className="w-3 h-3" />;
            case "EDITOR":
                return <Edit className="w-3 h-3" />;
            case "VIEWER":
                return <Eye className="w-3 h-3" />;
            default:
                return null;
        }
    };

    return (
        <div className="space-y-4">
            {members.map((member) => (
                <Card key={member.id} className="p-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-lg font-medium">
                                {member.user.name?.[0]?.toUpperCase() || member.user.email[0].toUpperCase()}
                            </div>
                            <div>
                                <div className="font-medium">
                                    {member.user.name || member.user.email}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                    {member.user.email}
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <Badge variant={getRoleBadgeVariant(member.role)} className="gap-1">
                                {getRoleIcon(member.role)}
                                {member.role}
                            </Badge>

                            {isOwner && (
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            disabled={loading === member.user.id}
                                        >
                                            <MoreVertical className="w-4 h-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem
                                            onClick={() => handleUpdateRole(member.user.id, "OWNER")}
                                            disabled={member.role === "OWNER"}
                                        >
                                            <Shield className="w-4 h-4 mr-2" />
                                            Make Owner
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                            onClick={() => handleUpdateRole(member.user.id, "EDITOR")}
                                            disabled={member.role === "EDITOR"}
                                        >
                                            <Edit className="w-4 h-4 mr-2" />
                                            Make Editor
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                            onClick={() => handleUpdateRole(member.user.id, "VIEWER")}
                                            disabled={member.role === "VIEWER"}
                                        >
                                            <Eye className="w-4 h-4 mr-2" />
                                            Make Viewer
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem
                                            onClick={() => handleRemoveMember(member.user.id, member.user.name || member.user.email)}
                                            className="text-red-600"
                                        >
                                            <Trash2 className="w-4 h-4 mr-2" />
                                            Remove from Team
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            )}
                        </div>
                    </div>
                </Card>
            ))}
        </div>
    );
}
