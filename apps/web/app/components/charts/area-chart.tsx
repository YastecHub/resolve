import { useId, useState } from 'react';
import { useElementWidth } from '~/lib/use-element-width';
import { cn } from '~/lib/cn';

export interface AreaPoint {
  label: string;
  value: number;
}

interface AreaChartProps {
  data: readonly AreaPoint[];
  label: string;
  height?: number;
  unit?: string;
  className?: string;
}

const MARGIN = { top: 12, right: 12, bottom: 24, left: 32 };

function niceMax(value: number) {
  const step = value <= 10 ? 2 : value <= 50 ? 10 : 50;
  return Math.max(step, Math.ceil(value / step) * step);
}

export function AreaChart({ data, label, height = 220, unit = '', className }: AreaChartProps) {
  const [ref, width] = useElementWidth<HTMLDivElement>();
  const gradientId = useId();
  const [active, setActive] = useState<number | null>(null);

  if (data.length < 2) return null;

  const max = niceMax(Math.max(...data.map((d) => d.value)));
  const innerW = Math.max(1, width - MARGIN.left - MARGIN.right);
  const innerH = height - MARGIN.top - MARGIN.bottom;
  const x = (index: number) => MARGIN.left + (index / (data.length - 1)) * innerW;
  const y = (value: number) => MARGIN.top + (1 - value / max) * innerH;
  const line = data
    .map((d, i) => `${i === 0 ? 'M' : 'L'} ${x(i).toFixed(1)} ${y(d.value).toFixed(1)}`)
    .join(' ');
  const area = `${line} L ${x(data.length - 1).toFixed(1)} ${MARGIN.top + innerH} L ${x(0).toFixed(1)} ${MARGIN.top + innerH} Z`;
  const ticks = [0, max / 2, max];
  const labelEvery = Math.ceil(data.length / Math.max(2, Math.floor(innerW / 64)));
  const activePoint = active === null ? null : data[active];
  const peak = data.reduce((a, b) => (b.value > a.value ? b : a));

  const onMove = (clientX: number, rect: DOMRect) => {
    const ratio = (clientX - rect.left - MARGIN.left) / innerW;
    setActive(Math.min(data.length - 1, Math.max(0, Math.round(ratio * (data.length - 1)))));
  };

  return (
    <div ref={ref} className={cn('relative w-full', className)}>
      <svg
        role="img"
        aria-label={`${label}. Peak ${peak.value}${unit} at ${peak.label}.`}
        width={width}
        height={height}
        onPointerMove={(e) => onMove(e.clientX, e.currentTarget.getBoundingClientRect())}
        onPointerLeave={() => setActive(null)}
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.3" />
            <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
          </linearGradient>
        </defs>
        {ticks.map((tick) => (
          <g key={tick}>
            <line
              x1={MARGIN.left}
              x2={width - MARGIN.right}
              y1={y(tick)}
              y2={y(tick)}
              stroke="var(--border)"
              strokeDasharray={tick === 0 ? undefined : '3 4'}
            />
            <text
              x={MARGIN.left - 8}
              y={y(tick)}
              textAnchor="end"
              dominantBaseline="middle"
              className="fill-text-3 text-caption tabular"
            >
              {tick}
            </text>
          </g>
        ))}
        {data.map((d, i) =>
          i % labelEvery === 0 ? (
            <text
              key={d.label}
              x={x(i)}
              y={height - 6}
              textAnchor="middle"
              className="fill-text-3 text-caption"
            >
              {d.label}
            </text>
          ) : null,
        )}
        <path d={area} fill={`url(#${gradientId})`} />
        <path
          d={line}
          fill="none"
          stroke="var(--accent)"
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {active !== null && activePoint ? (
          <g>
            <line
              x1={x(active)}
              x2={x(active)}
              y1={MARGIN.top}
              y2={MARGIN.top + innerH}
              stroke="var(--border-strong)"
            />
            <circle
              cx={x(active)}
              cy={y(activePoint.value)}
              r="4"
              fill="var(--surface)"
              stroke="var(--accent)"
              strokeWidth="2"
            />
          </g>
        ) : null}
      </svg>
      {active !== null && activePoint ? (
        <div
          className="pointer-events-none absolute z-10 -translate-x-1/2 rounded-md border border-border-strong bg-surface px-3 py-1.5 text-small shadow-pop"
          style={{ left: x(active), top: Math.max(0, y(activePoint.value) - 52) }}
        >
          <div className="text-caption text-text-3">{activePoint.label}</div>
          <div className="tabular text-text">
            {activePoint.value}
            {unit}
          </div>
        </div>
      ) : null}
    </div>
  );
}
