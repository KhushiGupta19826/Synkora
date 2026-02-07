/**
 * Decision Records Type Definitions
 * 
 * Types for the Decision Management Subsystem
 */

export type DecisionStatus = 'PROPOSED' | 'ACCEPTED' | 'DEPRECATED' | 'SUPERSEDED';

export interface DecisionRecord {
    id: string;
    projectId: string;
    title: string;
    context: string;
    decision: string;
    rationale: string;
    consequences: string;
    status: DecisionStatus;
    supersededBy?: string | null;
    supersedes?: string | null;
    createdBy: string;
    createdAt: Date;
    updatedAt: Date;
    tags: string[];
}

export interface DecisionRecordWithRelations extends DecisionRecord {
    linkedComponentIds?: string[];
    supersededByRecord?: DecisionRecord | null;
    supersedesRecord?: DecisionRecord | null;
}

export interface CreateDecisionInput {
    projectId: string;
    title: string;
    context: string;
    decision: string;
    rationale: string;
    consequences: string;
    status?: DecisionStatus;
    createdBy: string;
    tags?: string[];
    linkedComponentIds?: string[];
}

export interface UpdateDecisionInput {
    title?: string;
    context?: string;
    decision?: string;
    rationale?: string;
    consequences?: string;
    status?: DecisionStatus;
    tags?: string[];
}

export interface ComponentDecision {
    id: string;
    componentId: string;
    decisionId: string;
    linkedAt: Date;
}

export interface DecisionSupersessionInput {
    oldDecisionId: string;
    newDecisionId: string;
}

export interface DecisionValidationError {
    field: string;
    message: string;
}

export interface DecisionValidationResult {
    valid: boolean;
    errors: DecisionValidationError[];
}
