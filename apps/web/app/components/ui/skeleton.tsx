import { cn } from '~/lib/cn';

export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden="true" className={cn('skeleton rounded-sm', className)} />;
}

function Loading({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div role="status" aria-live="polite" className={className}>
      <span className="sr-only">Loading</span>
      {children}
    </div>
  );
}

export function SkeletonText({ lines = 3, className }: { lines?: number; className?: string }) {
  return (
    <Loading className={cn('flex flex-col gap-2', className)}>
      {Array.from({ length: lines }, (_, i) => (
        <Skeleton key={i} className={cn('h-3.5', i === lines - 1 ? 'w-2/3' : 'w-full')} />
      ))}
    </Loading>
  );
}

export function SkeletonKpiCard({ className }: { className?: string }) {
  return (
    <Loading
      className={cn(
        'flex flex-col gap-3 rounded-lg border border-border bg-surface p-5 shadow-card',
        className,
      )}
    >
      <Skeleton className="h-3 w-24" />
      <Skeleton className="h-10 w-32" />
      <Skeleton className="h-3.5 w-40" />
    </Loading>
  );
}

export function SkeletonTableRows({ rows = 5, columns = 6 }: { rows?: number; columns?: number }) {
  return (
    <Loading className="flex flex-col divide-y divide-border">
      {Array.from({ length: rows }, (_, row) => (
        <div key={row} className="flex h-16 items-center gap-6 px-4">
          {Array.from({ length: columns }, (_, col) => (
            <Skeleton key={col} className={cn('h-3.5 flex-1', col === 0 && 'max-w-24')} />
          ))}
        </div>
      ))}
    </Loading>
  );
}

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <Loading
      className={cn(
        'flex flex-col gap-4 rounded-lg border border-border bg-surface p-5 shadow-card',
        className,
      )}
    >
      <Skeleton className="h-4 w-40" />
      <SkeletonText lines={3} />
      <Skeleton className="h-9 w-28 rounded-md" />
    </Loading>
  );
}
