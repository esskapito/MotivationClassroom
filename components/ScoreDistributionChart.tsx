// Path: components/ScoreDistributionChart.tsx

import React, { useState, useRef, useEffect, useMemo } from 'react';

interface ScoreDistributionChartProps {
    scores: number[];
}

interface Bin {
    label: string;
    count: number;
}

const ScoreDistributionChart: React.FC<ScoreDistributionChartProps> = ({ scores }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [tooltip, setTooltip] = useState<{ x: number; y: number; data: Bin } | null>(null);
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

    const bins = useMemo(() => {
        const maxScore = Math.max(...scores, 10); // Ensure at least a range up to 10
        const binCount = Math.ceil(maxScore / 2);
        const newBins: Bin[] = Array.from({ length: binCount }, (_, i) => ({
            label: `${i * 2}-${i * 2 + 1}`,
            count: 0
        }));

        scores.forEach(score => {
            const binIndex = Math.floor(score / 2);
            if (newBins[binIndex]) {
                newBins[binIndex].count++;
            }
        });
        return newBins;
    }, [scores]);

    useEffect(() => {
        const handleResize = (entries: ResizeObserverEntry[]) => {
            if (entries && entries[0]) {
                const newWidth = entries[0].contentRect.width;
                const aspectRatio = newWidth < 500 ? 0.75 : (350 / 600);
                const newHeight = newWidth > 0 ? newWidth * aspectRatio : 300;
                setDimensions({ width: newWidth, height: newHeight });
            }
        };

        const resizeObserver = new ResizeObserver(handleResize);
        const currentRef = containerRef.current;
        if (currentRef) resizeObserver.observe(currentRef);
        return () => { if (currentRef) resizeObserver.unobserve(currentRef); };
    }, []);

    const { width, height } = dimensions;
    const margin = { top: 20, right: 20, bottom: 40, left: 40 };
    
    const innerWidth = width > margin.left + margin.right ? width - margin.left - margin.right : 0;
    const innerHeight = height > margin.top + margin.bottom ? height - margin.top - margin.bottom : 0;
    
    if (width <= 0) return <div ref={containerRef} className="w-full min-h-[300px]" />;
    if (scores.length === 0) return <div ref={containerRef} className="w-full text-center p-8">Pas de scores à afficher.</div>;

    const maxCount = Math.max(...bins.map(b => b.count), 1);
    const yScale = (value: number) => innerHeight - (value / maxCount) * innerHeight;
    const barWidth = innerWidth / bins.length * 0.8;

    return (
        <div className="relative w-full" ref={containerRef}>
            <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} className="bg-gray-900/50 rounded-lg">
                <g transform={`translate(${margin.left}, ${margin.top})`}>
                    {/* Y-axis labels and lines */}
                    {Array.from({ length: Math.min(maxCount + 1, 6) }).map((_, i) => {
                        const tickValue = Math.round(maxCount / (Math.min(maxCount, 5)) * i);
                        const y = yScale(tickValue);
                        return (
                            <g key={i} transform={`translate(0, ${y})`}>
                                <line x1={-6} y1="0" x2={innerWidth} y2="0" stroke="rgba(255, 255, 255, 0.1)" />
                                <text x="-10" y="4" textAnchor="end" className="text-xs fill-current text-gray-400">
                                    {tickValue}
                                </text>
                            </g>
                        );
                    })}
                     <text transform={`translate(-25, ${innerHeight/2}) rotate(-90)`} textAnchor="middle" className="text-sm fill-current text-gray-500">N d'étudiants</text>
                     <text x={innerWidth / 2} y={innerHeight + 35} textAnchor="middle" className="text-sm fill-current text-gray-500">Tranche de Score</text>


                    {/* Bars */}
                    {bins.map((bin, i) => {
                        const x = (i * (innerWidth / bins.length)) + ((innerWidth / bins.length - barWidth) / 2);
                        const y = yScale(bin.count);
                        const barHeight = innerHeight - y;
                        return (
                            <g key={i}>
                                <rect
                                    x={x}
                                    y={y}
                                    width={barWidth}
                                    height={barHeight}
                                    fill="#667eea"
                                    className="transition-all duration-200 hover:fill-indigo-300 cursor-pointer"
                                    onMouseEnter={(e) => {
                                        const rect = e.currentTarget.getBoundingClientRect();
                                        const containerRect = containerRef.current!.getBoundingClientRect();
                                        setTooltip({ x: rect.left - containerRect.left + rect.width / 2, y: rect.top - containerRect.top, data: bin });
                                    }}
                                    onMouseLeave={() => setTooltip(null)}
                                />
                                <text
                                    x={x + barWidth / 2}
                                    y={innerHeight + 15}
                                    textAnchor="middle"
                                    className="text-xs fill-current text-gray-400"
                                >
                                    {bin.label}
                                </text>
                            </g>
                        );
                    })}
                </g>
            </svg>
            {tooltip && (
                <div
                    className="absolute bg-gray-700 text-white text-sm rounded-lg p-2 shadow-lg pointer-events-none transition-opacity duration-200 z-10"
                    style={{
                        left: `${tooltip.x}px`,
                        top: `${tooltip.y}px`,
                        transform: 'translate(-50%, -110%)',
                    }}
                >
                    <div><strong>Scores:</strong> {tooltip.data.label}</div>
                    <div><strong>Étudiants:</strong> {tooltip.data.count}</div>
                </div>
            )}
        </div>
    );
};

export default ScoreDistributionChart;