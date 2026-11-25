import { AppIcon } from '~/components/app-icon';
import type { IconKey } from '~/lib/icons';
import { Button } from './button';
import { Select } from './select';

interface TablePaginationProps {
  total: number;
  page: number;
  pageSize: number;
  pageSizes?: readonly number[];
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}

function PageButton({
  label,
  icon,
  disabled,
  onClick,
}: {
  label: string;
  icon: IconKey;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <Button size="icon-sm" aria-label={label} disabled={disabled} onClick={onClick}>
      <AppIcon name={icon} size={16} />
    </Button>
  );
}

export function TablePagination({
  total,
  page,
  pageSize,
  pageSizes = [25, 50, 100],
  onPageChange,
  onPageSizeChange,
}: TablePaginationProps) {
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(total, page * pageSize);
  const first = page <= 1;
  const last = page >= pageCount;

  return (
    <footer className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border-t border-border px-4 py-3 text-small text-text-2">
      <span className="tabular" aria-live="polite">
        Showing {from}-{to} of {total}
      </span>
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
        <label className="flex items-center gap-2">
          Rows per page
          <Select
            size="sm"
            value={pageSize}
            onChange={(event) => onPageSizeChange(Number(event.target.value))}
            className="tabular min-w-20"
          >
            {pageSizes.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </Select>
        </label>
        <span className="tabular">
          Page {page} of {pageCount}
        </span>
        <nav aria-label="Pagination" className="flex items-center gap-1.5">
          <PageButton
            label="First page"
            icon="common.first"
            disabled={first}
            onClick={() => onPageChange(1)}
          />
          <PageButton
            label="Previous page"
            icon="common.prev"
            disabled={first}
            onClick={() => onPageChange(page - 1)}
          />
          <PageButton
            label="Next page"
            icon="common.next"
            disabled={last}
            onClick={() => onPageChange(page + 1)}
          />
          <PageButton
            label="Last page"
            icon="common.last"
            disabled={last}
            onClick={() => onPageChange(pageCount)}
          />
        </nav>
      </div>
    </footer>
  );
}
