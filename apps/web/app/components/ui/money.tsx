import { formatNaira } from '@resolve/shared';
import { cn } from '~/lib/cn';

interface MoneyProps {
  minor: number;
  className?: string;
}

export function Money({ minor, className }: MoneyProps) {
  return <span className={cn('tabular whitespace-nowrap', className)}>{formatNaira(minor)}</span>;
}
