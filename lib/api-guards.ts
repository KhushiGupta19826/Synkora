import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "./auth";
import type { Role } from "@prisma/client";
import {
    requireAuth,
    requireProjectRole,
    requireTeamRole,
} from "./auth-utils";

/**
 * Error response helper
 */
export function errorResponse(message: string, status: number) {
    return NextResponse.json(
        { error: message },
        { status }
    );
}

/**
 * Success response helper
 */
export function successResponse(data: any, status: number = 200) {
    return NextResponse.json(data, { status });
}

/**
 * Wrapper for API routes that require authentication
 */
export async function withAuth(
    handler: (userId: string, request: Request) => Promise<NextResponse>
) {
    try {
        const user = await requireAuth();
        return await handler(user.id, {} as Request);
    } catch (error) {
        return errorResponse("Unauthorized", 401);
    }
}

/**
 * Wrapper for API routes that require project access with specific role
 */
export async function withProjectAuth(
    projectId: string,
    requiredRoles: Role[],
    handler: (
        userId: string,
        projectId: string,
        role: Role,
        request: Request
    ) => Promise<NextResponse>
) {
    try {
        const user = await requireAuth();
        const access = await requireProjectRole(user.id, projectId, requiredRoles);
        return await handler(user.id, projectId, access.role, {} as Request);
    } catch (error) {
        if (error instanceof Error) {
            if (error.message.includes("Unauthorized")) {
                return errorResponse("Unauthorized", 401);
            }
            if (error.message.includes("Access denied")) {
                return errorResponse(error.message, 403);
            }
        }
        return errorResponse("Internal server error", 500);
    }
}

/**
 * Wrapper for API routes that require team access with specific role
 */
export async function withTeamAuth(
    teamId: string,
    requiredRoles: Role[],
    handler: (
        userId: string,
        teamId: string,
        role: Role,
        request: Request
    ) => Promise<NextResponse>
) {
    try {
        const user = await requireAuth();
        const teamMember = await requireTeamRole(user.id, teamId, requiredRoles);
        return await handler(user.id, teamId, teamMember.role, {} as Request);
    } catch (error) {
        if (error instanceof Error) {
            if (error.message.includes("Unauthorized")) {
                return errorResponse("Unauthorized", 401);
            }
            if (error.message.includes("Access denied")) {
                return errorResponse(error.message, 403);
            }
        }
        return errorResponse("Internal server error", 500);
    }
}

/**
 * Check authentication status
 */
export async function checkAuth() {
    const session = await getServerSession(authOptions);
    return {
        isAuthenticated: !!session?.user,
        user: session?.user || null,
    };
}
