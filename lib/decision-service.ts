/**
 * Decision Service
 * 
 * Handles CRUD operations for Decision Records
 * Implements field validation, status transitions, and supersession logic
 */

import { prisma } from './prisma';
import {
    DecisionRecord,
    DecisionRecordWithRelations,
    CreateDecisionInput,
    UpdateDecisionInput,
    DecisionStatus,
    DecisionValidationError,
    DecisionValidationResult,
    DecisionSupersessionInput,
} from '@/types/decision';

/**
 * Validate required fields for Decision Record creation
 */
export function validateDecisionFields(
    input: Partial<CreateDecisionInput>
): DecisionValidationResult {
    const errors: DecisionValidationError[] = [];

    const requiredFields: (keyof CreateDecisionInput)[] = [
        'title',
        'context',
        'decision',
        'rationale',
        'consequences',
    ];

    for (const field of requiredFields) {
        if (!input[field] || (typeof input[field] === 'string' && input[field]!.trim() === '')) {
            errors.push({
                field,
                message: `${field} is required and cannot be empty`,
            });
        }
    }

    return {
        valid: errors.length === 0,
        errors,
    };
}

/**
 * Validate decision status value
 */
export function validateDecisionStatus(status: string): boolean {
    const validStatuses: DecisionStatus[] = ['PROPOSED', 'ACCEPTED', 'DEPRECATED', 'SUPERSEDED'];
    return validStatuses.includes(status as DecisionStatus);
}

/**
 * Create a new Decision Record
 */
export async function createDecision(
    input: CreateDecisionInput
): Promise<DecisionRecordWithRelations> {
    // Validate required fields
    const validation = validateDecisionFields(input);
    if (!validation.valid) {
        throw new Error(
            `Validation failed: ${validation.errors.map((e) => e.message).join(', ')}`
        );
    }

    // Validate status if provided
    if (input.status && !validateDecisionStatus(input.status)) {
        throw new Error(`Invalid status: ${input.status}`);
    }

    // Create decision record
    const decision = await prisma.decisionRecord.create({
        data: {
            projectId: input.projectId,
            title: input.title,
            context: input.context,
            decision: input.decision,
            rationale: input.rationale,
            consequences: input.consequences,
            status: input.status || 'PROPOSED',
            createdBy: input.createdBy,
            tags: input.tags || [],
        },
    });

    // Link to components if provided
    if (input.linkedComponentIds && input.linkedComponentIds.length > 0) {
        await Promise.all(
            input.linkedComponentIds.map((componentId) =>
                linkToComponent(decision.id, componentId)
            )
        );
    }

    // Fetch and return with relations
    return getDecisionById(decision.id);
}

/**
 * Update an existing Decision Record
 */
export async function updateDecision(
    decisionId: string,
    updates: UpdateDecisionInput
): Promise<DecisionRecordWithRelations> {
    // Validate status if provided
    if (updates.status && !validateDecisionStatus(updates.status)) {
        throw new Error(`Invalid status: ${updates.status}`);
    }

    // Check if decision exists
    const existing = await prisma.decisionRecord.findUnique({
        where: { id: decisionId },
    });

    if (!existing) {
        throw new Error(`Decision Record not found: ${decisionId}`);
    }

    // Validate status transition
    if (updates.status) {
        validateStatusTransition(existing.status, updates.status);
    }

    // Update decision record
    const decision = await prisma.decisionRecord.update({
        where: { id: decisionId },
        data: {
            ...updates,
            updatedAt: new Date(),
        },
    });

    // Fetch and return with relations
    return getDecisionById(decision.id);
}

/**
 * Validate status transition logic
 */
function validateStatusTransition(
    currentStatus: DecisionStatus,
    newStatus: DecisionStatus
): void {
    // SUPERSEDED status can only be set through supersede operation
    if (newStatus === 'SUPERSEDED') {
        throw new Error(
            'Cannot manually set status to SUPERSEDED. Use supersede operation instead.'
        );
    }

    // Cannot change status from SUPERSEDED
    if (currentStatus === 'SUPERSEDED') {
        throw new Error('Cannot change status of a superseded decision');
    }
}

/**
 * Get Decision Record by ID with relations
 */
export async function getDecisionById(
    decisionId: string
): Promise<DecisionRecordWithRelations> {
    const decision = await prisma.decisionRecord.findUnique({
        where: { id: decisionId },
        include: {
            componentDecisions: {
                select: {
                    componentId: true,
                },
            },
            supersededByRecord: true,
            supersedesRecords: true,
        },
    });

    if (!decision) {
        throw new Error(`Decision Record not found: ${decisionId}`);
    }

    return {
        ...decision,
        linkedComponentIds: decision.componentDecisions.map((cd) => cd.componentId),
        supersededByRecord: decision.supersededByRecord || null,
        supersedesRecord: decision.supersedesRecords[0] || null,
    };
}

/**
 * Get all Decision Records for a component
 */
export async function getDecisionsByComponent(
    componentId: string
): Promise<DecisionRecordWithRelations[]> {
    const componentDecisions = await prisma.componentDecision.findMany({
        where: { componentId },
        include: {
            decision: {
                include: {
                    componentDecisions: {
                        select: {
                            componentId: true,
                        },
                    },
                    supersededByRecord: true,
                    supersedesRecords: true,
                },
            },
        },
        orderBy: {
            linkedAt: 'desc',
        },
    });

    return componentDecisions.map((cd) => ({
        ...cd.decision,
        linkedComponentIds: cd.decision.componentDecisions.map((c) => c.componentId),
        supersededByRecord: cd.decision.supersededByRecord || null,
        supersedesRecord: cd.decision.supersedesRecords[0] || null,
    }));
}

/**
 * Get all Decision Records for a project
 */
export async function getDecisionsByProject(
    projectId: string,
    status?: DecisionStatus
): Promise<DecisionRecordWithRelations[]> {
    const decisions = await prisma.decisionRecord.findMany({
        where: {
            projectId,
            ...(status && { status }),
        },
        include: {
            componentDecisions: {
                select: {
                    componentId: true,
                },
            },
            supersededByRecord: true,
            supersedesRecords: true,
        },
        orderBy: {
            createdAt: 'desc',
        },
    });

    return decisions.map((decision) => ({
        ...decision,
        linkedComponentIds: decision.componentDecisions.map((cd) => cd.componentId),
        supersededByRecord: decision.supersededByRecord || null,
        supersedesRecord: decision.supersedesRecords[0] || null,
    }));
}

/**
 * Link a Decision Record to a Component
 */
export async function linkToComponent(
    decisionId: string,
    componentId: string
): Promise<void> {
    // Verify decision exists
    const decision = await prisma.decisionRecord.findUnique({
        where: { id: decisionId },
    });

    if (!decision) {
        throw new Error(`Decision Record not found: ${decisionId}`);
    }

    // Verify component exists
    const component = await prisma.component.findUnique({
        where: { id: componentId },
    });

    if (!component) {
        throw new Error(`Component not found: ${componentId}`);
    }

    // Create link (will be ignored if already exists due to unique constraint)
    try {
        await prisma.componentDecision.create({
            data: {
                decisionId,
                componentId,
            },
        });
    } catch (error: any) {
        // Ignore unique constraint violations (link already exists)
        if (!error.code || error.code !== 'P2002') {
            throw error;
        }
    }
}

/**
 * Unlink a Decision Record from a Component
 */
export async function unlinkFromComponent(
    decisionId: string,
    componentId: string
): Promise<void> {
    await prisma.componentDecision.deleteMany({
        where: {
            decisionId,
            componentId,
        },
    });
}

/**
 * Supersede an old decision with a new one
 */
export async function supersede(input: DecisionSupersessionInput): Promise<void> {
    const { oldDecisionId, newDecisionId } = input;

    // Verify both decisions exist
    const oldDecision = await prisma.decisionRecord.findUnique({
        where: { id: oldDecisionId },
    });

    const newDecision = await prisma.decisionRecord.findUnique({
        where: { id: newDecisionId },
    });

    if (!oldDecision) {
        throw new Error(`Old Decision Record not found: ${oldDecisionId}`);
    }

    if (!newDecision) {
        throw new Error(`New Decision Record not found: ${newDecisionId}`);
    }

    // Check for circular supersession
    if (oldDecisionId === newDecisionId) {
        throw new Error('A decision cannot supersede itself');
    }

    // Check if new decision is already superseded
    if (newDecision.status === 'SUPERSEDED') {
        throw new Error('Cannot use a superseded decision to supersede another decision');
    }

    // Check for supersession chain cycles
    await checkSupersessionCycle(oldDecisionId, newDecisionId);

    // Update both decisions in a transaction
    await prisma.$transaction([
        // Update old decision
        prisma.decisionRecord.update({
            where: { id: oldDecisionId },
            data: {
                status: 'SUPERSEDED',
                supersededBy: newDecisionId,
            },
        }),
        // Update new decision
        prisma.decisionRecord.update({
            where: { id: newDecisionId },
            data: {
                supersedes: oldDecisionId,
            },
        }),
    ]);
}

/**
 * Check for cycles in supersession chain
 */
async function checkSupersessionCycle(
    oldDecisionId: string,
    newDecisionId: string
): Promise<void> {
    const visited = new Set<string>();
    let currentId: string | null = newDecisionId;

    while (currentId) {
        if (visited.has(currentId)) {
            throw new Error('Supersession would create a cycle');
        }

        if (currentId === oldDecisionId) {
            throw new Error('Supersession would create a cycle');
        }

        visited.add(currentId);

        const decision: { supersededBy: string | null } | null = await prisma.decisionRecord.findUnique({
            where: { id: currentId },
            select: { supersededBy: true },
        });

        currentId = decision?.supersededBy || null;
    }
}

/**
 * Get the complete supersession chain for a decision
 */
export async function getSupersessionChain(
    decisionId: string
): Promise<DecisionRecord[]> {
    const chain: DecisionRecord[] = [];
    let currentId: string | null = decisionId;

    // Follow the chain backwards (to older decisions)
    while (currentId) {
        const decision: DecisionRecord | null = await prisma.decisionRecord.findUnique({
            where: { id: currentId },
        });

        if (!decision) {
            break;
        }

        chain.push(decision);
        currentId = decision.supersedes || null;
    }

    // Reverse to get chronological order (oldest to newest)
    return chain.reverse();
}

/**
 * Delete a Decision Record
 */
export async function deleteDecision(decisionId: string): Promise<void> {
    // Check if decision is referenced by other decisions
    const referencingDecisions = await prisma.decisionRecord.findMany({
        where: {
            OR: [{ supersededBy: decisionId }, { supersedes: decisionId }],
        },
    });

    if (referencingDecisions.length > 0) {
        throw new Error(
            'Cannot delete decision that is part of a supersession chain. Remove supersession links first.'
        );
    }

    await prisma.decisionRecord.delete({
        where: { id: decisionId },
    });
}
