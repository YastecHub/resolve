import type { KeyboardEvent } from 'react';
import { AppIcon } from '~/components/app-icon';
import type { IconKey } from '~/lib/icons';
import { cn } from '~/lib/cn';

export interface SegmentedOption<T extends string> {
  value: T;
  label: string;
  icon?: IconKey;
}

interface SegmentedControlProps<T extends string> {
  options: readonly SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  label: string;
  disabled?: boolean;
  className?: string;
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  label,
  disabled = false,
  className,
}: SegmentedControlProps<T>) {
  const index = Math.max(
    0,
    options.findIndex((option) => option.value === value),
  );

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    const step =
      event.key === 'ArrowRight' || event.key === 'ArrowDown'
        ? 1
        : event.key === 'ArrowLeft' || event.key === 'ArrowUp'
          ? -1
          : 0;
    if (step === 0) return;
    event.preventDefault();
    const next = (index + step + options.length) % options.length;
    const nextOption = options[next];
    if (!nextOption) return;
    onChange(nextOption.value);
    const radios =
      event.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>('[role="radio"]');
    radios?.[next]?.focus();
  };

  return (
    <div
      role="radiogroup"
      aria-label={label}
      aria-disabled={disabled || undefined}
      className={cn(
        'relative inline-grid rounded-full bg-surface-2 p-1',
        disabled && 'opacity-60',
        className,
      )}
      style={{ gridTemplateColumns: `repeat(${options.length}, 1fr)` }}
    >
      <span
        aria-hidden="true"
        className="absolute inset-y-1 left-1 rounded-full border border-border bg-surface shadow-card transition-transform duration-base ease-standard"
        style={{
          width: `calc((100% - 0.5rem) / ${options.length})`,
          transform: `translateX(${index * 100}%)`,
        }}
      />
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={selected}
            tabIndex={selected ? 0 : -1}
            disabled={disabled}
            onClick={() => onChange(option.value)}
            onKeyDown={onKeyDown}
            className={cn(
              'relative z-10 inline-flex h-8 items-center justify-center gap-2 rounded-full px-5 text-small font-medium transition-colors duration-fast ease-standard',
              selected ? 'text-text' : 'text-text-2 hover:text-text',
            )}
          >
            {option.icon ? <AppIcon name={option.icon} size={16} /> : null}
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
