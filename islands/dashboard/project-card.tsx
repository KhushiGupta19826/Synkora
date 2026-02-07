"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Calendar, Users, MoreVertical, UserPlus } from "lucide-react";
import Link from "next/link";
import { InviteProjectMemberModal } from "@/components/projects/invite-project-member-modal";
import { motion } from "framer-motion";

interface ProjectCardProps {
    project: {
        id: string;
        name: string;
        description: string | null;
        team?: {
            name: string;
            members: { id: string }[];
        } | null;
        _count?: {
            tasks: number;
        };
    };
}

export function ProjectCard({ project }: ProjectCardProps) {
    const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
    const taskCount = project._count?.tasks || 0;
    const memberCount = project.team?.members?.length || 0;

    return (
        <>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
            >
                <Card className="hover:shadow-lg transition-shadow duration-200 h-full">
                    <CardHeader>
                        <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                                <CardTitle className="line-clamp-1">{project.name}</CardTitle>
                                <CardDescription className="line-clamp-2">
                                    {project.description || "No description"}
                                </CardDescription>
                            </div>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                        <MoreVertical className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => setIsInviteModalOpen(true)}>
                                        <UserPlus className="mr-2 h-4 w-4" />
                                        Invite Member
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                                <Users className="h-4 w-4" />
                                <span>{memberCount} {memberCount === 1 ? "member" : "members"}</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                <span>{taskCount} {taskCount === 1 ? "task" : "tasks"}</span>
                            </div>
                        </div>
                        <div className="mt-2 text-xs text-muted-foreground">
                            {project.team ? `Team: ${project.team.name}` : "Personal Project"}
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Link href={`/projects/${project.id}/kanban`} className="w-full">
                            <Button className="w-full">Open Project</Button>
                        </Link>
                    </CardFooter>
                </Card>
            </motion.div>

            <InviteProjectMemberModal
                open={isInviteModalOpen}
                onClose={() => setIsInviteModalOpen(false)}
                projectId={project.id}
                projectName={project.name}
                onInviteSent={() => setIsInviteModalOpen(false)}
            />
        </>
    );
}
