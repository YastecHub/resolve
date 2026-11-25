import { Command } from 'cmdk';
import { Dialog as Primitive } from 'radix-ui';
import { AppIcon } from '~/components/app-icon';
import { Kbd } from '~/components/ui/kbd';
import type { IconKey } from '~/lib/icons';
import { cn } from '~/lib/cn';

export interface PaletteItem {
  id: string;
  label: string;
  icon: IconKey;
  group: string;
  hint?: string;
  onSelect?: () => void;
}

export function PaletteList({
  items,
  className,
  onSelect,
  query,
  onQueryChange,
}: {
  items: readonly PaletteItem[];
  className?: string;
  onSelect?: (item: PaletteItem) => void;
  query?: string;
  onQueryChange?: (query: string) => void;
}) {
  const groups = [...new Set(items.map((item) => item.group))];
  return (
    <Command label="Command palette" className={cn('flex flex-col', className)}>
      <div className="flex items-center gap-2 border-b border-border px-4">
        <AppIcon name="common.search" size={20} className="text-text-3" />
        <Command.Input
          value={query}
          onValueChange={onQueryChange}
          placeholder="Search cases, pages and actions…"
          className="h-12 flex-1 bg-transparent text-body text-text placeholder:text-text-3 focus:outline-none"
        />
        <Kbd>Esc</Kbd>
      </div>
      <Command.List className="max-h-80 overflow-y-auto p-2">
        <Command.Empty className="px-3 py-8 text-center text-small text-text-3">
          Nothing matches that search.
        </Command.Empty>
        {groups.map((group) => (
          <Command.Group
            key={group}
            heading={group}
            className="[&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-caption [&_[cmdk-group-heading]]:text-text-3"
          >
            {items
              .filter((item) => item.group === group)
              .map((item) => (
                <Command.Item
                  key={item.id}
                  value={item.label}
                  onSelect={() => {
                    item.onSelect?.();
                    onSelect?.(item);
                  }}
                  className="flex h-9 cursor-pointer items-center gap-3 rounded-md px-3 text-small text-text-2 data-[selected=true]:bg-accent-soft data-[selected=true]:text-accent-text"
                >
                  <AppIcon name={item.icon} size={16} />
                  <span className="flex-1">{item.label}</span>
                  {item.hint ? <span className="text-caption text-text-3">{item.hint}</span> : null}
                </Command.Item>
              ))}
          </Command.Group>
        ))}
      </Command.List>
    </Command>
  );
}

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: readonly PaletteItem[];
  query?: string;
  onQueryChange?: (query: string) => void;
}

export function CommandPalette({
  open,
  onOpenChange,
  items,
  query,
  onQueryChange,
}: CommandPaletteProps) {
  return (
    <Primitive.Root open={open} onOpenChange={onOpenChange}>
      <Primitive.Portal>
        <Primitive.Overlay className="fixed inset-0 z-40 bg-scrim backdrop-blur-xs data-[state=open]:animate-in data-[state=open]:fade-in-0" />
        <Primitive.Content className="ui-zoom fixed top-24 left-1/2 z-50 w-[calc(100%-2rem)] max-w-xl -translate-x-1/2 overflow-hidden rounded-xl border border-border bg-surface shadow-pop data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-98">
          <Primitive.Title className="sr-only">Command palette</Primitive.Title>
          <Primitive.Description className="sr-only">
            Search for a case, page or action.
          </Primitive.Description>
          <PaletteList
            items={items}
            query={query}
            onQueryChange={onQueryChange}
            onSelect={() => onOpenChange(false)}
          />
        </Primitive.Content>
      </Primitive.Portal>
    </Primitive.Root>
  );
}
