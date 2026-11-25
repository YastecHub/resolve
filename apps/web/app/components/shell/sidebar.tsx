import { Link } from 'react-router';
import { APP_NAME } from '@resolve/shared';
import { AdireBand } from '~/components/adire';
import { AppIcon } from '~/components/app-icon';
import { BrandTile } from '~/components/brand-mark';
import { Tooltip } from '~/components/ui/tooltip';
import type { IconKey } from '~/lib/icons';
import { cn } from '~/lib/cn';

export interface SidebarItem {
  id: string;
  label: string;
  icon: IconKey;
  to?: string;
  onSelect?: () => void;
  count?: number;
  group?: string;
}

interface SidebarProps {
  items: readonly SidebarItem[];
  footerItems?: readonly SidebarItem[];
  footerLabel?: string;
  activeId: string;
  collapsed: boolean;
  onToggle: () => void;
  toggleDisabled?: boolean;
  className?: string;
}

const ITEM =
  'flex h-9 w-full items-center gap-3 rounded-full px-3 text-left text-small font-medium transition-colors duration-fast ease-standard focus-visible:outline-stage-accent';

function Item({
  item,
  active,
  collapsed,
}: {
  item: SidebarItem;
  active: boolean;
  collapsed: boolean;
}) {
  const className = cn(
    ITEM,
    active
      ? 'bg-stage-accent text-stage'
      : 'text-stage-text-2 hover:bg-stage-2 hover:text-stage-text',
    collapsed && 'justify-center px-0',
  );
  const content = (
    <>
      <AppIcon name={item.icon} size={20} />
      {collapsed ? (
        <span className="sr-only">{item.label}</span>
      ) : (
        <span className="flex-1">{item.label}</span>
      )}
      {!collapsed && item.count !== undefined && item.count > 0 ? (
        <span
          className={cn(
            'tabular min-w-5 rounded-full px-1.5 text-center text-caption',
            active ? 'bg-stage text-stage-accent' : 'bg-stage-2 text-stage-text',
          )}
        >
          {item.count}
        </span>
      ) : null}
    </>
  );
  const control = item.to ? (
    <Link to={item.to} aria-current={active ? 'page' : undefined} className={className}>
      {content}
    </Link>
  ) : (
    <button type="button" onClick={item.onSelect} className={className}>
      {content}
    </button>
  );
  return collapsed ? (
    <Tooltip content={item.label} side="right">
      {control}
    </Tooltip>
  ) : (
    control
  );
}

function GroupLabel({ label, collapsed }: { label: string; collapsed: boolean }) {
  return collapsed ? (
    <span aria-hidden="true" className="mx-auto my-2 block h-px w-6 bg-stage-line" />
  ) : (
    <p className="eyebrow px-3 pt-4 pb-1 text-stage-text-2">{label}</p>
  );
}

function groupsOf(items: readonly SidebarItem[]) {
  const groups: { label?: string; items: SidebarItem[] }[] = [];
  for (const item of items) {
    const last = groups.at(-1);
    if (last && last.label === item.group) last.items.push(item);
    else groups.push({ label: item.group, items: [item] });
  }
  return groups;
}

export function Sidebar({
  items,
  footerItems = [],
  footerLabel = 'Tools',
  activeId,
  collapsed,
  onToggle,
  toggleDisabled = false,
  className,
}: SidebarProps) {
  return (
    <aside
      className={cn(
        'relative flex shrink-0 flex-col overflow-hidden border-r border-stage-line bg-stage text-stage-text transition-[width] duration-base ease-standard',
        collapsed ? 'w-18' : 'w-62',
        className,
      )}
    >
      <div className={cn('flex h-14 items-center gap-2 px-4', collapsed && 'justify-center px-0')}>
        <BrandTile size={28} />
        {collapsed ? null : <span className="font-display text-h3 font-bold">{APP_NAME}</span>}
      </div>
      <nav aria-label="Primary" className="flex flex-1 flex-col gap-1 overflow-y-auto px-3 pb-2">
        {groupsOf(items).map((group, index) => (
          <div key={group.label ?? index} className="flex flex-col gap-1">
            {group.label ? <GroupLabel label={group.label} collapsed={collapsed} /> : null}
            {group.items.map((item) => (
              <Item key={item.id} item={item} active={item.id === activeId} collapsed={collapsed} />
            ))}
          </div>
        ))}
      </nav>
      <div className="flex flex-col gap-1 px-3 pt-2 pb-3">
        {footerItems.length > 0 ? <GroupLabel label={footerLabel} collapsed={collapsed} /> : null}
        {footerItems.map((item) => (
          <Item key={item.id} item={item} active={item.id === activeId} collapsed={collapsed} />
        ))}
        <button
          type="button"
          onClick={onToggle}
          disabled={toggleDisabled}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-expanded={!collapsed}
          className={cn(
            ITEM,
            'text-stage-text-2 hover:bg-stage-2 hover:text-stage-text disabled:opacity-50',
            collapsed && 'justify-center px-0',
          )}
        >
          <AppIcon name="nav.collapse" size={20} />
          {collapsed ? null : 'Collapse'}
        </button>
      </div>
      <AdireBand cell={collapsed ? 18 : 24} className="h-12 shrink-0" />
    </aside>
  );
}
