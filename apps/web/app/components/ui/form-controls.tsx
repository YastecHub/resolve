import {
  RadioGroup as Radio,
  Slider as SliderPrimitive,
  Switch as SwitchPrimitive,
} from 'radix-ui';
import type { ComponentProps } from 'react';
import { cn } from '~/lib/cn';

export function Switch({ className, ...props }: ComponentProps<typeof SwitchPrimitive.Root>) {
  return (
    <SwitchPrimitive.Root
      className={cn(
        'inline-flex h-5 w-9 shrink-0 items-center rounded-full border border-transparent bg-surface-3 transition-colors duration-fast ease-standard data-[state=checked]:bg-accent disabled:opacity-50',
        className,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb className="block size-4 translate-x-0.5 rounded-full bg-surface shadow-card transition-transform duration-fast ease-standard data-[state=checked]:translate-x-4.5" />
    </SwitchPrimitive.Root>
  );
}

export function Slider({ className, ...props }: ComponentProps<typeof SliderPrimitive.Root>) {
  return (
    <SliderPrimitive.Root
      className={cn('relative flex h-5 w-full touch-none items-center select-none', className)}
      {...props}
    >
      <SliderPrimitive.Track className="relative h-1.5 grow rounded-full bg-surface-3">
        <SliderPrimitive.Range className="absolute h-full rounded-full bg-accent" />
      </SliderPrimitive.Track>
      <SliderPrimitive.Thumb
        aria-label={props['aria-label'] ?? 'Value'}
        className="block size-5 rounded-full border border-border-strong bg-surface shadow-card"
      />
    </SliderPrimitive.Root>
  );
}

export function RadioGroup({ className, ...props }: ComponentProps<typeof Radio.Root>) {
  return <Radio.Root className={cn('flex flex-col gap-2', className)} {...props} />;
}

export function RadioItem({ value, label, id }: { value: string; label: string; id: string }) {
  return (
    <div className="flex items-center gap-2">
      <Radio.Item
        id={id}
        value={value}
        className="flex size-4.5 items-center justify-center rounded-full border border-control-border bg-surface data-[state=checked]:border-accent"
      >
        <Radio.Indicator className="size-2 rounded-full bg-accent" />
      </Radio.Item>
      <label htmlFor={id} className="text-small text-text">
        {label}
      </label>
    </div>
  );
}
