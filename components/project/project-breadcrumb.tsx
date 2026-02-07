"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProjectBreadcrumbProps {
    projectId: string;
    projectName: string;
}

const tabNames: Record<string, string> = {
    kanban: "Execution Board",
    analytics: "Analytics",
    canvas: "Architecture Map",
    markdown: "Markdown",
    spreadsheet: "Spreadsheet",
    git: "Git Activity",
};

export function ProjectBreadcrumb({ projectId, projectName }: ProjectBreadcrumbProps) {
    const pathname = usePathname();

    // Extract the current tab from the pathname
    const pathSegments = pathname?.split("/").filter(Boolean) || [];
    const currentTab = pathSegments[pathSegments.length - 1];
    const tabDisplayName = tabNames[currentTab] || currentTab;

    return (
        <nav className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link
                href="/dashboard"
                className="flex items-center gap-1 hover:text-foreground transition-colors"
            >
                <Home className="h-4 w-4" />
                Dashboard
            </Link>
            <ChevronRight className="h-4 w-4" />
            <span className="text-foreground font-medium">{projectName}</span>
            {currentTab && currentTab !== projectId && (
                <>
                    <ChevronRight className="h-4 w-4" />
                    <span className="text-foreground">{tabDisplayName}</span>
                </>
            )}
        </nav>
    );
}
