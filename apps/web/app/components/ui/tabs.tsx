import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { Tabs as Primitive } from 'radix-ui';
import { cn } from '~/lib/cn';

export const Tabs = Primitive.Root;

interface Bar {
  left: number;
  width: number;
}

export function TabsList({ children, label }: { children: ReactNode; label: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [bar, setBar] = useState<Bar | null>(null);
  const [animate, setAnimate] = useState(false);

  const measure = useCallback(() => {
    const list = ref.current;
    const active = list?.querySelector<HTMLElement>('[role="tab"][data-state="active"]');
    setBar(active ? { left: active.offsetLeft, width: active.offsetWidth } : null);
  }, []);

  useLayoutEffect(() => {
    const list = ref.current;
    if (!list) return;
    measure();
    const mutations = new MutationObserver(measure);
    mutations.observe(list, { attributes: true, subtree: true, attributeFilter: ['data-state'] });
    const sizes = new ResizeObserver(measure);
    sizes.observe(list);
    list.querySelectorAll('[role="tab"]').forEach((tab) => sizes.observe(tab));
    return () => {
      mutations.disconnect();
      sizes.disconnect();
    };
  }, [measure, children]);

  useEffect(() => {
    if (!bar || animate) return;
    const frame = requestAnimationFrame(() => setAnimate(true));
    return () => cancelAnimationFrame(frame);
  }, [bar, animate]);

  return (
    <Primitive.List
      ref={ref}
      aria-label={label}
      className="relative flex gap-1 border-b border-border"
    >
      {children}
      {bar ? (
        <span
          aria-hidden="true"
          className={cn(
            'pointer-events-none absolute -bottom-px left-0 h-0.5 rounded-full bg-accent',
            animate && 'transition-[transform,width] duration-base ease-standard',
          )}
          style={{ width: bar.width, transform: `translateX(${bar.left}px)` }}
        />
      ) : null}
    </Primitive.List>
  );
}

export function TabsTrigger({
  value,
  children,
  count,
}: {
  value: string;
  children: ReactNode;
  count?: number;
}) {
  return (
    <Primitive.Trigger
      value={value}
      className="inline-flex h-9 items-center gap-2 px-3 text-small font-medium text-text-2 transition-colors duration-fast ease-standard hover:text-text data-[state=active]:text-text"
    >
      {children}
      {count !== undefined ? (
        <span className="tabular rounded-full bg-surface-3 px-1.5 text-caption text-text-2">
          {count}
        </span>
      ) : null}
    </Primitive.Trigger>
  );
}

export const TabsContent = Primitive.Content;
