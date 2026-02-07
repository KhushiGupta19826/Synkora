"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Plus, Users, FolderKanban } from "lucide-react";
import { CreateTeamModal } from "@/components/teams/create-team-modal";
import { TeamInvitationsList } from "@/components/teams/team-invitations-list";

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

interface Team {
    id: string;
    name: string;
    createdAt: string;
    members: TeamMember[];
    _count: {
        projects: number;
    };
}

export default function TeamsPage() {
    const router = useRouter();
    const [teams, setTeams] = useState<Team[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);

    const fetchTeams = async () => {
        try {
            const response = await fetch("/api/teams");
            if (response.ok) {
                const data = await response.json();
                setTeams(data);
            }
        } catch (error) {
            console.error("Error fetching teams:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTeams();
    }, []);

    const handleTeamCreated = (newTeam: Team) => {
        setTeams([newTeam, ...teams]);
        setShowCreateModal(false);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-muted-foreground">Loading teams...</div>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-6 max-w-7xl">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold">Teams</h1>
                    <p className="text-muted-foreground mt-1">
                        Manage your teams and collaborate with others
                    </p>
                </div>
                <Button onClick={() => setShowCreateModal(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Team
                </Button>
            </div>

            <TeamInvitationsList />

            {teams.length === 0 ? (
                <Card className="p-12 text-center">
                    <Users className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-xl font-semibold mb-2">No teams yet</h3>
                    <p className="text-muted-foreground mb-6">
                        Create your first team to start collaborating
                    </p>
                    <Button onClick={() => setShowCreateModal(true)}>
                        <Plus className="w-4 h-4 mr-2" />
                        Create Team
                    </Button>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {teams.map((team) => (
                        <Card
                            key={team.id}
                            className="p-6 hover:shadow-lg transition-shadow cursor-pointer"
                            onClick={() => router.push(`/teams/${team.id}`)}
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                                        <Users className="w-6 h-6 text-primary" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-lg">{team.name}</h3>
                                        <p className="text-sm text-muted-foreground">
                                            {team.members.length} member{team.members.length !== 1 ? "s" : ""}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <div className="flex items-center gap-1">
                                    <FolderKanban className="w-4 h-4" />
                                    <span>{team._count.projects} project{team._count.projects !== 1 ? "s" : ""}</span>
                                </div>
                            </div>

                            <div className="mt-4 flex -space-x-2">
                                {team.members.slice(0, 5).map((member) => (
                                    <div
                                        key={member.id}
                                        className="w-8 h-8 rounded-full bg-primary/20 border-2 border-background flex items-center justify-center text-xs font-medium"
                                        title={member.user.name || member.user.email}
                                    >
                                        {member.user.name?.[0]?.toUpperCase() || member.user.email[0].toUpperCase()}
                                    </div>
                                ))}
                                {team.members.length > 5 && (
                                    <div className="w-8 h-8 rounded-full bg-muted border-2 border-background flex items-center justify-center text-xs font-medium">
                                        +{team.members.length - 5}
                                    </div>
                                )}
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            <CreateTeamModal
                open={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                onTeamCreated={handleTeamCreated}
            />
        </div>
    );
}
