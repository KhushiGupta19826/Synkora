"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreVertical, Settings, UserPlus, Menu } from "lucide-react";
import { InviteProjectMemberModal } from "@/components/projects/invite-project-member-modal";
import { ProjectBreadcrumb } from "./project-breadcrumb";

type ProjectWithRelations = {
    id: string;
    name: string;
    description: string | null;
    team?: {
        name: string;
        members: {
            user: {
                id: string;
                name: string | null;
                email: string;
            };
        }[];
    } | null;
};

interface ProjectHeaderProps {
    project: ProjectWithRelations;
    onProjectUpdate(): void;
    onMenuClick?(): void;
}

export function ProjectHeader({ project, onProjectUpdate, onMenuClick }: ProjectHeaderProps) {
    const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);

    return (
        <>
            <header className="bg-white dark:bg-gray-950 border-b dark:border-gray-800 px-4 md:px-6 py-4">
                <div className="space-y-3">
                    {/* Breadcrumb Navigation */}
                    <ProjectBreadcrumb
                        projectId={project.id}
                        projectName={project.name}
                    />

                    {/* Project Header */}
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                            {/* Mobile Menu Button */}
                            <Button
                                variant="ghost"
                                size="sm"
                                className="lg:hidden h-8 w-8 p-0"
                                onClick={onMenuClick}
                            >
                                <Menu className="h-5 w-5" />
                            </Button>

                            <div className="min-w-0 flex-1">
                                <h1 className="text-xl md:text-2xl font-bold truncate">{project.name}</h1>
                                {project.description && (
                                    <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                                        {project.description}
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center gap-2 flex-shrink-0">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setIsInviteModalOpen(true)}
                                className="hidden sm:flex"
                            >
                                <UserPlus className="h-4 w-4 mr-2" />
                                Invite
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setIsInviteModalOpen(true)}
                                className="sm:hidden h-8 w-8 p-0"
                            >
                                <UserPlus className="h-4 w-4" />
                            </Button>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                        <MoreVertical className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem>
                                        <Settings className="mr-2 h-4 w-4" />
                                        Project Settings
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>
                </div>
            </header>

            <InviteProjectMemberModal
                open={isInviteModalOpen}
                onClose={() => setIsInviteModalOpen(false)}
                projectId={project.id}
                projectName={project.name}
                onInviteSent={() => {
                    setIsInviteModalOpen(false);
                    onProjectUpdate();
                }}
            />
        </>
    );
}
