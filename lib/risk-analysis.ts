/**
 * Risk Analysis Service
 * 
 * Calculates risk factors for components including:
 * - Architectural churn (commit frequency)
 * - Decision coverage (decisions per component)
 * - Coupling (dependencies to/from component)
 */

import { prisma } from './prisma';

export interface RiskFactor {
    type: 'high_churn' | 'low_decision_coverage' | 'high_coupling';
    description: string;
    metric: number;
    severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface ComponentRiskMetrics {
    componentId: string;
    componentName?: string;
    churnRate: number;
    decisionCount: number;
    couplingScore: number;
    riskFactors: RiskFactor[];
    overallSeverity: 'low' | 'medium' | 'high' | 'critical';
    riskScore: number; // 0-100
}

// Thresholds for risk calculation
const THRESHOLDS = {
    churn: {
        low: 5,      // commits per 30 days
        medium: 10,
        high: 20,
    },
    decisions: {
        low: 0,      // decisions per component
        medium: 1,
        high: 3,
    },
    coupling: {
        low: 3,      // number of dependencies
        medium: 6,
        high: 10,
    },
};

/**
 * Calculate architectural churn for a component
 * Returns the number of commits affecting this component in the last 30 days
 */
async function calculateChurn(componentId: string): Promise<number> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // For now, return 0 as we don't have commit-component linking yet
    // This will be implemented in task 10.1-10.3
    return 0;
}

/**
 * Calculate decision coverage for a component
 * Returns the number of decisions linked to this component
 */
async function calculateDecisionCoverage(componentId: string): Promise<number> {
    const count = await prisma.componentDecision.count({
        where: { componentId },
    });

    return count;
}

/**
 * Calculate coupling score for a component
 * For now, returns 0 as we don't have dependency tracking yet
 * This would count incoming and outgoing dependencies
 */
async function calculateCoupling(componentId: string): Promise<number> {
    // This will be implemented when we have dependency/dataflow tracking
    // For now, return a placeholder value
    return 0;
}

/**
 * Determine severity level based on metric value and thresholds
 */
function determineSeverity(
    metric: number,
    thresholds: { low: number; medium: number; high: number },
    inverse: boolean = false
): 'low' | 'medium' | 'high' | 'critical' {
    if (inverse) {
        // For metrics where lower is worse (e.g., decision coverage)
        if (metric <= thresholds.low) return 'critical';
        if (metric <= thresholds.medium) return 'high';
        if (metric <= thresholds.high) return 'medium';
        return 'low';
    } else {
        // For metrics where higher is worse (e.g., churn, coupling)
        if (metric >= thresholds.high) return 'critical';
        if (metric >= thresholds.medium) return 'high';
        if (metric >= thresholds.low) return 'medium';
        return 'low';
    }
}

/**
 * Calculate risk score (0-100) based on all factors
 */
function calculateRiskScore(
    churnRate: number,
    decisionCount: number,
    couplingScore: number
): number {
    // Weighted risk calculation
    const churnWeight = 0.4;
    const decisionWeight = 0.4;
    const couplingWeight = 0.2;

    // Normalize each metric to 0-100 scale
    const churnScore = Math.min((churnRate / THRESHOLDS.churn.high) * 100, 100);
    const decisionScore = decisionCount === 0 ? 100 : Math.max(0, 100 - (decisionCount / THRESHOLDS.decisions.high) * 100);
    const couplingNormalized = Math.min((couplingScore / THRESHOLDS.coupling.high) * 100, 100);

    const totalScore = (
        churnScore * churnWeight +
        decisionScore * decisionWeight +
        couplingNormalized * couplingWeight
    );

    return Math.round(totalScore);
}

/**
 * Calculate comprehensive risk metrics for a component
 */
export async function calculateComponentRisk(componentId: string): Promise<ComponentRiskMetrics> {
    // Fetch component details
    const component = await prisma.component.findUnique({
        where: { id: componentId },
        select: {
            id: true,
            componentId: true,
            name: true,
        },
    });

    if (!component) {
        throw new Error(`Component ${componentId} not found`);
    }

    const [churnRate, decisionCount, couplingScore] = await Promise.all([
        calculateChurn(componentId),
        calculateDecisionCoverage(componentId),
        calculateCoupling(componentId),
    ]);

    const riskFactors: RiskFactor[] = [];

    // Check for high churn
    const churnSeverity = determineSeverity(churnRate, THRESHOLDS.churn);
    if (churnSeverity !== 'low') {
        riskFactors.push({
            type: 'high_churn',
            description: `High change frequency: ${churnRate} commits in last 30 days`,
            metric: churnRate,
            severity: churnSeverity,
        });
    }

    // Check for low decision coverage
    const decisionSeverity = determineSeverity(decisionCount, THRESHOLDS.decisions, true);
    if (decisionSeverity !== 'low') {
        riskFactors.push({
            type: 'low_decision_coverage',
            description: `Low decision documentation: ${decisionCount} decision${decisionCount === 1 ? '' : 's'}`,
            metric: decisionCount,
            severity: decisionSeverity,
        });
    }

    // Check for high coupling
    const couplingSeverity = determineSeverity(couplingScore, THRESHOLDS.coupling);
    if (couplingSeverity !== 'low') {
        riskFactors.push({
            type: 'high_coupling',
            description: `High coupling: ${couplingScore} dependencies`,
            metric: couplingScore,
            severity: couplingSeverity,
        });
    }

    // Calculate overall severity (highest severity among all factors)
    const severityLevels = ['low', 'medium', 'high', 'critical'];
    const maxSeverityIndex = Math.max(
        ...riskFactors.map(rf => severityLevels.indexOf(rf.severity)),
        0
    );
    const overallSeverity = severityLevels[maxSeverityIndex] as 'low' | 'medium' | 'high' | 'critical';

    const riskScore = calculateRiskScore(churnRate, decisionCount, couplingScore);

    return {
        componentId: component.componentId,
        componentName: component.name,
        churnRate,
        decisionCount,
        couplingScore,
        riskFactors,
        overallSeverity,
        riskScore,
    };
}

/**
 * Calculate risk metrics for all components in a project
 */
export async function calculateProjectRisks(projectId: string): Promise<ComponentRiskMetrics[]> {
    // Get all components for the project
    const project = await prisma.project.findUnique({
        where: { id: projectId },
        include: {
            canvas: {
                include: {
                    components: {
                        select: {
                            id: true,
                            componentId: true,
                            name: true,
                        },
                    },
                },
            },
        },
    });

    if (!project?.canvas) {
        return [];
    }

    const components = project.canvas.components;

    // Calculate risk for each component
    const riskMetrics = await Promise.all(
        components.map(component => calculateComponentRisk(component.id))
    );

    return riskMetrics;
}

/**
 * Get high-risk components for a project
 */
export async function getHighRiskComponents(
    projectId: string,
    minSeverity: 'medium' | 'high' | 'critical' = 'medium'
): Promise<ComponentRiskMetrics[]> {
    const allRisks = await calculateProjectRisks(projectId);

    const severityOrder = { low: 0, medium: 1, high: 2, critical: 3 };
    const minLevel = severityOrder[minSeverity];

    return allRisks.filter(risk => severityOrder[risk.overallSeverity] >= minLevel);
}
