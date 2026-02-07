"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Bot, GitBranch } from "lucide-react";

interface QuickActionsProps {
    onCreateProject(): void;
}

export function QuickActions({ onCreateProject }: QuickActionsProps) {
    return (
        <Card className="glass shadow-glass">
            <CardHeader>
                <CardTitle className="text-lg">Quick Actions</CardTitle>
                <CardDescription>Get started with common tasks</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
                <Button onClick={onCreateProject} className="w-full justify-start" variant="outline">
                    <Plus className="mr-2 h-4 w-4" />
                    Create New Project
                </Button>
                <Button className="w-full justify-start" variant="outline" disabled>
                    <Bot className="mr-2 h-4 w-4" />
                    Open AI Assistant
                </Button>
                <Button className="w-full justify-start" variant="outline" disabled>
                    <GitBranch className="mr-2 h-4 w-4" />
                    View Git Repositories
                </Button>
            </CardContent>
        </Card>
    );
}
