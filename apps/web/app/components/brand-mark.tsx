import { useId, type ComponentType } from 'react';
import { cn } from '~/lib/cn';

export interface MarkProps {
  size?: number;
  className?: string;
  animated?: boolean;
}

function Svg({
  size = 64,
  className,
  children,
}: Pick<MarkProps, 'size' | 'className'> & { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      fill="currentColor"
      aria-hidden="true"
      className={cn('shrink-0', className)}
    >
      {children}
    </svg>
  );
}

export function ReconciliationMark(props: MarkProps) {
  return (
    <Svg {...props}>
      <g transform="translate(-2 3)">
        <polygon points="24,16 60,16 52,24 16,24" />
        <polygon points="16,34 52,34 44,42 8,42" />
      </g>
    </Svg>
  );
}

export function HalvesMark(props: MarkProps) {
  return (
    <Svg {...props}>
      <path d="M 28 20 A 16 16 0 0 0 28 52" fill="none" stroke="currentColor" strokeWidth="6" />
      <path d="M 36 12 A 16 16 0 0 1 36 44" fill="none" stroke="currentColor" strokeWidth="6" />
    </Svg>
  );
}

export function SliceMark({ animated = false, ...props }: MarkProps) {
  const top = useId();
  const bottom = useId();
  return (
    <Svg {...props}>
      <defs>
        <clipPath id={top}>
          <rect x="0" y="0" width="64" height="30" />
        </clipPath>
        <clipPath id={bottom}>
          <rect x="0" y="34" width="64" height="30" />
        </clipPath>
      </defs>
      <g transform="translate(5 0)" className={animated ? 'slice-half-top' : undefined}>
        <circle cx="32" cy="32" r="22" clipPath={`url(#${top})`} />
      </g>
      <g transform="translate(-5 0)" className={animated ? 'slice-half-bottom' : undefined}>
        <circle cx="32" cy="32" r="22" clipPath={`url(#${bottom})`} />
      </g>
    </Svg>
  );
}

export function OverlapMark(props: MarkProps) {
  return (
    <Svg {...props}>
      <g fill="none" stroke="currentColor" strokeWidth="5">
        <rect x="12.5" y="12.5" width="27" height="27" rx="3" />
        <rect x="24.5" y="24.5" width="27" height="27" rx="3" />
      </g>
      <rect x="25" y="25" width="15" height="15" />
    </Svg>
  );
}

export function SeamMark(props: MarkProps) {
  return (
    <Svg {...props}>
      <polygon points="10,10 50,10 10,50" />
      <polygon points="57,11 57,51 17,51" />
    </Svg>
  );
}

export const BrandMark = SliceMark;

export function BrandTile({
  size = 32,
  className,
  animated = false,
}: {
  size?: number;
  className?: string;
  animated?: boolean;
}) {
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center justify-center bg-accent text-accent-contrast',
        className,
      )}
      style={{ width: size, height: size, borderRadius: size * 0.225 }}
    >
      <BrandMark size={size * 0.72} animated={animated} />
    </span>
  );
}

export interface Concept {
  id: string;
  name: string;
  idea: string;
  Mark: ComponentType<MarkProps>;
}

export const CONCEPTS: readonly Concept[] = [
  {
    id: 'reconciliation',
    name: 'B · Reconciliation',
    idea: 'Two ledger lines. The top one sits one notch out of line, about to slide into agreement.',
    Mark: ReconciliationMark,
  },
  {
    id: 'halves',
    name: 'D · Halves',
    idea: 'Two half circles, debit and credit, offset so they nearly close.',
    Mark: HalvesMark,
  },
  {
    id: 'slice',
    name: 'E · Slice · chosen',
    idea: 'A disc cut through and shifted by one notch: one whole record, two sides not yet aligned.',
    Mark: SliceMark,
  },
  {
    id: 'overlap',
    name: 'F · Overlap',
    idea: 'Two records as outlined squares. Where they overlap, they agree, and that part is solid.',
    Mark: OverlapMark,
  },
  {
    id: 'seam',
    name: 'G · Seam',
    idea: 'A square cut along the diagonal, one half displaced along the seam.',
    Mark: SeamMark,
  },
];

interface WordmarkProps {
  size?: number;
  lowercase?: boolean;
  className?: string;
}

export function Wordmark({ size = 24, lowercase = false, className }: WordmarkProps) {
  return (
    <span
      className={cn('leading-none font-semibold tracking-[-0.02em]', className)}
      style={{ fontSize: size }}
    >
      {lowercase ? 'resolve' : 'Resolve'}
    </span>
  );
}

interface LockupProps {
  Mark: ComponentType<MarkProps>;
  size?: number;
  layout?: 'horizontal' | 'stacked';
  lowercase?: boolean;
  className?: string;
}

export function Lockup({
  Mark,
  size = 28,
  layout = 'horizontal',
  lowercase,
  className,
}: LockupProps) {
  const markSize = size * 1.35;
  return (
    <span
      className={cn(
        'inline-flex items-center',
        layout === 'stacked' ? 'flex-col gap-3' : 'gap-2',
        className,
      )}
    >
      <Mark size={layout === 'stacked' ? markSize * 1.6 : markSize} />
      <Wordmark size={size} lowercase={lowercase} />
    </span>
  );
}
