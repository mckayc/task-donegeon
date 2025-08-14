
import React, { useMemo, useRef, useEffect, useState } from 'react';

interface ChartData {
  label: string;
  value: number;
}

interface BarChartProps {
  data: ChartData[];
  color?: string;
}

const BarChart: React.FC<BarChartProps> = ({ data, color = '#10b981' }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [{ width, height }, setDimensions] = useState({ width: 0, height: 300 });

  useEffect(() => {
    if (svgRef.current) {
        const resizeObserver = new ResizeObserver(entries => {
            if (entries[0]) {
                setDimensions({ width: entries[0].contentRect.width, height: 300 });
            }
        });
        resizeObserver.observe(svgRef.current);
        return () => resizeObserver.disconnect();
    }
  }, []);

  const { bars, yAxisLabels, xAxisLabels } = useMemo(() => {
    if (!data.length || width === 0) return { bars: [], yAxisLabels: [], xAxisLabels: [] };

    const padding = { top: 20, right: 20, bottom: 40, left: 40 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;
    
    const maxValue = Math.max(...data.map(d => d.value), 0);
    const calculatedYMax = Math.ceil(maxValue / 5) * 5 || 10;
    
    const barWidth = chartWidth / data.length * 0.8;
    
    const xScale = (i: number) => padding.left + (i * (chartWidth / data.length)) + ((chartWidth / data.length) * 0.1);
    const yScale = (value: number) => padding.top + chartHeight - (value / calculatedYMax) * chartHeight;

    const chartBars = data.map((point, i) => ({
      x: xScale(i),
      y: yScale(point.value),
      width: barWidth,
      height: (point.value / calculatedYMax) * chartHeight,
      value: point.value,
      label: point.label
    }));

    const yLabels = Array.from({ length: 6 }, (_, i) => {
        const value = Math.round((calculatedYMax / 5) * i);
        return { y: yScale(value), label: value };
    });

    const xLabels = data.map((d, i) => ({ x: xScale(i) + barWidth / 2, label: d.label })).filter((_, i, arr) => {
        if (arr.length <= 10) return true;
        return i % Math.ceil(arr.length / 10) === 0;
    });

    return { bars: chartBars, yAxisLabels: yLabels, xAxisLabels: xLabels };
  }, [data, width, height]);
  

  if (!data.length) return null;

  return (
    <svg ref={svgRef} width="100%" height={height} className="text-[hsl(var(--muted-foreground))]">
      {/* Y Axis Grid Lines & Labels */}
      {yAxisLabels.map(({ y, label }) => (
        <g key={`y-axis-${label}`} className="text-xs">
          <line x1={40} x2={width - 20} y1={y} y2={y} stroke="currentColor" strokeOpacity={0.2} />
          <text x={35} y={y + 4} textAnchor="end" fill="currentColor">{label}</text>
        </g>
      ))}

      {/* X Axis Labels */}
      {xAxisLabels.map(({ x, label }) => (
        <text key={`x-axis-${label}`} x={x} y={height - 15} textAnchor="middle" className="text-xs" fill="currentColor">
          {label}
        </text>
      ))}

      {/* Bars */}
      <g>
        {bars.map((bar, i) => (
          <rect
            key={i}
            x={bar.x}
            y={bar.y}
            width={bar.width}
            height={bar.height}
            fill={color}
            className="transition-all duration-500"
          >
            <title>{`${bar.label}: ${bar.value} XP`}</title>
          </rect>
        ))}
      </g>
    </svg>
  );
};

export default BarChart;
