import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type Intent = 'explain_system' | 'identify_risks' | 'why_design';

interface IntentRequest {
    intent: Intent;
    context?: {
        componentId?: string;
        decisionId?: string;
    };
}

// POST /api/projects/[id]/system-intelligence - Process intent-based AI query
export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const body: IntentRequest = await request.json();
        const { intent, context } = body;

        if (!intent) {
            return NextResponse.json(
                { error: "Intent is required" },
                { status: 400 }
            );
        }

        // Gather system context
        const systemContext = await gatherSystemContext(params.id, context);

        // Generate response based on intent
        const response = await processIntent(intent, systemContext);

        // Build context metadata for transparency
        const contextMetadata = {
            componentsUsed: systemContext.components.length,
            decisionsUsed: systemContext.decisions.length,
            commitsUsed: 0, // TODO: Add Git commit data when available
            sources: {
                components: systemContext.components.map((c: any) => ({
                    id: c.id,
                    componentId: c.componentId,
                    name: c.name,
                    type: c.type,
                })),
                decisions: systemContext.decisions.map((d: any) => ({
                    id: d.id,
                    title: d.title,
                    status: d.status,
                })),
            },
        };

        return NextResponse.json({
            response,
            context: contextMetadata,
        });
    } catch (error) {
        console.error("Error processing system intelligence query:", error);
        return NextResponse.json(
            { error: "Failed to process query" },
            { status: 500 }
        );
    }
}

// Gather context about the system
async function gatherSystemContext(projectId: string, context?: { componentId?: string; decisionId?: string }) {
    // Fetch project details
    const project = await prisma.project.findUnique({
        where: { id: projectId },
        select: {
            id: true,
            name: true,
            description: true,
        },
    });

    if (!project) {
        throw new Error("Project not found");
    }

    // Fetch components from canvas
    const canvas = await prisma.canvas.findFirst({
        where: { projectId },
    });

    let components: any[] = [];
    if (canvas) {
        components = await prisma.component.findMany({
            where: { canvasId: canvas.id },
            select: {
                id: true,
                componentId: true,
                name: true,
                type: true,
                description: true,
            },
        });
    }

    // Fetch decision records
    const decisions = await prisma.decisionRecord.findMany({
        where: { projectId },
        select: {
            id: true,
            title: true,
            context: true,
            decision: true,
            rationale: true,
            consequences: true,
            status: true,
            createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 20,
    });

    // Fetch component-decision links
    const componentDecisions = await prisma.componentDecision.findMany({
        where: {
            decision: {
                projectId,
            },
        },
        select: {
            componentId: true,
            decisionId: true,
        },
    });

    return {
        project,
        components,
        decisions,
        componentDecisions,
        context,
    };
}

// Process intent and generate response
async function processIntent(intent: Intent, systemContext: any): Promise<string> {
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
        return generateFallbackResponse(intent, systemContext);
    }

    try {
        const prompt = buildIntentPrompt(intent, systemContext);

        const response = await fetch(
            "https://api.openai.com/v1/chat/completions",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${apiKey}`,
                },
                body: JSON.stringify({
                    model: "gpt-3.5-turbo",
                    messages: [
                        {
                            role: "system",
                            content: "You are a system architecture expert helping engineers understand their software systems. Focus on architecture, design decisions, and system structure. Be concise and insightful.",
                        },
                        {
                            role: "user",
                            content: prompt,
                        },
                    ],
                    max_tokens: 800,
                    temperature: 0.7,
                }),
            }
        );

        if (!response.ok) {
            throw new Error("OpenAI API request failed");
        }

        const data = await response.json();
        return data.choices[0]?.message?.content || "I couldn't generate a response.";
    } catch (error) {
        console.error("Error calling OpenAI API:", error);
        return generateFallbackResponse(intent, systemContext);
    }
}

// Build prompt based on intent
function buildIntentPrompt(intent: Intent, systemContext: any): string {
    const { project, components, decisions } = systemContext;

    const componentsSummary = components.length > 0
        ? `Components (${components.length}):\n${components.map((c: any) =>
            `- ${c.name} (${c.type})${c.description ? `: ${c.description}` : ''}`
        ).join('\n')}`
        : "No components defined yet.";

    const decisionsSummary = decisions.length > 0
        ? `Decision Records (${decisions.length}):\n${decisions.map((d: any) =>
            `- ${d.title} (${d.status})\n  Decision: ${d.decision.substring(0, 150)}${d.decision.length > 150 ? '...' : ''}`
        ).join('\n\n')}`
        : "No decision records yet.";

    const baseContext = `Project: ${project.name}
${project.description ? `Description: ${project.description}` : ''}

${componentsSummary}

${decisionsSummary}`;

    switch (intent) {
        case 'explain_system':
            return `${baseContext}

Based on the architecture map and decision records above, provide a clear explanation of this system:
1. What is the overall purpose and structure?
2. What are the key components and how do they relate?
3. What are the most important architectural decisions?

Keep it concise and focus on the big picture.`;

        case 'identify_risks':
            return `${baseContext}

Analyze this system and identify potential architectural risks:
1. Components with unclear responsibilities or missing documentation
2. Areas lacking decision documentation
3. Potential coupling or dependency issues
4. Missing critical components or decisions

Provide specific, actionable insights.`;

        case 'why_design':
            return `${baseContext}

Based on the decision records, explain the key design choices made in this system:
1. What were the main architectural decisions?
2. What was the rationale behind these choices?
3. What trade-offs were considered?

Focus on the "why" behind the design.`;

        default:
            return baseContext;
    }
}

// Fallback response when OpenAI is not available
function generateFallbackResponse(intent: Intent, systemContext: any): string {
    const { project, components, decisions } = systemContext;

    switch (intent) {
        case 'explain_system':
            if (components.length === 0 && decisions.length === 0) {
                return `**${project.name}** is just getting started! 

To help me explain your system better:
- Add components to the Architecture Map to define your system structure
- Create Decision Records to document key architectural choices
- Link decisions to components to show relationships

Once you have some components and decisions, I can provide a comprehensive system explanation.`;
            }

            return `**${project.name}** System Overview

**Components (${components.length}):**
${components.length > 0
                    ? components.slice(0, 5).map((c: any) => `• ${c.name} (${c.type})`).join('\n')
                    : '• No components yet'}
${components.length > 5 ? `\n...and ${components.length - 5} more` : ''}

**Key Decisions (${decisions.length}):**
${decisions.length > 0
                    ? decisions.slice(0, 3).map((d: any) => `• ${d.title} (${d.status})`).join('\n')
                    : '• No decisions documented yet'}
${decisions.length > 3 ? `\n...and ${decisions.length - 3} more` : ''}

This system is composed of ${components.length} components with ${decisions.length} documented architectural decisions. Review the Architecture Map for visual relationships and Decision Records for detailed rationale.`;

        case 'identify_risks':
            const risks: string[] = [];

            if (components.length === 0) {
                risks.push("⚠️ **No components defined** - Start by mapping your system architecture");
            }

            if (decisions.length === 0) {
                risks.push("⚠️ **No decision records** - Document your architectural choices to maintain knowledge");
            }

            if (components.length > 0 && decisions.length === 0) {
                risks.push("⚠️ **Low decision coverage** - Components exist but lack documented rationale");
            }

            const componentsWithoutDescription = components.filter((c: any) => !c.description).length;
            if (componentsWithoutDescription > 0) {
                risks.push(`⚠️ **${componentsWithoutDescription} components lack descriptions** - Add descriptions to clarify responsibilities`);
            }

            if (risks.length === 0) {
                return `**Risk Analysis for ${project.name}**

✅ Good architectural documentation coverage
✅ Components are defined with descriptions
✅ Decision records are being maintained

**Recommendations:**
- Continue documenting new architectural decisions
- Keep component descriptions up to date
- Link decisions to affected components
- Review and update superseded decisions`;
            }

            return `**Risk Analysis for ${project.name}**

${risks.join('\n\n')}

**Recommendations:**
- Document architectural decisions as they're made
- Add descriptions to all components
- Link decisions to components they affect
- Review system structure regularly`;

        case 'why_design':
            if (decisions.length === 0) {
                return `**Design Rationale for ${project.name}**

No decision records have been created yet. 

Decision Records help you:
- Document why architectural choices were made
- Preserve context for future team members
- Track the evolution of your system design
- Make informed decisions about changes

Start by creating Decision Records for your key architectural choices!`;
            }

            const recentDecisions = decisions.slice(0, 5);
            return `**Design Rationale for ${project.name}**

Key architectural decisions documented:

${recentDecisions.map((d: any, i: number) => `
**${i + 1}. ${d.title}** (${d.status})
*Decision:* ${d.decision.substring(0, 200)}${d.decision.length > 200 ? '...' : ''}
*Rationale:* ${d.rationale.substring(0, 200)}${d.rationale.length > 200 ? '...' : ''}
`).join('\n')}

${decisions.length > 5 ? `\n...and ${decisions.length - 5} more decisions documented` : ''}

These decisions shape the architecture and guide future development. Review individual Decision Records for complete context and consequences.`;

        default:
            return "I'm here to help you understand your system architecture. Choose an intent to get started!";
    }
}
