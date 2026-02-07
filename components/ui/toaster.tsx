"use client";

import { Toaster as Sonner } from "sonner";
import { useTheme } from "@/components/providers/theme-provider";

export function Toaster() {
    const { theme } = useTheme();

    return (
        <Sonner
            theme={theme as "light" | "dark" | "system"}
            position="top-right"
            toastOptions={{
                classNames: {
                    toast: "dark:bg-gray-950 dark:border-gray-800 dark:text-white animate-slide-in-from-top",
                    description: "dark:text-gray-400",
                    actionButton: "dark:bg-lime-500 dark:text-gray-900",
                    cancelButton: "dark:bg-gray-800 dark:text-gray-100",
                    error: "dark:bg-red-950 dark:border-red-800",
                    success: "dark:bg-green-950 dark:border-green-800",
                    warning: "dark:bg-yellow-950 dark:border-yellow-800",
                    info: "dark:bg-blue-950 dark:border-blue-800",
                },
            }}
        />
    );
}
