// Path: components/ClassPerformanceChart.tsx

import React, { useState, useRef, useEffect } from 'react';

interface ChartDataPoint {
    date: string;
    average: number;
}

interface ClassPerformanceChartProps {
    data: ChartDataPoint[];
    yAxisLabel?: string;
}

const ClassPerformanceChart: React.FC<ClassPerformanceChartProps> = ({ data, yAxisLabel = "Score Moyen" }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [tooltip, setTooltip] = useState<{ x: number; y: number; data: ChartDataPoint } | null>(null);
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

    useEffect(() => {
        const handleResize = (entries: ResizeObserverEntry[]) => {
            if (entries && entries[0]) {
                const newWidth = entries[0].contentRect.width;
                // Maintain aspect ratio. Original was 600/350.
                const aspectRatio = newWidth < 500 ? 0.75 : (350 / 600);
                const newHeight = newWidth > 0 ? newWidth * aspectRatio : 300;
                setDimensions({ width: newWidth, height: newHeight });
            }
        };

        const resizeObserver = new ResizeObserver(handleResize);
        const currentRef = containerRef.current;

        if (currentRef) {
            resizeObserver.observe(currentRef);
        }

        return () => {
            if (currentRef) {
                resizeObserver.unobserve(currentRef);
            }
        };
    }, []);

    const { width, height } = dimensions;
    const margin = { top: 20, right: 20, bottom: 60, left: 50 };
    
    // Ensure inner dimensions are not negative
    const innerWidth = width > margin.left + margin.right ? width - margin.left - margin.right : 0;
    const innerHeight = height > margin.top + margin.bottom ? height - margin.top - margin.bottom : 0;

    // A placeholder while the container is measuring
    if (width <= 0) {
        return <div ref={containerRef} className="w-full min-h-[300px]" />;
    }

    if (data.length === 0) return <div ref={containerRef} className="w-full text-center p-8">Pas de données à afficher.</div>;

    // --- FULLY DYNAMIC Y-AXIS CALCULATION ---
    const minAvg = Math.min(...data.map(d => d.average));
    const maxAvg = Math.max(...data.map(d => d.average));

    const yRange = maxAvg - minAvg;
    const padding = yRange > 1 ? yRange * 0.15 : 5;
    
    const yMin = Math.max(0, Math.floor(minAvg - padding));
    const yMax = Math.ceil(maxAvg + padding);

    const tickCount = 5;
    const tickIncrement = yMax > yMin ? (yMax - yMin) / (tickCount - 1) : 1;
    const yAxisLabels = Array.from({ length: tickCount }, (_, i) => {
        const value = yMin + (i * tickIncrement);
        return Number.isInteger(value) ? value : parseFloat(value.toFixed(1));
    });

    const yScale = (value: number) => {
        const scaleRange = yMax - yMin;
        if (scaleRange === 0) return innerHeight / 2;
        return innerHeight - ((value - yMin) / scaleRange) * innerHeight;
    };
    
    const xScale = (index: number) => (data.length > 1 ? (index / (data.length - 1)) * innerWidth : innerWidth / 2);

    const linePath = data
        .map((point, index) => `${index === 0 ? 'M' : 'L'}${xScale(index)},${yScale(point.average)}`)
        .join(' ');

    const maxLabels = innerWidth > 400 ? 8 : 4;
    const step = Math.max(1, Math.ceil(data.length / maxLabels));
    const xAxisLabels = data.filter((_, i) => i % step === 0);

    return (
        <div className="relative w-full" ref={containerRef}>
            <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} className="bg-gray-900/50 rounded-lg">
                <g transform={`translate(${margin.left}, ${margin.top})`}>
                    {/* Y-axis lines and labels */}
                    {yAxisLabels.map((tick, i) => (
                        <g key={i} transform={`translate(0, ${yScale(tick)})`}>
                            <line x1={-6} y1="0" x2={innerWidth} y2="0" stroke="rgba(255, 255, 255, 0.1)" />
                            <text
                                x="-10"
                                y="4"
                                textAnchor="end"
                                className="text-xs fill-current text-gray-400"
                            >
                                {tick}
                            </text>
                        </g>
                    ))}

                    {/* X-axis labels */}
                    {xAxisLabels.map((point, i) => {
                         const originalIndex = data.findIndex(d => d.date === point.date);
                         return (
                            <text
                                key={i}
                                x={xScale(originalIndex)}
                                y={innerHeight + 25}
                                textAnchor="middle"
                                className="text-xs fill-current text-gray-400"
                            >
                                {new Date(point.date).toLocaleDateString(undefined, { month: '2-digit', day: '2-digit' })}
                            </text>
                         )
                    })}
                     <text x={innerWidth / 2} y={innerHeight + 50} textAnchor="middle" className="text-sm fill-current text-gray-500">Date</text>
                     <text transform={`translate(-35, ${innerHeight/2}) rotate(-90)`} textAnchor="middle" className="text-sm fill-current text-gray-500">{yAxisLabel}</text>


                    {/* Data Line */}
                    <path d={linePath} fill="none" stroke="#4c51bf" strokeWidth="2" />

                    {/* Data Points */}
                    {data.map((point, index) => (
                        <circle
                            key={index}
                            cx={xScale(index)}
                            cy={yScale(point.average)}
                            r="5"
                            fill="#4c51bf"
                            className="transition-all duration-200 hover:fill-purple-300 cursor-pointer"
                            onMouseEnter={() => setTooltip({ x: xScale(index), y: yScale(point.average), data: point })}
                            onMouseLeave={() => setTooltip(null)}
                        />
                    ))}
                </g>
            </svg>
            {/* Tooltip */}
            {tooltip && (
                <div
                    className="absolute bg-gray-700 text-white text-sm rounded-lg p-2 shadow-lg pointer-events-none transition-opacity duration-200 z-10"
                    style={{
                        left: `${tooltip.x + margin.left}px`,
                        top: `${tooltip.y + margin.top}px`,
                        transform: 'translate(-50%, -120%)',
                    }}
                >
                    <div><strong>Date:</strong> {new Date(tooltip.data.date).toLocaleDateString()}</div>
                    <div><strong>{yAxisLabel}:</strong> {tooltip.data.average.toFixed(1)}</div>
                </div>
            )}
        </div>
    );
};

export default ClassPerformanceChart;
