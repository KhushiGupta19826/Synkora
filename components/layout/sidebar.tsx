"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
    LayoutDashboard,
    Users,
    FolderKanban,
    Settings,
    ChevronLeft,
    ChevronRight,
} from "lucide-react";
import { motion } from "framer-motion";

const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Teams", href: "/teams", icon: Users },
    { name: "Projects", href: "/dashboard", icon: FolderKanban },
    { name: "Settings", href: "/settings", icon: Settings },
];

interface SidebarProps {
    className?: string;
}

export function Sidebar({ className }: SidebarProps) {
    const pathname = usePathname();
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isTablet, setIsTablet] = useState(false);

    // Detect tablet viewport and auto-collapse
    useEffect(() => {
        const checkTablet = () => {
            const tablet = window.innerWidth >= 768 && window.innerWidth < 1024;
            setIsTablet(tablet);
            if (tablet) {
                setIsCollapsed(true);
            }
        };

        checkTablet();
        window.addEventListener('resize', checkTablet);

        return () => window.removeEventListener('resize', checkTablet);
    }, []);

    return (
        <motion.aside
            initial={false}
            animate={{ width: isCollapsed ? 80 : 256 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className={cn(
                "hidden lg:flex flex-col bg-white dark:bg-gray-950 border-r dark:border-gray-800 h-screen sticky top-0",
                className
            )}
        >
            {/* Logo */}
            <div className="p-6 border-b dark:border-gray-800 flex items-center justify-between">
                {!isCollapsed && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                    >
                        <h1 className="text-xl font-bold bg-gradient-to-r from-lime-400 to-green-500 bg-clip-text text-transparent">
                            Synkora
                        </h1>
                    </motion.div>
                )}
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className="h-8 w-8 p-0"
                >
                    {isCollapsed ? (
                        <ChevronRight className="h-4 w-4" />
                    ) : (
                        <ChevronLeft className="h-4 w-4" />
                    )}
                </Button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4 space-y-2">
                {navigation.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href || pathname?.startsWith(item.href + "/");

                    return (
                        <Link key={item.name} href={item.href}>
                            <Button
                                variant={isActive ? "secondary" : "ghost"}
                                className={cn(
                                    "w-full justify-start gap-3 transition-colors",
                                    isCollapsed && "justify-center"
                                )}
                            >
                                <Icon className="h-5 w-5 flex-shrink-0" />
                                {!isCollapsed && (
                                    <motion.span
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        transition={{ duration: 0.2 }}
                                    >
                                        {item.name}
                                    </motion.span>
                                )}
                            </Button>
                        </Link>
                    );
                })}
            </nav>

            {/* Footer */}
            <div className="p-4 border-t dark:border-gray-800">
                <div className={cn(
                    "text-xs text-muted-foreground",
                    isCollapsed && "text-center"
                )}>
                    {!isCollapsed ? "© 2024 Synkora" : "©"}
                </div>
            </div>
        </motion.aside>
    );
}
