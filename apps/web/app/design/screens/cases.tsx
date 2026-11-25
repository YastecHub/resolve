import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { CLASSIFIED_TYPES, type ClassifiedType, type DisputeStatus } from '@resolve/shared';
import { AppIcon } from '~/components/app-icon';
import { CasesTable, type CaseRow, type SortKey } from '~/components/cases-table';
import { Button } from '~/components/ui/button';
import { Checkbox } from '~/components/ui/checkbox';
import { EmptyState } from '~/components/ui/empty-state';
import { ErrorCard } from '~/components/ui/error-card';
import { Input } from '~/components/ui/field';
import { PageHeader } from '~/components/ui/page-header';
import { Popover } from '~/components/ui/popover';
import { Select } from '~/components/ui/select';
import { SegmentedControl } from '~/components/ui/segmented-control';
import { SkeletonTableRows } from '~/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '~/components/ui/tabs';
import { TablePagination } from '~/components/ui/table-pagination';
import { TYPE_LABELS } from '~/lib/labels';
import { paths } from '~/design/screens/lib/paths';
import {
  PAGE_SIZES,
  useCasesParams,
  type CasesParams,
} from '~/design/screens/lib/use-cases-params';
import { useDisputes, useMe, useMetrics } from '~/design/screens/data/hooks';
import type { DisputeListItem } from '~/design/screens/data/types';

export function meta() {
  return [{ title: 'Cases · Resolve' }];
}

interface TabDef {
  value: string;
  label: string;
  statuses: DisputeStatus[];
}

const TABS: TabDef[] = [
  { value: 'all', label: 'All', statuses: [] },
  { value: 'review', label: 'Needs review', statuses: ['awaiting_review', 'escalated'] },
  { value: 'active', label: 'Investigating', statuses: ['queued', 'investigating'] },
  { value: 'done', label: 'Resolved', statuses: ['resolved', 'rejected'] },
  { value: 'failed', label: 'Failed', statuses: ['failed'] },
];

const SORT_OPTIONS = [
  { value: 'priority', label: 'Priority', sort: null, order: 'asc' },
  { value: 'sla', label: 'Most urgent', sort: 'slaDueAt', order: 'asc' },
  { value: 'newest', label: 'Newest first', sort: 'updatedAt', order: 'desc' },
  { value: 'oldest', label: 'Oldest first', sort: 'updatedAt', order: 'asc' },
  { value: 'amount', label: 'Largest amount', sort: 'amountMinor', order: 'desc' },
] as const;

const DENSITY_KEY = 'resolve-density';

function sameSet(a: readonly string[], b: readonly string[]) {
  return a.length === b.length && a.every((value) => b.includes(value));
}

function activeTab(params: CasesParams) {
  return TABS.find((tab) => sameSet(tab.statuses, params.status))?.value ?? 'custom';
}

function sortValue(params: CasesParams) {
  return (
    SORT_OPTIONS.find(
      (option) =>
        option.sort === params.sort && (option.sort === null || option.order === params.order),
    )?.value ?? 'priority'
  );
}

function toRow(item: DisputeListItem): CaseRow {
  return {
    id: item.id,
    customer: item.customerName,
    type: item.classifiedType,
    amountMinor: item.amountMinor,
    confidence: item.confidence,
    status: item.status,
    resolvedBy: item.resolvedBy,
    slaDueAt: item.slaDueAt,
    updatedAt: item.updatedAt,
  };
}

function TypeFilter({
  value,
  onChange,
}: {
  value: ClassifiedType[];
  onChange: (next: ClassifiedType[]) => void;
}) {
  return (
    <Popover
      align="start"
      className="w-64"
      trigger={
        <Button>
          <AppIcon name="common.filter" size={16} />
          {value.length > 0 ? `Type · ${value.length}` : 'Type'}
        </Button>
      }
    >
      <fieldset className="flex flex-col gap-1">
        <legend className="mb-2 text-caption text-text-2">Dispute type</legend>
        {CLASSIFIED_TYPES.map((type) => (
          <label
            key={type}
            className="flex h-9 items-center gap-3 rounded-md px-2 text-small hover:bg-surface-2"
          >
            <Checkbox
              checked={value.includes(type)}
              onChange={(event) =>
                onChange(
                  event.target.checked ? [...value, type] : value.filter((item) => item !== type),
                )
              }
            />
            {TYPE_LABELS[type]}
          </label>
        ))}
        {value.length > 0 ? (
          <Button
            size="sm"
            variant="ghost"
            className="mt-2 self-start"
            onClick={() => onChange([])}
          >
            Clear
          </Button>
        ) : null}
      </fieldset>
    </Popover>
  );
}

export default function Cases() {
  const navigate = useNavigate();
  const { params, update, query, filtered } = useCasesParams();
  const disputes = useDisputes(query);
  const metrics = useMetrics();
  const me = useMe();
  const [, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState(params.q);
  const [density, setDensity] = useState<'comfortable' | 'compact'>('comfortable');
  const [announcement, setAnnouncement] = useState('');
  const previous = useRef<Map<string, string>>(new Map());
  const now = Date.now();

  useEffect(() => {
    const stored = window.localStorage.getItem(DENSITY_KEY);
    if (stored === 'compact' || stored === 'comfortable') setDensity(stored);
  }, []);

  useEffect(() => {
    setSearch(params.q);
  }, [params.q]);

  useEffect(() => {
    if (search === params.q) return;
    const timer = window.setTimeout(() => update({ q: search }), 250);
    return () => window.clearTimeout(timer);
  }, [search, params.q, update]);

  useEffect(() => {
    const items = disputes.data?.items;
    if (!items) return;
    const next = new Map(items.map((item) => [item.id, `${item.status}:${item.updatedAt}`]));
    let changed = 0;
    for (const [id, signature] of next) {
      const before = previous.current.get(id);
      if (before !== undefined && before !== signature) changed += 1;
    }
    previous.current = next;
    if (changed > 0) setAnnouncement(`${changed} ${changed === 1 ? 'case' : 'cases'} updated`);
  }, [disputes.data]);

  const counts = metrics.data?.countsByStatus;
  const tabCount = (tab: TabDef) =>
    counts
      ? tab.statuses.length === 0
        ? Object.values(counts).reduce((a, b) => a + b, 0)
        : tab.statuses.reduce((sum, status) => sum + (counts[status] ?? 0), 0)
      : undefined;

  const rows = useMemo(() => disputes.data?.items.map(toRow) ?? [], [disputes.data]);
  const total = disputes.data?.total ?? 0;
  const tab = activeTab(params);

  const changeDensity = (value: 'comfortable' | 'compact') => {
    setDensity(value);
    window.localStorage.setItem(DENSITY_KEY, value);
  };

  const changeSort = (sort: SortKey | null, order: 'asc' | 'desc') => update({ sort, order });

  const clearFilters = () => {
    setSearch('');
    update({ status: [], type: [], q: '' });
  };

  return (
    <>
      <PageHeader
        eyebrow="Cases"
        title="The ones that need you come first."
        subtitle="Every dispute the agent has seen, sorted by what is due."
        actions={
          me.data?.role === 'admin' ? (
            <Button
              onClick={() =>
                setSearchParams(
                  (current) => {
                    const next = new URLSearchParams(current);
                    next.set('demo', '1');
                    return next;
                  },
                  { replace: true },
                )
              }
            >
              Submit demo cases
            </Button>
          ) : null
        }
      />

      <div className="flex flex-col gap-4">
        <Tabs
          value={tab}
          onValueChange={(value) =>
            update({ status: TABS.find((item) => item.value === value)?.statuses ?? [] })
          }
        >
          <TabsList label="Case status">
            {TABS.map((item) => (
              <TabsTrigger key={item.value} value={item.value} count={tabCount(item)}>
                {item.label}
              </TabsTrigger>
            ))}
            {tab === 'custom' ? <TabsTrigger value="custom">Custom</TabsTrigger> : null}
          </TabsList>
        </Tabs>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-full max-w-sm">
            <AppIcon
              name="common.search"
              size={16}
              className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-text-3"
            />
            <Input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search id, reference, customer…"
              aria-label="Search cases"
              className="pl-9"
            />
          </div>
          <TypeFilter value={params.type} onChange={(type) => update({ type })} />
          <label className="flex items-center gap-2 text-small text-text-2">
            Sort
            <Select
              value={sortValue(params)}
              onChange={(event) => {
                const option = SORT_OPTIONS.find((item) => item.value === event.target.value);
                if (option) update({ sort: option.sort, order: option.order });
              }}
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </label>
          <SegmentedControl
            label="Row density"
            className="ml-auto"
            options={[
              { value: 'comfortable', label: 'Comfortable' },
              { value: 'compact', label: 'Compact' },
            ]}
            value={density}
            onChange={changeDensity}
          />
        </div>

        <div role="status" aria-live="polite" className="sr-only">
          {announcement}
        </div>

        {disputes.isLoading ? (
          <div className="rounded-lg border border-border bg-surface shadow-card">
            <SkeletonTableRows rows={8} columns={8} />
          </div>
        ) : disputes.isError ? (
          <ErrorCard
            title="Couldn't load cases"
            layout="centered"
            className="py-16"
            message="Something went wrong on our side. Try again."
            onRetry={() => void disputes.refetch()}
            retrying={disputes.isFetching}
          />
        ) : rows.length === 0 ? (
          <div className="rounded-lg border border-border bg-surface shadow-card">
            {filtered ? (
              <EmptyState
                icon="common.filter"
                title="Nothing matches those filters"
                description="Try a different status or clear the type filter."
                action={<Button onClick={clearFilters}>Clear filters</Button>}
              />
            ) : (
              <EmptyState
                icon="nav.cases"
                title="No cases yet"
                description="Submit a dispute to watch the agent work."
              />
            )}
          </div>
        ) : (
          <CasesTable
            rows={rows}
            density={density}
            now={now}
            sort={params.sort as SortKey | null}
            order={params.order}
            onSortChange={changeSort}
            onOpen={(id) => navigate(paths.case(id))}
            busy={disputes.isFetching && disputes.isPlaceholderData}
            footer={
              <TablePagination
                total={total}
                page={params.page}
                pageSize={params.pageSize}
                pageSizes={PAGE_SIZES}
                onPageChange={(page) => update({ page }, { resetPage: false })}
                onPageSizeChange={(pageSize) => update({ pageSize })}
              />
            }
          />
        )}
      </div>
    </>
  );
}
