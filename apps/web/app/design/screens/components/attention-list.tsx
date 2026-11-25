import { Link } from 'react-router';
import { paths } from '~/design/screens/lib/paths';
import { Money } from '~/components/ui/money';
import { SlaRing } from '~/components/ui/sla-ring';
import { StatusPill } from '~/components/ui/status-pill';
import { TypeBadge } from '~/components/ui/type-badge';
import { CopyableId } from '~/components/ui/copyable-id';
import type { DisputeListItem } from '~/design/screens/data/types';

export function AttentionList({ items, now }: { items: readonly DisputeListItem[]; now: number }) {
  return (
    <ul className="flex flex-col divide-y divide-border">
      {items.map((item) => (
        <li key={item.id}>
          <Link
            to={paths.case(item.id)}
            className="flex flex-col gap-2 px-5 py-3 transition-colors duration-fast ease-standard hover:bg-surface-2"
          >
            <div className="flex items-center justify-between gap-3">
              <span className="text-small text-text">{item.customerName}</span>
              <Money minor={item.amountMinor} className="text-small text-text" />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {item.classifiedType ? <TypeBadge type={item.classifiedType} /> : null}
              <StatusPill status={item.status} />
            </div>
            <div className="flex items-center justify-between gap-3 text-text-3">
              <CopyableId id={item.id} />
              <SlaRing dueAt={item.slaDueAt} now={now} />
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
