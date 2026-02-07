'use client';

import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Shield } from 'lucide-react';

interface RiskBadgeOverlayProps {
    canvasId: string;
    components: Array<{
        id: string;
        componentId: string;
        name: string;
        position: { x: number; y: number };
    }>;
}

interface RiskData {
    severity: 'low' | 'medium' | 'high' | 'critical';
    riskScore: number;
    riskFactorCount: number;
}

export function RiskBadgeOverlay({ canvasId, components }: RiskBadgeOverlayProps) {
    const [riskMap, setRiskMap] = useState<Record<string, RiskData>>({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchRiskData() {
            try {
                const response = await fetch(`/api/canvas/${canvasId}/components/risk`);
                if (response.ok) {
                    const data = await response.json();
                    setRiskMap(data.riskMap || {});
                }
            } catch (error) {
                console.error('Error fetching risk data:', error);
            } finally {
                setLoading(false);
            }
        }

        if (canvasId) {
            fetchRiskData();
        }
    }, [canvasId]);

    if (loading || Object.keys(riskMap).length === 0) {
        return null;
    }

    const getRiskColor = (severity: string) => {
        switch (severity) {
            case 'critical':
                return 'bg-red-600 text-white border-red-700';
            case 'high':
                return 'bg-orange-600 text-white border-orange-700';
            case 'medium':
                return 'bg-yellow-600 text-white border-yellow-700';
            case 'low':
                return 'bg-green-600 text-white border-green-700';
            default:
                return 'bg-gray-600 text-white border-gray-700';
        }
    };

    const getRiskIcon = (severity: string) => {
        if (severity === 'low') {
            return <Shield className="h-3 w-3" />;
        }
        return <AlertTriangle className="h-3 w-3" />;
    };

    return (
        <div className="pointer-events-none absolute inset-0 z-10">
            {components.map((component) => {
                const risk = riskMap[component.componentId];
                if (!risk) return null;

                return (
                    <div
                        key={component.id}
                        className="absolute pointer-events-auto"
                        style={{
                            left: `${component.position.x}px`,
                            top: `${component.position.y - 30}px`,
                        }}
                    >
                        <Badge
                            className={`${getRiskColor(risk.severity)} text-xs font-semibold shadow-lg border-2 flex items-center gap-1`}
                            title={`Risk Score: ${risk.riskScore}/100 (${risk.riskFactorCount} factor${risk.riskFactorCount !== 1 ? 's' : ''})`}
                        >
                            {getRiskIcon(risk.severity)}
                            <span className="uppercase">{risk.severity}</span>
                        </Badge>
                    </div>
                );
            })}
        </div>
    );
}
