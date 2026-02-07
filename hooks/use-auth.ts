"use client";

import { useSession } from "next-auth/react";
import { Role } from "@prisma/client";

export function useAuth() {
    const { data: session, status } = useSession();

    return {
        user: session?.user,
        isAuthenticated: !!session?.user,
        isLoading: status === "loading",
        status,
    };
}

export function useRequireAuth() {
    const { user, isAuthenticated, isLoading } = useAuth();

    if (!isLoading && !isAuthenticated) {
        throw new Error("Authentication required");
    }

    return { user, isLoading };
}

/**
 * Check if user has permission based on role
 */
export function hasPermission(role: Role, requiredRoles: Role[]): boolean {
    return requiredRoles.includes(role);
}

/**
 * Check if user can edit (Owner or Editor)
 */
export function canEdit(role: Role): boolean {
    return role === Role.OWNER || role === Role.EDITOR;
}

/**
 * Check if user is owner
 */
export function isOwner(role: Role): boolean {
    return role === Role.OWNER;
}
