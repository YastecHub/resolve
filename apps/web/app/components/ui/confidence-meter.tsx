import { useId } from 'react';
import { useTween } from '~/lib/use-tween';
import { cn } from '~/lib/cn';

export const HIGH_CONFIDENCE = 0.9;
export const MEDIUM_CONFIDENCE = 0.6;

function band(value: number) {
  if (value >= HIGH_CONFIDENCE) return 'high';
  if (value >= MEDIUM_CONFIDENCE) return 'medium';
  return 'low';
}

const BAR_COLOR = { high: 'bg-success', medium: 'bg-warning', low: 'bg-danger' } as const;
const ARC_COLOR = {
  high: 'var(--success)',
  medium: 'var(--warning)',
  low: 'var(--danger)',
} as const;

interface ConfidenceMeterProps {
  value: number;
  threshold?: number;
  className?: string;
}

function percent(value: number) {
  return Math.round(value * 100);
}

export function ConfidenceMeter({ value, threshold, className }: ConfidenceMeterProps) {
  const current = band(value);
  return (
    <div
      role="img"
      aria-label={`Confidence ${percent(value)} percent`}
      className={cn('inline-flex items-center gap-2', className)}
    >
      <span aria-hidden="true" className="relative h-1.5 w-14 rounded-full bg-surface-3">
        <span
          className={cn('absolute inset-y-0 left-0 rounded-full', BAR_COLOR[current])}
          style={{ width: `${percent(value)}%` }}
        />
        {threshold !== undefined ? (
          <span
            className="absolute -inset-y-0.5 w-0.5 rounded-full bg-text-2"
            style={{ left: `${percent(threshold)}%` }}
          />
        ) : null}
      </span>
      <span aria-hidden="true" className="tabular text-small text-text-2">
        {percent(value)}%
      </span>
    </div>
  );
}

const ARC = { cx: 56, cy: 56, radius: 48, stroke: 6, width: 112, height: 64 } as const;
const ARC_LENGTH = Math.PI * ARC.radius;

function arcPoint(fraction: number, radius: number) {
  const angle = Math.PI * fraction;
  return {
    x: ARC.cx - radius * Math.cos(angle),
    y: ARC.cy - radius * Math.sin(angle),
  };
}

interface ConfidenceArcProps {
  value: number;
  threshold?: number;
  label?: string;
  className?: string;
}

export function ConfidenceArc({
  value,
  threshold,
  label = 'confidence',
  className,
}: ConfidenceArcProps) {
  const gradientId = useId();
  const drawn = useTween(value, 700, 0);
  const current = band(value);
  const stroke = current === 'high' ? `url(#${gradientId})` : ARC_COLOR[current];
  const knob = arcPoint(drawn, ARC.radius);
  const tickInner = threshold === undefined ? null : arcPoint(threshold, ARC.radius - 8);
  const tickOuter = threshold === undefined ? null : arcPoint(threshold, ARC.radius + 8);
  const description =
    threshold === undefined
      ? `Confidence ${percent(value)} percent`
      : `Confidence ${percent(value)} percent, threshold ${percent(threshold)} percent`;

  return (
    <div
      role="img"
      aria-label={description}
      className={cn('inline-flex flex-col items-center gap-1', className)}
    >
      <div className="relative" style={{ width: ARC.width, height: ARC.height }}>
        <svg
          viewBox={`0 0 ${ARC.width} ${ARC.height}`}
          width={ARC.width}
          height={ARC.height}
          aria-hidden="true"
          className="overflow-visible"
        >
          <defs>
            <linearGradient
              id={gradientId}
              gradientUnits="userSpaceOnUse"
              x1={ARC.cx - ARC.radius}
              y1="0"
              x2={ARC.cx + ARC.radius}
              y2="0"
            >
              <stop offset="0%" stopColor="var(--ai-from)" />
              <stop offset="100%" stopColor="var(--ai-to)" />
            </linearGradient>
          </defs>
          <path
            d={`M ${ARC.cx - ARC.radius} ${ARC.cy} A ${ARC.radius} ${ARC.radius} 0 0 1 ${ARC.cx + ARC.radius} ${ARC.cy}`}
            fill="none"
            stroke="var(--surface-3)"
            strokeWidth={ARC.stroke}
            strokeLinecap="round"
          />
          <path
            d={`M ${ARC.cx - ARC.radius} ${ARC.cy} A ${ARC.radius} ${ARC.radius} 0 0 1 ${ARC.cx + ARC.radius} ${ARC.cy}`}
            fill="none"
            stroke={stroke}
            strokeWidth={ARC.stroke}
            strokeLinecap="round"
            strokeDasharray={ARC_LENGTH}
            strokeDashoffset={ARC_LENGTH * (1 - drawn)}
          />
          {tickInner && tickOuter ? (
            <line
              x1={tickInner.x}
              y1={tickInner.y}
              x2={tickOuter.x}
              y2={tickOuter.y}
              stroke="var(--text-2)"
              strokeWidth="2"
              strokeLinecap="round"
            />
          ) : null}
          <circle
            cx={knob.x}
            cy={knob.y}
            r="5"
            fill="var(--surface)"
            stroke={current === 'high' ? 'var(--ai-to)' : ARC_COLOR[current]}
            strokeWidth="2.5"
          />
        </svg>
        <div
          aria-hidden="true"
          className="absolute inset-x-0 bottom-0 flex items-baseline justify-center gap-0.5"
        >
          <span className="tabular text-meter">{Math.round(drawn * 100)}</span>
          <span className="text-small text-text-3">%</span>
        </div>
      </div>
      <span aria-hidden="true" className="text-caption text-text-3">
        {label}
      </span>
    </div>
  );
}
