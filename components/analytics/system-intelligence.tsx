"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Brain, AlertTriangle, HelpCircle, Loader2, Sparkles } from "lucide-react";

type Intent = 'explain_system' | 'identify_risks' | 'why_design';

interface SystemIntelligenceProps {
    projectId: string;
}

export function SystemIntelligence({ projectId }: SystemIntelligenceProps) {
    const [selectedIntent, setSelectedIntent] = useState<Intent | null>(null);
    const [response, setResponse] = useState<string>("");
    const [loading, setLoading] = useState(false);

    const handleIntentClick = async (intent: Intent) => {
        setSelectedIntent(intent);
        setLoading(true);
        setResponse("");

        try {
            const res = await fetch(`/api/projects/${projectId}/system-intelligence`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ intent }),
            });

            if (!res.ok) {
                throw new Error("Failed to get response");
            }

            const data = await res.json();
            setResponse(data.response);
        } catch (error) {
            console.error("Error getting AI response:", error);
            setResponse("Sorry, I encountered an error processing your request. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const intents = [
        {
            id: 'explain_system' as Intent,
            title: 'Explain System',
            description: 'Get a comprehensive overview of your system architecture',
            icon: Brain,
            color: 'bg-blue-500 hover:bg-blue-600',
        },
        {
            id: 'identify_risks' as Intent,
            title: 'Identify Risks',
            description: 'Analyze potential architectural risks and issues',
            icon: AlertTriangle,
            color: 'bg-orange-500 hover:bg-orange-600',
        },
        {
            id: 'why_design' as Intent,
            title: 'Why This Design',
            description: 'Understand the rationale behind architectural decisions',
            icon: HelpCircle,
            color: 'bg-purple-500 hover:bg-purple-600',
        },
    ];

    return (
        <Card className="p-6 bg-gradient-to-br from-card to-card/50 border-2">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-primary/10 rounded-lg">
                    <Sparkles className="h-6 w-6 text-primary" />
                </div>
                <div>
                    <h2 className="text-xl font-bold text-foreground">System Intelligence</h2>
                    <p className="text-sm text-muted-foreground">
                        AI-powered insights about your architecture
                    </p>
                </div>
            </div>

            {/* Intent Buttons */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                {intents.map((intent) => {
                    const Icon = intent.icon;
                    const isSelected = selectedIntent === intent.id;

                    return (
                        <Button
                            key={intent.id}
                            onClick={() => handleIntentClick(intent.id)}
                            disabled={loading}
                            className={`h-auto flex-col items-start p-4 text-left transition-all ${isSelected
                                    ? `${intent.color} text-white shadow-lg scale-105`
                                    : 'bg-card hover:bg-accent border-2 border-border'
                                }`}
                            variant={isSelected ? "default" : "outline"}
                        >
                            <div className="flex items-center gap-2 mb-2 w-full">
                                <Icon className={`h-5 w-5 ${isSelected ? 'text-white' : 'text-primary'}`} />
                                <span className={`font-semibold ${isSelected ? 'text-white' : 'text-foreground'}`}>
                                    {intent.title}
                                </span>
                            </div>
                            <p className={`text-xs ${isSelected ? 'text-white/90' : 'text-muted-foreground'}`}>
                                {intent.description}
                            </p>
                        </Button>
                    );
                })}
            </div>

            {/* Response Display */}
            {(loading || response) && (
                <div className="mt-6 p-6 bg-muted/50 rounded-lg border border-border">
                    {loading ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            <span className="ml-3 text-muted-foreground">
                                Analyzing your system...
                            </span>
                        </div>
                    ) : (
                        <div className="prose prose-sm dark:prose-invert max-w-none">
                            <div className="whitespace-pre-wrap text-foreground leading-relaxed">
                                {response}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {!loading && !response && (
                <div className="text-center py-8 text-muted-foreground">
                    <Brain className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p className="text-sm">
                        Select an intent above to get AI-powered insights about your system
                    </p>
                </div>
            )}
        </Card>
    );
}
