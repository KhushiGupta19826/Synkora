"use client";

import { Card } from "@/components/ui/card";
import { Activity, FileText, GitBranch, TrendingUp } from "lucide-react";

interface SystemHealthProps {
    healthScore: number;
    totalComponents: number;
    totalDecisions: number;
    architecturalChurn: number;
    decisionCoverage: number;
}

export function SystemHealth({
    healthScore,
    totalComponents,
    totalDecisions,
    architecturalChurn,
    decisionCoverage,
}: SystemHealthProps) {
    // Determine health status color
    const getHealthColor = (score: number) => {
        if (score >= 80) return { text: "text-green-600", bg: "bg-green-50", bar: "bg-green-600" };
        if (score >= 60) return { text: "text-yellow-600", bg: "bg-yellow-50", bar: "bg-yellow-600" };
        if (score >= 40) return { text: "text-orange-600", bg: "bg-orange-50", bar: "bg-orange-600" };
        return { text: "text-red-600", bg: "bg-red-50", bar: "bg-red-600" };
    };

    const healthColor = getHealthColor(healthScore);

    const metrics = [
        {
            label: "Components",
            value: totalComponents,
            icon: Activity,
            color: "text-blue-600",
            bgColor: "bg-blue-50",
        },
        {
            label: "Decision Records",
            value: totalDecisions,
            icon: FileText,
            color: "text-purple-600",
            bgColor: "bg-purple-50",
        },
        {
            label: "Architectural Churn",
            value: architecturalChurn,
            suffix: "%",
            icon: GitBranch,
            color: "text-orange-600",
            bgColor: "bg-orange-50",
        },
        {
            label: "Decision Coverage",
            value: decisionCoverage,
            suffix: "%",
            icon: TrendingUp,
            color: "text-green-600",
            bgColor: "bg-green-50",
        },
    ];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-foreground">System Health</h2>
            </div>

            {/* Overall Health Score */}
            <Card className="p-6 dark:bg-gray-900 dark:border-gray-800">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h3 className="text-sm font-medium text-muted-foreground mb-2">
                            Overall System Health
                        </h3>
                        <div className="flex items-end gap-2">
                            <p className={`text-4xl font-bold ${healthColor.text}`}>
                                {healthScore}
                            </p>
                            <p className="text-sm text-muted-foreground mb-2">/ 100</p>
                        </div>
                    </div>
                    <div className={`p-4 rounded-lg ${healthColor.bg} dark:bg-opacity-20`}>
                        <Activity className={`h-8 w-8 ${healthColor.text}`} />
                    </div>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                    <div
                        className={`${healthColor.bar} h-3 rounded-full transition-all`}
                        style={{ width: `${healthScore}%` }}
                    />
                </div>
                <p className="text-xs text-muted-foreground mt-3">
                    Based on decision coverage, architectural stability, and system documentation
                </p>
            </Card>

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {metrics.map((metric) => {
                    const Icon = metric.icon;
                    return (
                        <Card key={metric.label} className="p-6 dark:bg-gray-900 dark:border-gray-800">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground">
                                        {metric.label}
                                    </p>
                                    <p className="text-3xl font-bold mt-2 text-foreground">
                                        {metric.value}{metric.suffix || ''}
                                    </p>
                                </div>
                                <div className={`p-3 rounded-lg ${metric.bgColor} dark:bg-opacity-20`}>
                                    <Icon className={`h-6 w-6 ${metric.color}`} />
                                </div>
                            </div>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
}
