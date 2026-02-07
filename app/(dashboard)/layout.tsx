"use client";

import { useAuth } from "@/hooks/use-auth";
import { MainLayout } from "@/components/layout/main-layout";
import { Loader2 } from "lucide-react";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { user, isLoading } = useAuth();

    if (isLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    const userData = user ? {
        name: user.name,
        email: user.email || undefined,
        image: user.image,
    } : undefined;

    return (
        <MainLayout user={userData}>
            {children}
        </MainLayout>
    );
}
