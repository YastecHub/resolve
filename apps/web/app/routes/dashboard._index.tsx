import { useMemo } from 'react';
import { Link } from 'react-router';
import { SLA_HOURS } from '@resolve/shared';
import { AreaChart } from '~/components/charts/area-chart';
import { ProgressBar } from '~/components/charts/progress-bar';
import { Sparkline } from '~/components/charts/sparkline';
import { StackedBars, type StackRow, type StackSegment } from '~/components/charts/stacked-bars';
import { AttentionList } from '~/components/attention-list';
import { Banner } from '~/components/ui/banner';
import { buttonStyles } from '~/components/ui/button';
import { EmptyState } from '~/components/ui/empty-state';
import { ErrorCard } from '~/components/ui/error-card';
import { KpiCard } from '~/components/ui/kpi-card';
import { PageHeader } from '~/components/ui/page-header';
import { SectionCard } from '~/components/ui/section-card';
import { SkeletonCard, SkeletonKpiCard } from '~/components/ui/skeleton';
import { formatSpan, greeting } from '~/lib/format';
import { paths } from '~/lib/paths';
import { TYPE_LABELS } from '~/lib/labels';
import { useDisputes, useMetrics } from '~/api/hooks';

export function meta() {
  return [{ title: 'Overview · Resolve' }];
}

const SEGMENTS: readonly StackSegment[] = [
  { key: 'auto', label: 'Auto-resolved', tone: 'success' },
  { key: 'analyst', label: 'Resolved by analyst', tone: 'info' },
  { key: 'review', label: 'Needs review', tone: 'warning' },
  { key: 'escalated', label: 'Escalated', tone: 'plum' },
  { key: 'rejected', label: 'Rejected', tone: 'neutral' },
  { key: 'failed', label: 'Failed', tone: 'danger' },
];

function Loading() {
  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SkeletonKpiCard />
        <SkeletonKpiCard />
        <SkeletonKpiCard />
        <SkeletonKpiCard />
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_22rem]">
        <div className="flex flex-col gap-6">
          <SkeletonCard className="h-72" />
          <SkeletonCard className="h-64" />
        </div>
        <SkeletonCard className="h-96" />
      </div>
    </div>
  );
}

export default function Overview() {
  const metrics = useMetrics();
  const attention = useDisputes({
    status: ['awaiting_review', 'escalated'],
    sort: 'slaDueAt',
    order: 'asc',
    pageSize: 5,
  });
  const now = Date.now();

  const throughput = useMemo(() => {
    const hour = new Date().getHours();
    return (metrics.data?.throughputByHour ?? []).map((entry, index) => ({
      label: `${String((hour - (23 - index) + 24) % 24).padStart(2, '0')}:00`,
      value: entry.count,
    }));
  }, [metrics.data]);

  const rows = useMemo<StackRow[]>(
    () =>
      (metrics.data?.outcomesByType ?? []).map((entry) => ({
        label: TYPE_LABELS[entry.type],
        values: entry.values,
      })),
    [metrics.data],
  );

  if (metrics.isLoading || attention.isLoading) {
    return (
      <>
        <PageHeader eyebrow="Overview" title={`${greeting()}.`} lead />
        <Loading />
      </>
    );
  }

  if (metrics.isError || !metrics.data) {
    return (
      <>
        <PageHeader eyebrow="Overview" title="We couldn't load your day." lead />
        <ErrorCard
          title="Couldn't load the overview"
          message="Something went wrong on our side. Try again."
          code={metrics.error instanceof Error ? metrics.error.name : undefined}
          onRetry={() => void metrics.refetch()}
          retrying={metrics.isFetching}
        />
      </>
    );
  }

  const m = metrics.data;
  const waiting = (m.countsByStatus.awaiting_review ?? 0) + (m.countsByStatus.escalated ?? 0);
  const total = Object.values(m.countsByStatus).reduce((sum, value) => sum + value, 0);
  const slaTotal = m.sla.atRisk + m.sla.breached;
  const headline =
    waiting === 0
      ? 'All clear. Nothing is waiting on you.'
      : `${waiting} ${waiting === 1 ? 'case is' : 'cases are'} waiting on you.`;
  const subtitle = `${greeting()}. Here is the last 24 hours.`;

  if (total === 0) {
    return (
      <>
        <PageHeader eyebrow="Overview" title={headline} subtitle={subtitle} lead />
        <div className="rounded-lg border border-border bg-surface">
          <EmptyState
            icon="nav.cases"
            title="No cases yet"
            description="Submit a dispute to watch the agent work."
            action={
              <Link to={`${paths.cases}?demo=1`} className={buttonStyles({ variant: 'primary' })}>
                Submit demo cases
              </Link>
            }
          />
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader eyebrow="Overview · last 24 hours" title={headline} subtitle={subtitle} lead />
      <div className="flex flex-col gap-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard
            label="Median time"
            value={m.p50InvestigationMs / 1000}
            format={(v) => `${v.toFixed(1)} s`}
            context={
              <span className="flex flex-col gap-2">
                <span>vs {SLA_HOURS}h limit</span>
                <ProgressBar
                  value={m.p50InvestigationMs / (SLA_HOURS * 3_600_000)}
                  label="Median investigation time against the resolution window"
                />
              </span>
            }
          />
          <KpiCard
            label="Auto-resolved"
            value={m.autoResolutionRate * 100}
            format={(v) => `${Math.round(v)}%`}
            context={`${m.resolvedCount} resolved in total`}
            chart={
              <Sparkline data={throughput.map((p) => p.value)} label="Investigations per hour" />
            }
          />
          <KpiCard
            label="Awaiting review"
            value={waiting}
            context={
              m.oldestReviewAt ? `Oldest ${formatSpan(now - m.oldestReviewAt)}` : 'Nothing waiting'
            }
            to={`${paths.cases}?status=awaiting_review&status=escalated`}
          />
          <KpiCard
            label="SLA at risk"
            value={slaTotal}
            context={
              m.sla.breached > 0
                ? `${m.sla.breached} overdue`
                : slaTotal > 0
                  ? 'Due within 12h'
                  : 'Nothing close to the limit'
            }
            to={`${paths.cases}?sort=sla_due_at&order=asc`}
          />
        </div>

        <Banner variant="info">
          CBN resolution window: {SLA_HOURS}h for failed PoS and web disputes. The ring beside each
          case counts it down.
        </Banner>

        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[1fr_22rem]">
          <div className="flex min-w-0 flex-col gap-6">
            <SectionCard title="Throughput" description="Investigations per hour, last 24 hours">
              <AreaChart data={throughput} label="Investigations per hour over the last 24 hours" />
            </SectionCard>
            <SectionCard title="Outcomes by type" description="How each kind of dispute ended up">
              {rows.length > 0 ? (
                <StackedBars segments={SEGMENTS} rows={rows} />
              ) : (
                <EmptyState
                  icon="common.filter"
                  title="Nothing finished yet"
                  description="Outcomes appear as investigations complete."
                />
              )}
            </SectionCard>
          </div>
          <SectionCard
            title="Needs your attention"
            description={waiting > 5 ? `Showing 5 of ${waiting}` : undefined}
            action={
              <Link
                to={`${paths.cases}?status=awaiting_review&status=escalated`}
                className="rounded-sm text-small text-accent-text underline underline-offset-4"
              >
                View all
              </Link>
            }
            className="overflow-hidden [&>div]:p-0"
          >
            {attention.isError ? (
              <div className="p-5">
                <ErrorCard
                  title="Couldn't load cases"
                  onRetry={() => void attention.refetch()}
                  retrying={attention.isFetching}
                />
              </div>
            ) : attention.data && attention.data.items.length > 0 ? (
              <AttentionList items={attention.data.items} now={now} />
            ) : (
              <EmptyState
                icon="common.shield_check"
                title="All clear"
                description="Nothing is waiting on you."
              />
            )}
          </SectionCard>
        </div>
      </div>
    </>
  );
}
