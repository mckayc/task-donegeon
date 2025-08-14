
import React, { useMemo, useRef, useEffect, useState } from 'react';

interface ChartData {
  label: string;
  value: number;
}

interface LineChartProps {
  data: ChartData[];
  color?: string;
}

const LineChart: React.FC<LineChartProps> = ({ data, color = '#10b981' }) => {
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

  const { path, points, yAxisLabels, xAxisLabels } = useMemo(() => {
    if (!data.length || width === 0) return { path: '', points: [], yAxisLabels: [], xAxisLabels: [] };

    const padding = { top: 20, right: 20, bottom: 40, left: 40 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;
    
    const maxValue = Math.max(...data.map(d => d.value), 0);
    const yMax = Math.ceil(maxValue / 10) * 10 || 10;
    
    const xScale = (i: number) => padding.left + (i / (data.length - 1)) * chartWidth;
    const yScale = (value: number) => padding.top + chartHeight - (value / yMax) * chartHeight;

    const pathD = data.map((point, i) => {
        const x = xScale(i);
        const y = yScale(point.value);
        return `${i === 0 ? 'M' : 'L'} ${x},${y}`;
    }).join(' ');

    const chartPoints = data.map((point, i) => ({
      x: xScale(i),
      y: yScale(point.value),
      value: point.value,
      label: point.label
    }));

    const yLabels = Array.from({ length: 6 }, (_, i) => {
        const value = (yMax / 5) * i;
        return { y: yScale(value), label: value };
    });

    const xLabels = data.map((d, i) => ({ x: xScale(i), label: d.label })).filter((_, i, arr) => {
        if (arr.length <= 10) return true;
        return i % Math.ceil(arr.length / 10) === 0;
    });

    return { path: pathD, points: chartPoints, yAxisLabels: yLabels, xAxisLabels: xLabels };
  }, [data, width, height]);
  
  const [strokeDashoffset, setStrokeDashoffset] = useState(1000); // Start with a large offset

  useEffect(() => {
    // Animate the line drawing
    setStrokeDashoffset(0);
  }, [path]);

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

      {/* Line Path */}
      <path
        d={path}
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{
            strokeDasharray: 1000,
            strokeDashoffset: strokeDashoffset,
            transition: 'stroke-dashoffset 1.5s ease-in-out',
        }}
      />
      
      {/* Data Points */}
      <g>
        {points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r={4} fill={color} stroke="#1c1917" strokeWidth="2">
            <title>{`${p.label}: ${p.value} XP`}</title>
          </circle>
        ))}
      </g>
    </svg>
  );
};

export default LineChart;
