import { cn } from '~/lib/cn';

export function UntrustedQuote({ children, className }: { children: string; className?: string }) {
  return (
    <blockquote
      className={cn(
        'border-l-2 border-border-strong pl-3 text-small text-text-2 italic',
        className,
      )}
    >
      {children}
    </blockquote>
  );
}
