"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Shield, AlertCircle, TrendingUp } from "lucide-react";

interface RiskFactor {
    type: 'high_churn' | 'low_decision_coverage' | 'high_coupling';
    description: string;
    metric: number;
    severity: 'low' | 'medium' | 'high' | 'critical';
}

interface ComponentRisk {
    componentId: string;
    componentName?: string;
    churnRate: number;
    decisionCount: number;
    couplingScore: number;
    riskFactors: RiskFactor[];
    overallSeverity: 'low' | 'medium' | 'high' | 'critical';
    riskScore: number;
}

interface RiskSummary {
    totalComponents: number;
    criticalRisk: number;
    highRisk: number;
    mediumRisk: number;
    lowRisk: number;
    averageRiskScore: number;
}

interface RiskAnalysisProps {
    risks: ComponentRisk[];
    summary: RiskSummary;
}

export function RiskAnalysis({ risks, summary }: RiskAnalysisProps) {
    const highRiskComponents = risks.filter(
        r => r.overallSeverity === 'critical' || r.overallSeverity === 'high'
    );

    const metrics = [
        {
            label: "Critical Risk",
            value: summary.criticalRisk,
            icon: AlertCircle,
            color: "text-red-600",
            bgColor: "bg-red-50",
        },
        {
            label: "High Risk",
            value: summary.highRisk,
            icon: AlertTriangle,
            color: "text-orange-600",
            bgColor: "bg-orange-50",
        },
        {
            label: "Medium Risk",
            value: summary.mediumRisk,
            icon: TrendingUp,
            color: "text-yellow-600",
            bgColor: "bg-yellow-50",
        },
        {
            label: "Low Risk",
            value: summary.lowRisk,
            icon: Shield,
            color: "text-green-600",
            bgColor: "bg-green-50",
        },
    ];

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-lg font-semibold mb-4">Architectural Risk Analysis</h2>
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
                                            {metric.value}
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

            <Card className="p-6 dark:bg-gray-900 dark:border-gray-800">
                <h3 className="text-sm font-medium text-muted-foreground mb-2">
                    Average Risk Score
                </h3>
                <div className="flex items-end gap-2">
                    <p className="text-3xl font-bold text-foreground">{summary.averageRiskScore}</p>
                    <p className="text-sm text-muted-foreground mb-1">
                        out of 100
                    </p>
                </div>
                <div className="mt-4 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                        className={`h-2 rounded-full transition-all ${summary.averageRiskScore >= 70 ? 'bg-red-600' :
                            summary.averageRiskScore >= 50 ? 'bg-orange-600' :
                                summary.averageRiskScore >= 30 ? 'bg-yellow-600' :
                                    'bg-green-600'
                            }`}
                        style={{ width: `${summary.averageRiskScore}%` }}
                    />
                </div>
            </Card>

            {highRiskComponents.length > 0 && (
                <div>
                    <h3 className="text-lg font-semibold mb-4">High-Risk Components</h3>
                    <div className="space-y-3">
                        {highRiskComponents.map((component) => (
                            <Card
                                key={component.componentId}
                                className={`p-4 border-l-4 ${component.overallSeverity === 'critical'
                                    ? 'border-l-red-600 bg-red-50 dark:bg-red-950'
                                    : 'border-l-orange-600 bg-orange-50 dark:bg-orange-950'
                                    }`}
                            >
                                <div className="flex items-start justify-between mb-2">
                                    <div>
                                        <h4 className="font-medium text-foreground">
                                            {component.componentName || <code className="font-mono text-sm">{component.componentId}</code>}
                                        </h4>
                                        <Badge
                                            variant={
                                                component.overallSeverity === 'critical'
                                                    ? 'destructive'
                                                    : 'destructive'
                                            }
                                            className="text-xs mt-1"
                                        >
                                            {component.overallSeverity.toUpperCase()} RISK
                                        </Badge>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-semibold text-foreground">
                                            Risk Score
                                        </p>
                                        <p className="text-2xl font-bold text-foreground">
                                            {component.riskScore}
                                        </p>
                                    </div>
                                </div>
                                <div className="space-y-1 mt-3">
                                    {component.riskFactors.map((factor, index) => (
                                        <div key={index} className="flex items-start gap-2 text-sm">
                                            <AlertTriangle
                                                className={`h-4 w-4 mt-0.5 flex-shrink-0 ${factor.severity === 'critical'
                                                    ? 'text-red-600'
                                                    : factor.severity === 'high'
                                                        ? 'text-orange-600'
                                                        : 'text-yellow-600'
                                                    }`}
                                            />
                                            <span className="text-gray-700 dark:text-gray-300">
                                                {factor.description}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </Card>
                        ))}
                    </div>
                </div>
            )}

            {highRiskComponents.length === 0 && (
                <Card className="p-6 border-l-4 border-l-green-600 bg-green-50 dark:bg-green-950">
                    <div className="flex items-center gap-3">
                        <Shield className="h-6 w-6 text-green-600" />
                        <div>
                            <h3 className="font-medium text-green-800 dark:text-green-200">
                                No High-Risk Components
                            </h3>
                            <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                                All components are within acceptable risk thresholds
                            </p>
                        </div>
                    </div>
                </Card>
            )}
        </div>
    );
}
