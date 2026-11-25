import { useLayoutEffect, useRef, useState, type ComponentProps } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '~/lib/cn';
import { Spinner } from './spinner';

export const buttonStyles = cva(
  'relative inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-md text-small font-medium transition-colors duration-fast ease-standard disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        primary: 'bg-accent text-accent-contrast hover:brightness-110',
        secondary: 'border border-border-strong bg-surface text-text hover:bg-surface-2',
        ghost: 'text-text-2 hover:bg-surface-2 hover:text-text',
        destructive:
          'bg-danger text-accent-contrast hover:brightness-110 focus-visible:outline-danger',
      },
      size: {
        md: 'h-9 px-4',
        sm: 'h-8 px-3',
        icon: 'size-9',
        'icon-sm': 'size-8',
      },
    },
    defaultVariants: { variant: 'secondary', size: 'md' },
  },
);

export interface ButtonProps extends ComponentProps<'button'>, VariantProps<typeof buttonStyles> {
  loading?: boolean;
  loadingLabel?: string;
}

export function Button({
  variant,
  size,
  loading = false,
  loadingLabel,
  disabled,
  className,
  children,
  style,
  type = 'button',
  ...props
}: ButtonProps) {
  const ref = useRef<HTMLButtonElement>(null);
  const [restingWidth, setRestingWidth] = useState<number>();

  useLayoutEffect(() => {
    if (loading) setRestingWidth((width) => width ?? ref.current?.offsetWidth);
    else setRestingWidth(undefined);
  }, [loading]);

  const iconOnly = size === 'icon' || size === 'icon-sm';

  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(
        buttonStyles({ variant, size }),
        loading && 'cursor-progress disabled:opacity-100',
        className,
      )}
      style={loading && restingWidth ? { minWidth: restingWidth, ...style } : style}
      {...props}
    >
      {loading ? (
        <>
          <Spinner />
          {iconOnly ? (
            <span className="sr-only">{loadingLabel ?? 'Loading'}</span>
          ) : (
            (loadingLabel ?? children)
          )}
        </>
      ) : (
        children
      )}
    </button>
  );
}
