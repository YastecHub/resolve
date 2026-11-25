import { useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import type { ClassifiedType, DisputeStatus, Resolver } from '@resolve/shared';
import { AppIcon } from '~/components/app-icon';
import { ConfidenceMeter } from '~/components/ui/confidence-meter';
import { CopyableId } from '~/components/ui/copyable-id';
import { Money } from '~/components/ui/money';
import { RelativeTime } from '~/components/ui/relative-time';
import { SlaRing } from '~/components/ui/sla-ring';
import { StatusPill } from '~/components/ui/status-pill';
import { TypeBadge } from '~/components/ui/type-badge';
import { cn } from '~/lib/cn';

export interface CaseRow {
  id: string;
  customer: string;
  type?: ClassifiedType | null;
  amountMinor: number;
  confidence?: number | null;
  status: DisputeStatus;
  resolvedBy?: Resolver | null;
  slaDueAt?: number;
  updatedAt: number;
}

export type SortKey = 'amountMinor' | 'confidence' | 'slaDueAt' | 'updatedAt';

interface Header {
  label: string;
  align?: 'right';
  sort?: SortKey;
}

const HEADERS: Header[] = [
  { label: 'ID' },
  { label: 'Customer' },
  { label: 'Type' },
  { label: 'Amount', align: 'right', sort: 'amountMinor' },
  { label: 'Confidence', sort: 'confidence' },
  { label: 'Status' },
  { label: 'SLA', sort: 'slaDueAt' },
  { label: 'Updated', align: 'right', sort: 'updatedAt' },
];

interface CasesTableProps {
  rows: readonly CaseRow[];
  density?: 'comfortable' | 'compact';
  selectedId?: string;
  now: number;
  threshold?: number;
  footer?: ReactNode;
  sort?: SortKey | null;
  order?: 'asc' | 'desc';
  onSortChange?: (sort: SortKey | null, order: 'asc' | 'desc') => void;
  onOpen?: (id: string) => void;
  busy?: boolean;
}

const OPEN = new Set<DisputeStatus>(['resolved', 'rejected']);

const NATURAL_ORDER: Record<SortKey, 'asc' | 'desc'> = {
  amountMinor: 'desc',
  confidence: 'desc',
  slaDueAt: 'asc',
  updatedAt: 'desc',
};

export function CasesTable({
  rows,
  density = 'comfortable',
  selectedId,
  now,
  threshold = 0.9,
  footer,
  sort = null,
  order = 'asc',
  onSortChange,
  onOpen,
  busy = false,
}: CasesTableProps) {
  const rowHeight = density === 'comfortable' ? 'h-16' : 'h-13';
  const [focusIndex, setFocusIndex] = useState(0);
  const bodyRef = useRef<HTMLTableSectionElement>(null);

  useEffect(() => {
    setFocusIndex((index) => Math.min(index, Math.max(0, rows.length - 1)));
  }, [rows.length]);

  const focusRow = (index: number) => {
    const next = Math.max(0, Math.min(rows.length - 1, index));
    setFocusIndex(next);
    bodyRef.current?.querySelectorAll<HTMLElement>('tr[data-row]')[next]?.focus();
  };

  const onRowKeyDown = (event: KeyboardEvent<HTMLTableRowElement>, row: CaseRow, index: number) => {
    if (event.target !== event.currentTarget) return;
    if (event.key === 'ArrowDown' || event.key === 'j') {
      event.preventDefault();
      focusRow(index + 1);
    } else if (event.key === 'ArrowUp' || event.key === 'k') {
      event.preventDefault();
      focusRow(index - 1);
    } else if (event.key === 'Enter') {
      event.preventDefault();
      onOpen?.(row.id);
    }
  };

  const toggleSort = (key: SortKey) => {
    if (!onSortChange) return;
    const natural = NATURAL_ORDER[key];
    if (sort !== key) onSortChange(key, natural);
    else if (order === natural) onSortChange(key, natural === 'asc' ? 'desc' : 'asc');
    else onSortChange(null, 'asc');
  };

  return (
    <div
      className={cn(
        'overflow-hidden rounded-lg border border-border bg-surface shadow-card',
        busy && 'opacity-70 transition-opacity duration-base',
      )}
    >
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-small">
          <thead>
            <tr className="h-10 border-b border-border bg-surface text-caption text-text-3">
              {HEADERS.map((header) => {
                const sorted = header.sort && sort === header.sort;
                return (
                  <th
                    key={header.label}
                    scope="col"
                    aria-sort={
                      sorted
                        ? order === 'asc'
                          ? 'ascending'
                          : 'descending'
                        : header.sort
                          ? 'none'
                          : undefined
                    }
                    className={cn(
                      'px-3 font-medium',
                      header.align === 'right' ? 'text-right' : 'text-left',
                      header.align === 'right' && !header.sort && 'pr-8',
                    )}
                  >
                    {header.sort ? (
                      <button
                        type="button"
                        onClick={() => toggleSort(header.sort!)}
                        className={cn(
                          'group inline-flex items-center gap-1 rounded-sm hover:text-text',
                          sorted && 'text-text',
                        )}
                      >
                        {header.label}
                        <AppIcon
                          name="common.sort"
                          size={16}
                          className={cn(
                            'transition-opacity duration-fast',
                            sorted
                              ? 'opacity-100'
                              : 'opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100',
                          )}
                        />
                      </button>
                    ) : (
                      header.label
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody ref={bodyRef}>
            {rows.map((row, index) => (
              <tr
                key={row.id}
                data-row
                tabIndex={index === focusIndex ? 0 : -1}
                aria-selected={row.id === selectedId}
                onClick={(event) => {
                  if ((event.target as HTMLElement).closest('button, a')) return;
                  onOpen?.(row.id);
                }}
                onFocus={() => setFocusIndex(index)}
                onKeyDown={(event) => onRowKeyDown(event, row, index)}
                className={cn(
                  'group relative border-b border-border transition-colors duration-fast ease-standard last:border-b-0 hover:bg-surface-2 focus-visible:bg-surface-2 focus-visible:shadow-[inset_2px_0_0_var(--accent)] focus-visible:outline-none',
                  onOpen && 'cursor-pointer',
                  rowHeight,
                  row.id === selectedId && 'bg-surface-2 shadow-[inset_2px_0_0_var(--accent)]',
                )}
              >
                <td className="px-3">
                  <CopyableId id={row.id} />
                </td>
                <td className="px-3 whitespace-nowrap text-text">{row.customer}</td>
                <td className="px-3">
                  {row.type ? (
                    <TypeBadge type={row.type} />
                  ) : (
                    <span className="text-text-3">
                      {row.status === 'queued' || row.status === 'investigating'
                        ? 'Classifying…'
                        : '—'}
                    </span>
                  )}
                </td>
                <td className="tabular pr-8 pl-3 text-right text-text">
                  <Money minor={row.amountMinor} />
                </td>
                <td className="px-3">
                  {row.confidence === undefined || row.confidence === null ? (
                    <span className="text-text-3">—</span>
                  ) : (
                    <ConfidenceMeter value={row.confidence} threshold={threshold} />
                  )}
                </td>
                <td className="relative px-3">
                  <StatusPill status={row.status} resolvedBy={row.resolvedBy ?? undefined} />
                  {row.status === 'investigating' ? (
                    <span
                      aria-hidden="true"
                      className="sweep-edge pointer-events-none absolute inset-x-0 bottom-0 h-0.5"
                    />
                  ) : null}
                </td>
                <td className="px-3">
                  {row.slaDueAt === undefined || OPEN.has(row.status) ? (
                    <span className="text-text-3">—</span>
                  ) : (
                    <SlaRing dueAt={row.slaDueAt} now={now} />
                  )}
                </td>
                <td className="pr-8 pl-3 text-right whitespace-nowrap text-text-2">
                  <RelativeTime at={row.updatedAt} now={now} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {footer}
    </div>
  );
}
