"use client";

import { useState, useEffect } from "react";
import { FileText, Plus, Trash2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { formatDistanceToNow } from "date-fns";

interface MarkdownFile {
    id: string;
    title: string;
    createdAt: string;
    updatedAt: string;
    isOrphaned?: boolean;
    linkedComponents?: Array<{ id: string; name: string }>;
    linkedDecisions?: Array<{ id: string; title: string }>;
}

interface Component {
    id: string;
    name: string;
    componentId: string;
}

interface Decision {
    id: string;
    title: string;
}

interface MarkdownFileListProps {
    files: MarkdownFile[];
    selectedFileId: string | null;
    projectId: string;
    onSelectFile(fileId: string): void;
    onCreateFile(title: string, linkedComponentIds: string[], linkedDecisionIds: string[]): Promise<void>;
    onDeleteFile(fieldId: string): Promise<void>;
}

export function MarkdownFileList({
    files,
    selectedFileId,
    projectId,
    onSelectFile,
    onCreateFile,
    onDeleteFile,
}: MarkdownFileListProps) {
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [newFileTitle, setNewFileTitle] = useState("");
    const [isCreating, setIsCreating] = useState(false);
    const [components, setComponents] = useState<Component[]>([]);
    const [decisions, setDecisions] = useState<Decision[]>([]);
    const [selectedComponentIds, setSelectedComponentIds] = useState<string[]>([]);
    const [selectedDecisionIds, setSelectedDecisionIds] = useState<string[]>([]);
    const [loadingOptions, setLoadingOptions] = useState(false);

    // Fetch components and decisions when dialog opens
    useEffect(() => {
        if (isCreateDialogOpen) {
            fetchLinkOptions();
        }
    }, [isCreateDialogOpen]);

    const fetchLinkOptions = async () => {
        setLoadingOptions(true);
        try {
            const [componentsRes, decisionsRes] = await Promise.all([
                fetch(`/api/projects/${projectId}/components`),
                fetch(`/api/projects/${projectId}/decisions`),
            ]);

            if (componentsRes.ok) {
                const componentsData = await componentsRes.json();
                setComponents(componentsData);
            }

            if (decisionsRes.ok) {
                const decisionsData = await decisionsRes.json();
                setDecisions(decisionsData);
            }
        } catch (error) {
            console.error("Error fetching link options:", error);
        } finally {
            setLoadingOptions(false);
        }
    };

    const handleCreateFile = async () => {
        if (!newFileTitle.trim()) return;

        setIsCreating(true);
        try {
            await onCreateFile(newFileTitle, selectedComponentIds, selectedDecisionIds);
            setNewFileTitle("");
            setSelectedComponentIds([]);
            setSelectedDecisionIds([]);
            setIsCreateDialogOpen(false);
        } catch (error) {
            console.error("Error creating file:", error);
        } finally {
            setIsCreating(false);
        }
    };

    const toggleComponent = (componentId: string) => {
        setSelectedComponentIds(prev =>
            prev.includes(componentId)
                ? prev.filter(id => id !== componentId)
                : [...prev, componentId]
        );
    };

    const toggleDecision = (decisionId: string) => {
        setSelectedDecisionIds(prev =>
            prev.includes(decisionId)
                ? prev.filter(id => id !== decisionId)
                : [...prev, decisionId]
        );
    };

    return (
        <div className="w-64 border-r dark:border-gray-800 bg-white dark:bg-gray-950 flex flex-col">
            <div className="p-4 border-b dark:border-gray-800">
                <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                    <DialogTrigger asChild>
                        <Button className="w-full" size="sm">
                            <Plus className="h-4 w-4 mr-2" />
                            New Document
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>Create New Document</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                            <div>
                                <Label htmlFor="title">Document Title</Label>
                                <Input
                                    id="title"
                                    placeholder="Document title"
                                    value={newFileTitle}
                                    onChange={(e) => setNewFileTitle(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter" && !e.shiftKey) {
                                            e.preventDefault();
                                            handleCreateFile();
                                        }
                                    }}
                                />
                            </div>

                            {loadingOptions ? (
                                <div className="text-sm text-gray-500">Loading link options...</div>
                            ) : (
                                <>
                                    {/* Link to Components */}
                                    <div>
                                        <Label className="text-sm font-medium mb-2 block">
                                            Link to Components (Optional)
                                        </Label>
                                        {components.length === 0 ? (
                                            <p className="text-xs text-gray-500">No components available</p>
                                        ) : (
                                            <div className="space-y-1 max-h-32 overflow-y-auto border rounded p-2">
                                                {components.map((component) => (
                                                    <label
                                                        key={component.id}
                                                        className="flex items-center gap-2 p-1 hover:bg-gray-50 rounded cursor-pointer"
                                                    >
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedComponentIds.includes(component.id)}
                                                            onChange={() => toggleComponent(component.id)}
                                                            className="rounded"
                                                        />
                                                        <span className="text-sm">{component.name}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* Link to Decisions */}
                                    <div>
                                        <Label className="text-sm font-medium mb-2 block">
                                            Link to Decisions (Optional)
                                        </Label>
                                        {decisions.length === 0 ? (
                                            <p className="text-xs text-gray-500">No decisions available</p>
                                        ) : (
                                            <div className="space-y-1 max-h-32 overflow-y-auto border rounded p-2">
                                                {decisions.map((decision) => (
                                                    <label
                                                        key={decision.id}
                                                        className="flex items-center gap-2 p-1 hover:bg-gray-50 rounded cursor-pointer"
                                                    >
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedDecisionIds.includes(decision.id)}
                                                            onChange={() => toggleDecision(decision.id)}
                                                            className="rounded"
                                                        />
                                                        <span className="text-sm">{decision.title}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {selectedComponentIds.length === 0 && selectedDecisionIds.length === 0 && (
                                        <div className="flex items-start gap-2 p-2 bg-amber-50 border border-amber-200 rounded text-xs text-amber-800">
                                            <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                                            <span>
                                                Documents without links will be marked as "Orphaned". Consider linking to at least one component or decision.
                                            </span>
                                        </div>
                                    )}
                                </>
                            )}

                            <Button
                                onClick={handleCreateFile}
                                disabled={!newFileTitle.trim() || isCreating}
                                className="w-full"
                            >
                                {isCreating ? "Creating..." : "Create"}
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="flex-1 overflow-y-auto">
                {files.length === 0 ? (
                    <div className="p-4 text-center text-sm text-slate-500 dark:text-slate-400">
                        No documents yet. Create one to get started.
                    </div>
                ) : (
                    <div className="space-y-1 p-2">
                        {files.map((file) => (
                            <div
                                key={file.id}
                                className={`group flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${selectedFileId === file.id
                                    ? "bg-primary/10 text-primary"
                                    : "hover:bg-slate-100 dark:hover:bg-gray-800"
                                    }`}
                                onClick={() => onSelectFile(file.id)}
                            >
                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                    <FileText className="h-4 w-4 flex-shrink-0" />
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <div className="font-medium truncate text-sm">
                                                {file.title}
                                            </div>
                                            {file.isOrphaned && (
                                                <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-300">
                                                    Orphaned
                                                </Badge>
                                            )}
                                        </div>
                                        <div className="text-xs text-slate-500 dark:text-slate-400">
                                            {formatDistanceToNow(new Date(file.updatedAt), {
                                                addSuffix: true,
                                            })}
                                        </div>
                                    </div>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (confirm("Delete this document?")) {
                                            onDeleteFile(file.id);
                                        }
                                    }}
                                >
                                    <Trash2 className="h-3 w-3" />
                                </Button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
