import { useId } from 'react';
import { cn } from '~/lib/cn';

const PLUM = 'var(--adire-plum)';
const TEAL = 'var(--adire-teal)';
const MINT = 'var(--adire-mint)';
const GREEN = 'var(--adire-green)';
const PAPER = 'var(--adire-paper)';

function Eye({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <circle cx="20" cy="20" r="18" fill={PLUM} />
      <circle cx="20" cy="20" r="7" fill={PAPER} />
    </g>
  );
}

function Petals({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <path d="M0 0H20A20 20 0 0 1 0 20Z" fill={MINT} />
      <path d="M40 0V20A20 20 0 0 1 20 0Z" fill={MINT} />
      <path d="M40 40H20A20 20 0 0 1 40 20Z" fill={MINT} />
      <path d="M0 40V20A20 20 0 0 1 20 40Z" fill={MINT} />
      <circle cx="20" cy="20" r="6" fill={GREEN} />
    </g>
  );
}

function Ring({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <circle cx="20" cy="20" r="18" fill={TEAL} />
      <circle cx="20" cy="20" r="10" fill={PAPER} />
      <circle cx="20" cy="20" r="4" fill={TEAL} />
    </g>
  );
}

function Seed({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <path d="M0 0H20A20 20 0 0 1 0 20Z" fill={PLUM} />
      <path d="M40 40H20A20 20 0 0 1 40 20Z" fill={PLUM} />
      <circle cx="20" cy="20" r="8" fill={GREEN} />
    </g>
  );
}

export function AdirePattern({ id, cell }: { id: string; cell: number }) {
  return (
    <pattern
      id={id}
      width="160"
      height="80"
      patternUnits="userSpaceOnUse"
      patternTransform={`scale(${cell / 40})`}
    >
      <rect width="160" height="80" fill={PAPER} />
      <Eye x={0} y={0} />
      <Petals x={40} y={0} />
      <Ring x={80} y={0} />
      <Seed x={120} y={0} />
      <Ring x={0} y={40} />
      <Seed x={40} y={40} />
      <Eye x={80} y={40} />
      <Petals x={120} y={40} />
    </pattern>
  );
}

interface AdireBandProps {
  cell?: number;
  className?: string;
}

export function AdireBand({ cell = 40, className }: AdireBandProps) {
  const id = useId();
  return (
    <svg aria-hidden="true" className={cn('block w-full', className)}>
      <defs>
        <AdirePattern id={id} cell={cell} />
      </defs>
      <rect width="100%" height="100%" fill={`url(#${CSS.escape(id)})`} />
    </svg>
  );
}
