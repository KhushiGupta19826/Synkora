'use client';

import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Copy, Check, ChevronDown, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AIMessageProps {
    content: string;
    timestamp: Date;
    context?: {
        componentsUsed: number;
        decisionsUsed: number;
        commitsUsed: number;
        sources: {
            components: Array<{
                id: string;
                componentId: string;
                name: string;
                type: string;
            }>;
            decisions: Array<{
                id: string;
                title: string;
                status: string;
            }>;
        };
    };
    projectId?: string;
}

interface CodeBlockProps {
    inline?: boolean;
    className?: string;
    children?: React.ReactNode;
}

export function AIMessage({ content, timestamp, context, projectId }: AIMessageProps) {
    const [copiedCode, setCopiedCode] = useState<string | null>(null);
    const [hoveredDecision, setHoveredDecision] = useState<string | null>(null);

    const handleCopyCode = async (code: string, blockId: string) => {
        await navigator.clipboard.writeText(code);
        setCopiedCode(blockId);
        setTimeout(() => setCopiedCode(null), 2000);
    };

    const formatTimestamp = (date: Date) => {
        return date.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
        });
    };

    return (
        <div className="flex justify-start animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="group relative max-w-[85%] rounded-2xl px-4 py-3 shadow-sm bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-800 dark:text-gray-200">
                <div className="prose prose-sm dark:prose-invert max-w-none">
                    <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                            // Headings
                            h1: ({ children }) => (
                                <h1 className="text-xl font-bold mt-4 mb-2 text-gray-900 dark:text-gray-100">
                                    {children}
                                </h1>
                            ),
                            h2: ({ children }) => (
                                <h2 className="text-lg font-semibold mt-3 mb-2 text-gray-900 dark:text-gray-100">
                                    {children}
                                </h2>
                            ),
                            h3: ({ children }) => (
                                <h3 className="text-base font-semibold mt-2 mb-1 text-gray-900 dark:text-gray-100">
                                    {children}
                                </h3>
                            ),
                            // Lists
                            ul: ({ children }) => (
                                <ul className="list-disc list-inside space-y-1 my-2">
                                    {children}
                                </ul>
                            ),
                            ol: ({ children }) => (
                                <ol className="list-decimal list-inside space-y-1 my-2">
                                    {children}
                                </ol>
                            ),
                            li: ({ children }) => (
                                <li className="text-sm leading-relaxed text-gray-700 dark:text-gray-300">
                                    {children}
                                </li>
                            ),
                            // Paragraphs
                            p: ({ children }) => (
                                <p className="text-sm leading-relaxed my-2 text-gray-700 dark:text-gray-300">
                                    {children}
                                </p>
                            ),
                            // Code blocks with syntax highlighting
                            code: ({ inline, className, children, ...props }: CodeBlockProps) => {
                                const match = /language-(\w+)/.exec(className || '');
                                const language = match ? match[1] : '';
                                const codeString = String(children).replace(/\n$/, '');
                                const blockId = `code-${Math.random().toString(36).substr(2, 9)}`;

                                if (!inline && language) {
                                    return (
                                        <div className="relative group/code my-3">
                                            <div className="absolute right-2 top-2 z-10">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleCopyCode(codeString, blockId)}
                                                    className="h-8 px-2 bg-gray-800/50 hover:bg-gray-700/50 text-white opacity-0 group-hover/code:opacity-100 transition-opacity"
                                                >
                                                    {copiedCode === blockId ? (
                                                        <>
                                                            <Check className="h-3 w-3 mr-1" />
                                                            <span className="text-xs">Copied</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Copy className="h-3 w-3 mr-1" />
                                                            <span className="text-xs">Copy</span>
                                                        </>
                                                    )}
                                                </Button>
                                            </div>
                                            <SyntaxHighlighter
                                                style={vscDarkPlus}
                                                language={language}
                                                PreTag="div"
                                                className="rounded-lg text-xs !bg-gray-900 !p-4"
                                                {...props}
                                            >
                                                {codeString}
                                            </SyntaxHighlighter>
                                        </div>
                                    );
                                }

                                // Inline code
                                return (
                                    <code
                                        className="px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-[#B8FF14] font-mono text-xs"
                                        {...props}
                                    >
                                        {children}
                                    </code>
                                );
                            },
                            // Blockquotes
                            blockquote: ({ children }) => (
                                <blockquote className="border-l-4 border-[#B8FF14] pl-4 my-2 italic text-gray-600 dark:text-gray-400">
                                    {children}
                                </blockquote>
                            ),
                            // Links (for component references)
                            a: ({ href, children }) => {
                                // Check if it's a component link (format: #component:ID)
                                if (href?.startsWith('#component:')) {
                                    const componentId = href.replace('#component:', '');
                                    return (
                                        <button
                                            onClick={() => {
                                                // TODO: Open component details panel
                                                console.log('Open component:', componentId);
                                            }}
                                            className="inline-flex items-center px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors text-xs font-medium"
                                        >
                                            {children}
                                        </button>
                                    );
                                }
                                // Regular links
                                return (
                                    <a
                                        href={href}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-600 dark:text-blue-400 hover:underline"
                                    >
                                        {children}
                                    </a>
                                );
                            },
                            // Tables
                            table: ({ children }) => (
                                <div className="overflow-x-auto my-3">
                                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-xs">
                                        {children}
                                    </table>
                                </div>
                            ),
                            thead: ({ children }) => (
                                <thead className="bg-gray-50 dark:bg-gray-800">
                                    {children}
                                </thead>
                            ),
                            th: ({ children }) => (
                                <th className="px-3 py-2 text-left font-semibold text-gray-900 dark:text-gray-100">
                                    {children}
                                </th>
                            ),
                            td: ({ children }) => (
                                <td className="px-3 py-2 text-gray-700 dark:text-gray-300">
                                    {children}
                                </td>
                            ),
                            // Horizontal rule
                            hr: () => (
                                <hr className="my-4 border-gray-200 dark:border-gray-700" />
                            ),
                        }}
                    >
                        {content}
                    </ReactMarkdown>
                </div>

                {/* Context Indicators Section */}
                {context && (context.componentsUsed > 0 || context.decisionsUsed > 0 || context.commitsUsed > 0) && (
                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                        {/* Summary */}
                        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mb-3">
                            <span className="font-medium">Based on:</span>
                            {context.componentsUsed > 0 && (
                                <span className="px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400">
                                    {context.componentsUsed} component{context.componentsUsed !== 1 ? 's' : ''}
                                </span>
                            )}
                            {context.decisionsUsed > 0 && (
                                <span className="px-2 py-0.5 rounded-full bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400">
                                    {context.decisionsUsed} decision{context.decisionsUsed !== 1 ? 's' : ''}
                                </span>
                            )}
                            {context.commitsUsed > 0 && (
                                <span className="px-2 py-0.5 rounded-full bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400">
                                    {context.commitsUsed} commit{context.commitsUsed !== 1 ? 's' : ''}
                                </span>
                            )}
                        </div>

                        {/* Sources Section */}
                        <details className="group">
                            <summary className="flex items-center gap-2 cursor-pointer text-xs font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-colors">
                                <ChevronRight className="h-3 w-3 transition-transform group-open:rotate-90" />
                                <span>View Sources</span>
                            </summary>

                            <div className="mt-3 space-y-3 pl-5">
                                {/* Component Sources */}
                                {context.sources.components.length > 0 && (
                                    <div>
                                        <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                            Components ({context.sources.components.length})
                                        </h4>
                                        <div className="flex flex-wrap gap-2">
                                            {context.sources.components.map((component) => (
                                                <button
                                                    key={component.id}
                                                    onClick={() => {
                                                        // TODO: Open component details panel
                                                        console.log('Open component:', component.id);
                                                    }}
                                                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors text-xs border border-blue-200 dark:border-blue-800"
                                                    title={`${component.name} (${component.type})`}
                                                >
                                                    <span className="font-mono text-[10px] opacity-70">
                                                        {component.componentId}
                                                    </span>
                                                    <span className="font-medium">{component.name}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Decision Sources */}
                                {context.sources.decisions.length > 0 && (
                                    <div>
                                        <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                            Decisions ({context.sources.decisions.length})
                                        </h4>
                                        <div className="space-y-2">
                                            {context.sources.decisions.map((decision) => (
                                                <div
                                                    key={decision.id}
                                                    className="relative"
                                                    onMouseEnter={() => setHoveredDecision(decision.id)}
                                                    onMouseLeave={() => setHoveredDecision(null)}
                                                >
                                                    <button
                                                        onClick={() => {
                                                            // TODO: Open decision details
                                                            if (projectId) {
                                                                window.location.href = `/projects/${projectId}/decisions/${decision.id}`;
                                                            }
                                                        }}
                                                        className="w-full text-left px-2.5 py-1.5 rounded-md bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors text-xs border border-purple-200 dark:border-purple-800"
                                                    >
                                                        <div className="flex items-center justify-between gap-2">
                                                            <span className="font-medium truncate">{decision.title}</span>
                                                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-100 dark:bg-purple-900/40 shrink-0">
                                                                {decision.status}
                                                            </span>
                                                        </div>
                                                    </button>

                                                    {/* Hover Preview */}
                                                    {hoveredDecision === decision.id && (
                                                        <div className="absolute left-0 top-full mt-1 z-10 w-64 p-3 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg animate-in fade-in slide-in-from-top-1 duration-200">
                                                            <div className="text-xs">
                                                                <div className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
                                                                    {decision.title}
                                                                </div>
                                                                <div className="text-gray-600 dark:text-gray-400">
                                                                    Status: <span className="font-medium">{decision.status}</span>
                                                                </div>
                                                                <div className="mt-2 text-[10px] text-gray-500 dark:text-gray-500">
                                                                    Click to view full decision record
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </details>
                    </div>
                )}

                {/* Timestamp on hover */}
                <div className="absolute -bottom-6 left-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-xs text-gray-500 dark:text-gray-400">
                    {formatTimestamp(timestamp)}
                </div>
            </div>
        </div>
    );
}
