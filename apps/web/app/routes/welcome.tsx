import { isApiError, useGetHealth, type HealthReportDto } from '@resolve/api-client';
import { Link } from 'react-router';
import { paths } from '~/lib/paths';
import { AdireBand } from '~/components/adire';
import { BrandTile, Wordmark } from '~/components/brand-mark';
import { Button } from '~/components/ui/button';
import { cn } from '~/lib/cn';

type CheckResult = HealthReportDto['checks']['api'];

const CHECK_LABELS: Record<string, string> = {
  api: 'API',
  database: 'PostgreSQL',
  redis: 'Redis',
};

const POLL_MS = 5_000;

function isHealthReport(value: unknown): value is HealthReportDto {
  return typeof value === 'object' && value !== null && 'checks' in value && 'status' in value;
}

export function meta() {
  return [{ title: 'Status · resolve' }];
}

function formatUptime(seconds: number) {
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ${minutes % 60}m`;
}

function Dot({ tone }: { tone: 'up' | 'down' | 'idle' }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'inline-block size-2.5 rounded-full',
        tone === 'up' && 'bg-success',
        tone === 'down' && 'bg-danger',
        tone === 'idle' && 'animate-pulse-dot bg-text-3',
      )}
    />
  );
}

function StatusCard() {
  const health = useGetHealth({ query: { refetchInterval: POLL_MS, retry: false } });

  const degradedReport =
    isApiError(health.error) && isHealthReport(health.error.details)
      ? health.error.details
      : undefined;
  const report = health.data?.data ?? degradedReport;
  const unreachable = health.isError && !report;
  const headline = health.isPending
    ? 'Checking the API'
    : unreachable
      ? 'API unreachable'
      : report?.status === 'ok'
        ? 'All systems operational'
        : 'Running with problems';
  const tone = health.isPending ? 'idle' : report?.status === 'ok' ? 'up' : 'down';

  const rows = report
    ? Object.entries(report.checks)
    : (['api', 'database', 'redis'].map((key) => [key, undefined]) as [
        string,
        CheckResult | undefined,
      ][]);

  return (
    <section
      aria-labelledby="status-title"
      className="w-full max-w-md rounded-lg border border-border bg-surface p-5 shadow-card"
    >
      <div className="flex items-center justify-between gap-4">
        <p className="eyebrow">Service status</p>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => health.refetch()}
          disabled={health.isFetching}
        >
          {health.isFetching ? 'Checking…' : 'Check now'}
        </Button>
      </div>
      <h2 id="status-title" className="mt-2 flex items-center gap-2.5 text-h2" aria-live="polite">
        <Dot tone={tone} />
        {headline}
      </h2>
      {unreachable ? <p className="mt-1 text-small text-text-2">{health.error.message}</p> : null}

      <ul className="mt-4 divide-y divide-border border-y border-border">
        {rows.map(([key, check]) => {
          const rowTone = unreachable ? 'down' : check ? check.status : 'idle';
          return (
            <li key={key} className="flex items-center justify-between gap-4 py-2.5">
              <span className="flex items-center gap-2.5 text-body">
                <Dot tone={rowTone} />
                {CHECK_LABELS[key] ?? key}
              </span>
              <span className="tabular text-small text-text-2" title={check?.error}>
                {unreachable
                  ? 'No response'
                  : !check
                    ? '…'
                    : check.status === 'up'
                      ? key === 'api'
                        ? 'Up'
                        : `Up · ${check.latencyMs} ms`
                      : 'Down'}
              </span>
            </li>
          );
        })}
      </ul>

      <dl className="mt-3 grid grid-cols-3 gap-2 text-caption text-text-3">
        <div>
          <dt>Version</dt>
          <dd className="tabular font-mono text-text-2">{report?.version ?? '—'}</dd>
        </div>
        <div>
          <dt>Uptime</dt>
          <dd className="tabular text-text-2">
            {report ? formatUptime(report.uptimeSeconds) : '—'}
          </dd>
        </div>
        <div>
          <dt>Checked</dt>
          <dd className="tabular text-text-2">
            {health.dataUpdatedAt || health.errorUpdatedAt
              ? new Date(Math.max(health.dataUpdatedAt, health.errorUpdatedAt)).toLocaleTimeString()
              : '—'}
          </dd>
        </div>
      </dl>
    </section>
  );
}

export default function Welcome() {
  return (
    <div className="flex min-h-dvh flex-col bg-bg text-text">
      <div className="relative flex-1">
        <div
          className="grid-paper grid-fade pointer-events-none absolute inset-0"
          aria-hidden="true"
        />
        <header className="relative mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <div className="flex items-center gap-3">
            <BrandTile size={36} />
            <Wordmark size={22} lowercase />
          </div>
          <nav className="flex items-center gap-5 text-small text-text-2">
            <Link to="/design" className="underline-offset-4 hover:underline">
              Design system
            </Link>
            <Link to="/design#screens" className="underline-offset-4 hover:underline">
              Screens
            </Link>
            <Link to={paths.login} className="underline-offset-4 hover:underline">
              Sign in
            </Link>
          </nav>
        </header>

        <main className="relative mx-auto grid max-w-6xl gap-10 px-6 pt-10 pb-16 lg:grid-cols-[1fr_auto] lg:items-center lg:pt-20">
          <div className="max-w-xl">
            <p className="eyebrow text-accent-text">Ogun Innovate Hackathon 2026 · Team Phantasm</p>
            <h1 className="mt-3 font-display text-hero text-balance">Welcome to resolve</h1>
            <p className="mt-4 text-lead font-display text-text-2">
              Every disputed naira, settled with proof.
            </p>
            <p className="mt-4 max-w-lg text-body text-text-2">
              An AI agent investigates each disputed transaction, cites the evidence for every
              claim, and lets the bank&rsquo;s own rules decide. Every step is hash-chained, so the
              record proves itself.
            </p>
          </div>
          <StatusCard />
        </main>
      </div>

      <footer className="flex flex-col">
        <p className="mx-auto w-full max-w-6xl px-6 pb-4 text-caption text-text-3">
          Running on Nobus Cloud · Built in Ogun, for Nigeria
        </p>
        <AdireBand className="h-36" cell={48} />
      </footer>
    </div>
  );
}
