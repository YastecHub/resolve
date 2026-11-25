import { cn } from '~/lib/cn';

export function Avatar({ name, className }: { name: string; className?: string }) {
  const initials = (name.includes('@') ? (name.split('@')[0] ?? name) : name)
    .split(/[\s._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
  return (
    <span
      aria-hidden="true"
      className={cn(
        'inline-flex size-8 items-center justify-center rounded-full bg-accent-soft text-caption text-accent-text',
        className,
      )}
    >
      {initials}
    </span>
  );
}
