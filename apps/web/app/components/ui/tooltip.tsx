import type { ReactNode } from 'react';
import { Tooltip as Primitive } from 'radix-ui';
import { cn } from '~/lib/cn';

export function TooltipProvider({ children }: { children: ReactNode }) {
  return (
    <Primitive.Provider delayDuration={300} skipDelayDuration={150}>
      {children}
    </Primitive.Provider>
  );
}

interface BubbleProps {
  content: ReactNode;
  title?: string;
  shortcut?: readonly string[];
  className?: string;
}

const BUBBLE =
  'flex max-w-72 items-center gap-3 rounded-md bg-text px-3 py-2 text-small text-bg shadow-pop';

function Body({ content, title, shortcut }: BubbleProps) {
  return (
    <>
      <span className="flex min-w-0 flex-col gap-0.5">
        {title ? <span className="font-medium">{title}</span> : null}
        <span className={cn(title && 'text-bg/75')}>{content}</span>
      </span>
      {shortcut && shortcut.length > 0 ? (
        <span className="flex shrink-0 items-center gap-1">
          {shortcut.map((key) => (
            <kbd
              key={key}
              className="inline-flex h-5 min-w-5 items-center justify-center rounded-sm bg-bg/15 px-1 font-mono text-caption"
            >
              {key}
            </kbd>
          ))}
        </span>
      ) : null}
    </>
  );
}

export function TooltipBubble({
  arrow = false,
  className,
  ...props
}: BubbleProps & { arrow?: boolean }) {
  return (
    <div className={cn(BUBBLE, arrow && 'relative mb-1.5', className)}>
      <Body {...props} />
      {arrow ? (
        <span
          aria-hidden="true"
          className="absolute -bottom-1 left-1/2 size-2 -translate-x-1/2 rotate-45 rounded-xs bg-text"
        />
      ) : null}
    </div>
  );
}

interface TooltipProps extends BubbleProps {
  children: ReactNode;
  side?: 'top' | 'right' | 'bottom' | 'left';
  align?: 'start' | 'center' | 'end';
}

export function Tooltip({
  children,
  side = 'top',
  align = 'center',
  className,
  ...body
}: TooltipProps) {
  return (
    <Primitive.Root>
      <Primitive.Trigger asChild>{children}</Primitive.Trigger>
      <Primitive.Portal>
        <Primitive.Content
          side={side}
          align={align}
          sideOffset={8}
          collisionPadding={12}
          className={cn(
            BUBBLE,
            'ui-zoom z-50 animate-in fade-in-0 zoom-in-98 data-[side=bottom]:slide-in-from-top-1 data-[side=left]:slide-in-from-right-1 data-[side=right]:slide-in-from-left-1 data-[side=top]:slide-in-from-bottom-1 data-[state=closed]:animate-out data-[state=closed]:fade-out-0',
            className,
          )}
        >
          <Body {...body} />
          <Primitive.Arrow width={12} height={6} className="fill-text" />
        </Primitive.Content>
      </Primitive.Portal>
    </Primitive.Root>
  );
}
