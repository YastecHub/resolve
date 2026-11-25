import type { DisputeReasonCode } from '@resolve/shared';
import { Money } from '~/components/ui/money';
import { RiskPill } from '~/components/ui/risk-pill';
import { formatAbsolute } from '~/lib/format';
import { ANALYST_ACTION_LABELS } from '~/lib/labels';
import { cn } from '~/lib/cn';
import type { DisputeDetail } from '~/api/types';

const REASON_LABELS: Record<DisputeReasonCode, string> = {
  unauthorised: 'Unauthorised',
  duplicate: 'Duplicate charge',
  failed_transfer: 'Failed transfer',
  not_delivered: 'Not delivered',
  other: 'Other',
};

const TYPE_LABELS = {
  card_payment: 'Card payment',
  transfer: 'Transfer',
  pos: 'PoS',
  web: 'Web',
} as const;
const CHANNEL_LABELS = {
  mobile: 'Mobile',
  web: 'Web',
  pos: 'PoS',
  atm: 'ATM',
  ussd: 'USSD',
} as const;

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3 border-b border-border px-5 py-4 last:border-b-0">
      <h3 className="text-caption text-text-3">{title}</h3>
      {children}
    </section>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 text-small">
      <dt className="text-text-3">{label}</dt>
      <dd className="text-right text-text">{children}</dd>
    </div>
  );
}

interface TimelineEvent {
  id: string;
  label: string;
  at: number;
  note?: string;
}

function buildTimeline(detail: DisputeDetail): TimelineEvent[] {
  const events: TimelineEvent[] = [
    { id: 'opened', label: 'Dispute opened', at: detail.dispute.createdAt },
  ];
  const inv = detail.investigation;
  if (inv) {
    events.push({ id: 'started', label: 'Investigation started', at: inv.startedAt });
    if (inv.finishedAt) {
      events.push({
        id: 'finished',
        label: inv.status === 'failed' ? 'Investigation failed' : 'Agent made a recommendation',
        at: inv.finishedAt,
      });
    }
  }
  for (const action of detail.analystActions) {
    events.push({
      id: action.id,
      label: `${ANALYST_ACTION_LABELS[action.action]} · ${action.actorEmail.split('@')[0]}`,
      at: action.createdAt,
      note: action.reason ?? undefined,
    });
  }
  return events.sort((a, b) => a.at - b.at);
}

export function SummaryPanel({ detail, className }: { detail: DisputeDetail; className?: string }) {
  const { transaction, customer, dispute } = detail;
  const events = buildTimeline(detail);
  const years = Math.floor(customer.accountAgeDays / 365);
  const months = Math.floor((customer.accountAgeDays % 365) / 30);

  return (
    <div className={cn('rounded-lg border border-border bg-surface shadow-card', className)}>
      <Group title="Transaction">
        <Money minor={transaction.amountMinor} className="text-h1" />
        <dl className="flex flex-col gap-2">
          <Row label="Type">
            {TYPE_LABELS[transaction.type]} · {CHANNEL_LABELS[transaction.channel]}
          </Row>
          <Row label="Reference">
            <span className="font-mono text-code">{transaction.reference}</span>
          </Row>
          <Row label={transaction.merchantName ? 'Merchant' : 'Beneficiary'}>
            {transaction.merchantName ?? transaction.counterpartyName ?? '—'}
          </Row>
          <Row label="City">{transaction.city}</Row>
          <Row label="Made">{formatAbsolute(transaction.createdAt)}</Row>
        </dl>
      </Group>
      <Group title="Customer">
        <dl className="flex flex-col gap-2">
          <Row label="Name">{customer.name}</Row>
          <Row label="Segment">{customer.segment === 'sme' ? 'SME' : 'Retail'}</Row>
          <Row label="Home city">{customer.homeCity}</Row>
          <Row label="Customer for">
            {years > 0 ? `${years} ${years === 1 ? 'year' : 'years'}` : `${months} months`}
          </Row>
          <Row label="Risk profile">
            <RiskPill level={customer.riskProfile} className="h-6" />
          </Row>
        </dl>
      </Group>
      <Group title="Dispute">
        <dl className="flex flex-col gap-2">
          <Row label="Reason">{REASON_LABELS[dispute.reasonCode]}</Row>
        </dl>
      </Group>
      <Group title="Timeline">
        <ol className="flex flex-col">
          {events.map((event, index) => (
            <li key={event.id} className="relative flex gap-3 pb-4 last:pb-0">
              {index < events.length - 1 ? (
                <span
                  aria-hidden="true"
                  className="absolute top-3 bottom-0 left-1 w-px bg-border"
                />
              ) : null}
              <span
                aria-hidden="true"
                className="relative mt-1.5 size-2 shrink-0 rounded-full bg-border-strong"
              />
              <div className="flex min-w-0 flex-col gap-0.5 text-small">
                <span className="text-text">{event.label}</span>
                <span className="text-caption text-text-3">{formatAbsolute(event.at)}</span>
                {event.note ? <span className="text-text-2">{event.note}</span> : null}
              </div>
            </li>
          ))}
        </ol>
      </Group>
    </div>
  );
}
