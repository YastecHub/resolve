import { useId, type ComponentProps, type ReactNode } from 'react';
import { cn } from '~/lib/cn';

const controlStyles =
  'w-full rounded-md border bg-surface px-3 text-small text-text placeholder:text-text-3 transition-[border-color,box-shadow] duration-fast ease-standard focus-visible:outline-none focus-visible:ring-3 disabled:cursor-not-allowed disabled:bg-surface-2 disabled:text-text-3';

interface ControlProps {
  invalid?: boolean;
}

export function Input({ invalid, className, ...props }: ComponentProps<'input'> & ControlProps) {
  return (
    <input
      aria-invalid={invalid || undefined}
      className={cn(
        controlStyles,
        'h-9',
        invalid
          ? 'border-danger focus-visible:ring-danger/25'
          : 'border-control-border hover:border-text-3 focus-visible:border-accent focus-visible:ring-accent/25',
        className,
      )}
      {...props}
    />
  );
}

export function Textarea({
  invalid,
  className,
  ...props
}: ComponentProps<'textarea'> & ControlProps) {
  return (
    <textarea
      aria-invalid={invalid || undefined}
      className={cn(
        controlStyles,
        'min-h-24 py-2',
        invalid
          ? 'border-danger focus-visible:ring-danger/25'
          : 'border-control-border hover:border-text-3 focus-visible:border-accent focus-visible:ring-accent/25',
        className,
      )}
      {...props}
    />
  );
}

interface FieldProps {
  label: string;
  hint?: string;
  error?: string;
  children: (props: { id: string; describedBy?: string; invalid: boolean }) => ReactNode;
}

export function Field({ label, hint, error, children }: FieldProps) {
  const id = useId();
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-caption text-text-2">
        {label}
      </label>
      {children({ id, describedBy, invalid: Boolean(error) })}
      {error ? (
        <p id={`${id}-error`} className="text-small text-danger">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="text-small text-text-3">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
