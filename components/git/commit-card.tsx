"use client";

import { useState, useEffect } from "react";
import { GitCommit, ExternalLink, User, Calendar, Tag, X } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getComponentColorScheme, getComponentTypeLabel } from '@/lib/component-colors';
import { ComponentType } from '@/types/architecture';

interface CommitCardProps {
    commit: {
        sha: string;
        message: string;
        author: string;
        authorEmail: string;
        committedAt: Date | string;
        url: string;
    };
    projectId?: string;
    onExplainCommit?: (sha: string) => void;
}

interface Component {
    id: string;
    componentId: string;
    name: string;
    type: ComponentType;
}

interface ComponentTag {
    componentId: string;
    componentName: string;
    taggedAt: string;
}

export function CommitCard({ commit, projectId, onExplainCommit }: CommitCardProps) {
    const [components, setComponents] = useState<Component[]>([]);
    const [taggedComponents, setTaggedComponents] = useState<ComponentTag[]>([]);
    const [loading, setLoading] = useState(false);
    const [showTagging, setShowTagging] = useState(false);

    const commitDate = new Date(commit.committedAt);
    const shortSha = commit.sha.substring(0, 7);

    // Get first line of commit message
    const firstLine = commit.message.split("\n")[0];
    const hasMoreLines = commit.message.split("\n").length > 1;

    useEffect(() => {
        if (projectId && showTagging) {
            fetchComponents();
        }
        if (projectId) {
            fetchTaggedComponents();
        }
    }, [projectId, showTagging]);

    const fetchComponents = async () => {
        try {
            const response = await fetch(`/api/projects/${projectId}/components-list`);
            if (response.ok) {
                const data = await response.json();
                setComponents(data.components);
            }
        } catch (error) {
            console.error('Error fetching components:', error);
        }
    };

    const fetchTaggedComponents = async () => {
        try {
            const response = await fetch(`/api/commits/${commit.sha}/tags`);
            if (response.ok) {
                const data = await response.json();
                setTaggedComponents(data.tags || []);
            }
        } catch (error) {
            console.error('Error fetching tagged components:', error);
        }
    };

    const handleTagComponent = async (componentId: string) => {
        try {
            setLoading(true);
            const response = await fetch(`/api/commits/${commit.sha}/tag`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ componentId }),
            });

            if (response.ok) {
                await fetchTaggedComponents();
                setShowTagging(false);
            } else {
                console.error('Failed to tag component');
            }
        } catch (error) {
            console.error('Error tagging component:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleRemoveTag = async (componentId: string) => {
        try {
            setLoading(true);
            const response = await fetch(`/api/commits/${commit.sha}/tag`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ componentId }),
            });

            if (response.ok) {
                await fetchTaggedComponents();
            } else {
                console.error('Failed to remove component tag');
            }
        } catch (error) {
            console.error('Error removing component tag:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card className="p-4 hover:shadow-md transition-shadow">
            <div className="flex items-start gap-4">
                <div className="flex-shrink-0 mt-1">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <GitCommit className="w-5 h-5 text-primary" />
                    </div>
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex-1">
                            <p className="font-medium text-sm mb-1">
                                {firstLine}
                                {hasMoreLines && (
                                    <span className="text-muted-foreground ml-1">...</span>
                                )}
                            </p>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                <div className="flex items-center gap-1">
                                    <User className="w-3 h-3" />
                                    <span>{commit.author}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    <span>
                                        {commitDate.toLocaleDateString()} at{" "}
                                        {commitDate.toLocaleTimeString([], {
                                            hour: "2-digit",
                                            minute: "2-digit",
                                        })}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <Badge variant="secondary" className="font-mono text-xs">
                            {shortSha}
                        </Badge>
                    </div>

                    {/* Tagged Components */}
                    {taggedComponents.length > 0 && (
                        <div className="mb-3">
                            <div className="flex flex-wrap gap-1">
                                {taggedComponents.map((tag) => (
                                    <Badge
                                        key={tag.componentId}
                                        variant="outline"
                                        className="text-xs flex items-center gap-1"
                                    >
                                        <Tag className="w-3 h-3" />
                                        {tag.componentName}
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground"
                                            onClick={() => handleRemoveTag(tag.componentId)}
                                            disabled={loading}
                                        >
                                            <X className="w-3 h-3" />
                                        </Button>
                                    </Badge>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Component Tagging Dropdown */}
                    {showTagging && projectId && (
                        <div className="mb-3">
                            <Select onValueChange={handleTagComponent} disabled={loading}>
                                <SelectTrigger className="h-8 text-xs">
                                    <SelectValue placeholder="Select component to tag..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {components
                                        .filter(comp => !taggedComponents.some(tag => tag.componentId === comp.id))
                                        .map((component) => {
                                            const colorScheme = getComponentColorScheme(component.type);
                                            return (
                                                <SelectItem key={component.id} value={component.id}>
                                                    <div className="flex items-center gap-2">
                                                        <Badge variant="outline" className={`text-xs ${colorScheme.badgeClass}`}>
                                                            {getComponentTypeLabel(component.type)}
                                                        </Badge>
                                                        {component.name}
                                                    </div>
                                                </SelectItem>
                                            );
                                        })}
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs"
                            onClick={() => window.open(commit.url, "_blank")}
                        >
                            <ExternalLink className="w-3 h-3 mr-1" />
                            View on GitHub
                        </Button>

                        {projectId && (
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 text-xs"
                                onClick={() => setShowTagging(!showTagging)}
                            >
                                <Tag className="w-3 h-3 mr-1" />
                                {showTagging ? 'Cancel' : 'Tag Component'}
                            </Button>
                        )}

                        {onExplainCommit && (
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 text-xs"
                                onClick={() => onExplainCommit(commit.sha)}
                            >
                                Explain with AI
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </Card>
    );
}
