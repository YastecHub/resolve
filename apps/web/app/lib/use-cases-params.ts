import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router';
import {
  CLASSIFIED_TYPES,
  DISPUTE_STATUSES,
  type ClassifiedType,
  type DisputeStatus,
} from '@resolve/shared';
import type { DisputeQuery } from '~/design/screens/data/types';

const SORTS = ['createdAt', 'updatedAt', 'slaDueAt', 'amountMinor', 'confidence'] as const;
type Sort = (typeof SORTS)[number];

export const PAGE_SIZES = [25, 50, 100] as const;

export interface CasesParams {
  status: DisputeStatus[];
  type: ClassifiedType[];
  q: string;
  sort: Sort | null;
  order: 'asc' | 'desc';
  page: number;
  pageSize: number;
}

export function useCasesParams() {
  const [search, setSearch] = useSearchParams();

  const params = useMemo<CasesParams>(() => {
    const status = search
      .getAll('status')
      .filter((value): value is DisputeStatus =>
        (DISPUTE_STATUSES as readonly string[]).includes(value),
      );
    const type = search
      .getAll('type')
      .filter((value): value is ClassifiedType =>
        (CLASSIFIED_TYPES as readonly string[]).includes(value),
      );
    const sortParam = search.get('sort');
    const sort = (SORTS as readonly string[]).includes(sortParam ?? '')
      ? (sortParam as Sort)
      : null;
    const page = Math.max(1, Number(search.get('page')) || 1);
    const size = Number(search.get('pageSize'));
    return {
      status,
      type,
      q: search.get('q') ?? '',
      sort,
      order: search.get('order') === 'desc' ? 'desc' : 'asc',
      page,
      pageSize: (PAGE_SIZES as readonly number[]).includes(size) ? size : PAGE_SIZES[0],
    };
  }, [search]);

  const update = useCallback(
    (patch: Partial<CasesParams>, options: { resetPage?: boolean } = { resetPage: true }) => {
      setSearch(
        (current) => {
          const next = new URLSearchParams(current);
          const set = (key: string, values: string[] | string | number | null) => {
            next.delete(key);
            if (values === null || values === '' || (Array.isArray(values) && values.length === 0))
              return;
            for (const value of Array.isArray(values) ? values : [values])
              next.append(key, String(value));
          };
          if ('status' in patch) set('status', patch.status ?? []);
          if ('type' in patch) set('type', patch.type ?? []);
          if ('q' in patch) set('q', patch.q ?? '');
          if ('sort' in patch) set('sort', patch.sort ?? null);
          if ('order' in patch) set('order', patch.sort === null ? null : (patch.order ?? 'asc'));
          if ('pageSize' in patch)
            set('pageSize', patch.pageSize === PAGE_SIZES[0] ? null : (patch.pageSize ?? null));
          if ('page' in patch) set('page', patch.page && patch.page > 1 ? patch.page : null);
          else if (options.resetPage) next.delete('page');
          return next;
        },
        { replace: true },
      );
    },
    [setSearch],
  );

  const query = useMemo<DisputeQuery>(
    () => ({
      status: params.status.length ? params.status : undefined,
      type: params.type.length ? params.type : undefined,
      q: params.q || undefined,
      sort: params.sort ?? 'priority',
      order: params.order,
      page: params.page,
      pageSize: params.pageSize,
    }),
    [params],
  );

  const filtered = params.status.length > 0 || params.type.length > 0 || params.q !== '';

  return { params, update, query, filtered };
}
