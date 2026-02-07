'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';

interface CollapsibleSectionProps {
    title: string;
    children: React.ReactNode;
    defaultOpen?: boolean;
}

export function CollapsibleSection({ title, children, defaultOpen = false }: CollapsibleSectionProps) {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    return (
        <div className="my-3 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between px-4 py-2 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-750 transition-colors"
            >
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {title}
                </span>
                {isOpen ? (
                    <ChevronDown className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                ) : (
                    <ChevronRight className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                )}
            </button>
            {isOpen && (
                <div className="px-4 py-3 bg-white dark:bg-gray-900 animate-in slide-in-from-top-2 duration-200">
                    {children}
                </div>
            )}
        </div>
    );
}
