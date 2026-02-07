"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ProjectSummary } from "@/components/analytics/project-summary";
import { TaskMetrics } from "@/components/analytics/task-metrics";
import { ActivityChart } from "@/components/analytics/activity-chart";
import { RiskAnalysis } from "@/components/analytics/risk-analysis";
import { SystemHealth } from "@/components/analytics/system-health";
import { SystemIntelligence } from "@/components/analytics/system-intelligence";

interface AnalyticsData {
    totalTasks: number;
    completedTasks: number;
    inProgressTasks: number;
    overdueTasks: number;
    completionRate: number;
    averageCompletionTime: number;
    statusDistribution: {
        TODO: number;
        IN_PROGRESS: number;
        UNDER_REVIEW: number;
        DONE: number;
    };
    priorityDistribution: {
        LOW: number;
        MEDIUM: number;
        HIGH: number;
    };
    tasksByAssignee: Array<{
        userId: string | null;
        userName: string;
        userImage?: string | null;
        taskCount: number;
    }>;
    recentActivities: Array<{
        id: string;
        type: string;
        data: any;
        createdAt: string;
    }>;
    systemHealth: {
        healthScore: number;
        totalComponents: number;
        totalDecisions: number;
        architecturalChurn: number;
        decisionCoverage: number;
    };
}

interface RiskData {
    risks: Array<{
        componentId: string;
        churnRate: number;
        decisionCount: number;
        couplingScore: number;
        riskFactors: Array<{
            type: 'high_churn' | 'low_decision_coverage' | 'high_coupling';
            description: string;
            metric: number;
            severity: 'low' | 'medium' | 'high' | 'critical';
        }>;
        overallSeverity: 'low' | 'medium' | 'high' | 'critical';
        riskScore: number;
    }>;
    summary: {
        totalComponents: number;
        criticalRisk: number;
        highRisk: number;
        mediumRisk: number;
        lowRisk: number;
        averageRiskScore: number;
    };
}

export default function AnalyticsPage() {
    const params = useParams();
    const projectId = params.projectId as string;
    const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
    const [riskData, setRiskData] = useState<RiskData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchAnalytics() {
            try {
                setLoading(true);

                // Fetch analytics and risk data in parallel
                const [analyticsResponse, risksResponse] = await Promise.all([
                    fetch(`/api/projects/${projectId}/analytics`),
                    fetch(`/api/projects/${projectId}/risks`),
                ]);

                if (!analyticsResponse.ok) {
                    throw new Error("Failed to fetch analytics");
                }

                const analyticsData = await analyticsResponse.json();
                setAnalytics(analyticsData);

                // Risk data is optional
                if (risksResponse.ok) {
                    const risksData = await risksResponse.json();
                    setRiskData(risksData);
                }
            } catch (err) {
                console.error("Error fetching analytics:", err);
                setError(err instanceof Error ? err.message : "Failed to load analytics");
            } finally {
                setLoading(false);
            }
        }

        if (projectId) {
            fetchAnalytics();
        }
    }, [projectId]);

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold text-foreground">Project Analytics</h1>
                </div>
                <div className="bg-card rounded-lg border border-border p-8 text-center text-muted-foreground">
                    Loading analytics...
                </div>
            </div>
        );
    }

    if (error || !analytics) {
        return (
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold text-foreground">Project Analytics</h1>
                </div>
                <div className="bg-card rounded-lg border border-border p-8 text-center text-red-600 dark:text-red-400">
                    {error || "Failed to load analytics"}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-foreground">Project Analytics</h1>
            </div>

            {/* System Health - Prioritized at the top */}
            {analytics.systemHealth && (
                <SystemHealth
                    healthScore={analytics.systemHealth.healthScore}
                    totalComponents={analytics.systemHealth.totalComponents}
                    totalDecisions={analytics.systemHealth.totalDecisions}
                    architecturalChurn={analytics.systemHealth.architecturalChurn}
                    decisionCoverage={analytics.systemHealth.decisionCoverage}
                />
            )}

            {/* System Intelligence - AI-powered insights */}
            <SystemIntelligence projectId={projectId} />

            {/* Risk Analysis - Second priority */}
            {riskData && riskData.summary.totalComponents > 0 && (
                <RiskAnalysis risks={riskData.risks} summary={riskData.summary} />
            )}

            {/* Task metrics moved to bottom */}
            <div className="space-y-6">
                <h2 className="text-xl font-semibold text-foreground">Execution Metrics</h2>

                <ProjectSummary
                    totalTasks={analytics.totalTasks}
                    completedTasks={analytics.completedTasks}
                    inProgressTasks={analytics.inProgressTasks}
                    overdueTasks={analytics.overdueTasks}
                    completionRate={analytics.completionRate}
                    averageCompletionTime={analytics.averageCompletionTime}
                />

                <TaskMetrics
                    statusDistribution={analytics.statusDistribution}
                    priorityDistribution={analytics.priorityDistribution}
                    tasksByAssignee={analytics.tasksByAssignee}
                />

                <ActivityChart activities={analytics.recentActivities} />
            </div>
        </div>
    );
}
