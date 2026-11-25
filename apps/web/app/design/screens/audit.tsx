import { useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { toast } from 'sonner';
import { AppIcon } from '~/components/app-icon';
import { Button } from '~/components/ui/button';
import { CopyableId } from '~/components/ui/copyable-id';
import { EmptyState } from '~/components/ui/empty-state';
import { ErrorCard } from '~/components/ui/error-card';
import { PageHeader } from '~/components/ui/page-header';
import { RelativeTime } from '~/components/ui/relative-time';
import { SkeletonTableRows } from '~/components/ui/skeleton';
import { TablePagination } from '~/components/ui/table-pagination';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '~/components/ui/tabs';
import { formatDurationMs, shortId } from '~/lib/format';
import { ANALYST_ACTION_LABELS } from '~/lib/labels';
import { paths } from '~/design/screens/lib/paths';
import { cn } from '~/lib/cn';
import { fetchCaseFile, fetchVerify } from '~/design/screens/data/hooks';
import { useAccessEvents, useAnalystActions, useInvestigations } from '~/design/screens/data/hooks';
import type { AccessAction } from '@resolve/shared';
import { ApiError } from '@resolve/api-client';
import { type VerifyResponse } from '~/design/screens/data/types';

export function meta() {
  return [{ title: 'Audit · Resolve' }];
}

type VerifyState =
  { status: 'loading' } | { status: 'done'; result: VerifyResponse } | { status: 'error' };

function Table({
  children,
  label,
  footer,
}: {
  children: React.ReactNode;
  label: string;
  footer?: React.ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-lg border border-border bg-surface shadow-card">
      <div className="overflow-x-auto">
        <table aria-label={label} className="w-full border-collapse text-small">
          {children}
        </table>
      </div>
      {footer}
    </div>
  );
}

function Th({ children, right }: { children: React.ReactNode; right?: boolean }) {
  return (
    <th
      scope="col"
      className={cn(
        'h-10 px-3 text-caption font-medium text-text-3',
        right ? 'text-right' : 'text-left',
      )}
    >
      {children}
    </th>
  );
}

function CaseLink({ id }: { id: string }) {
  return (
    <Link
      to={paths.case(id)}
      className="rounded-sm font-mono text-code text-accent-text underline-offset-4 hover:underline"
    >
      {shortId(id)}
    </Link>
  );
}

function Integrity({
  disputeId,
  state,
  onVerify,
}: {
  disputeId: string;
  state?: VerifyState;
  onVerify: () => void;
}) {
  if (!state) {
    return (
      <Button size="sm" onClick={onVerify}>
        Verify chain
      </Button>
    );
  }
  if (state.status === 'loading') {
    return (
      <Button size="sm" loading loadingLabel="Verifying…">
        Verify chain
      </Button>
    );
  }
  if (state.status === 'error') {
    return (
      <span className="inline-flex items-center gap-2 text-text-3">
        Couldn't verify
        <Button size="sm" variant="ghost" onClick={onVerify}>
          Try again
        </Button>
      </span>
    );
  }
  const { result } = state;
  return result.valid ? (
    <span role="status" className="inline-flex items-center gap-1.5 whitespace-nowrap text-success">
      <AppIcon name="common.shield_check" size={16} />
      Chain verified, {result.checked} steps
    </span>
  ) : (
    <span role="status" className="inline-flex items-center gap-1.5 whitespace-nowrap text-danger">
      <AppIcon name="common.shield_alert" size={16} />
      Chain broken at step {result.brokenAtSeq}.{' '}
      <Link to={paths.case(disputeId)} className="underline underline-offset-4">
        Open case
      </Link>
    </span>
  );
}

const ACCESS_LABELS: Record<AccessAction, string> = {
  invited: 'Invited',
  role_changed: 'Changed a role',
  suspended: 'Suspended',
  reinstated: 'Reinstated',
  first_sign_in: 'Signed in for the first time',
};

export default function Audit() {
  const [search, setSearch] = useSearchParams();
  const tabParam = search.get('tab');
  const tab = tabParam === 'actions' || tabParam === 'access' ? tabParam : 'investigations';
  const page = Math.max(1, Number(search.get('page')) || 1);
  const rawSize = Number(search.get('pageSize'));
  const pageSize = [25, 50, 100].includes(rawSize) ? rawSize : 25;
  const investigations = useInvestigations(tab === 'investigations' ? page : 1, pageSize);
  const actions = useAnalystActions(tab === 'actions' ? page : 1, pageSize);
  const access = useAccessEvents(tab === 'access' ? page : 1, pageSize);

  const setParams = (patch: Record<string, string | null>) =>
    setSearch(
      (current) => {
        const next = new URLSearchParams(current);
        for (const [key, value] of Object.entries(patch)) {
          if (value === null) next.delete(key);
          else next.set(key, value);
        }
        return next;
      },
      { replace: true },
    );

  const footerFor = (total: number) => (
    <TablePagination
      total={total}
      page={page}
      pageSize={pageSize}
      onPageChange={(next) => setParams({ page: next > 1 ? String(next) : null })}
      onPageSizeChange={(size) =>
        setParams({ pageSize: size === 25 ? null : String(size), page: null })
      }
    />
  );
  const [verify, setVerify] = useState<Record<string, VerifyState>>({});
  const [exporting, setExporting] = useState<string | null>(null);

  const runVerify = async (disputeId: string) => {
    setVerify((current) => ({ ...current, [disputeId]: { status: 'loading' } }));
    try {
      const result = await fetchVerify(disputeId);
      setVerify((current) => ({ ...current, [disputeId]: { status: 'done', result } }));
    } catch {
      setVerify((current) => ({ ...current, [disputeId]: { status: 'error' } }));
    }
  };

  const exportFile = async (disputeId: string) => {
    setExporting(disputeId);
    try {
      const file = await fetchCaseFile(disputeId);
      const url = URL.createObjectURL(
        new Blob([JSON.stringify(file, null, 2)], { type: 'application/json' }),
      );
      const link = document.createElement('a');
      link.href = url;
      link.download = `case-${disputeId}.json`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      toast.error(
        error instanceof ApiError ? error.message : 'Something went wrong on our side. Try again.',
      );
    } finally {
      setExporting(null);
    }
  };

  return (
    <>
      <PageHeader
        eyebrow="Audit trail"
        title="Every step is on the record."
        subtitle="Agent steps and analyst actions are hash-chained, so any change shows."
      />
      <Tabs
        value={tab}
        onValueChange={(value) =>
          setParams({ tab: value === 'investigations' ? null : value, page: null })
        }
      >
        <TabsList label="Audit sections">
          <TabsTrigger value="investigations" count={investigations.data?.total}>
            Investigations
          </TabsTrigger>
          <TabsTrigger value="actions" count={actions.data?.total}>
            Analyst actions
          </TabsTrigger>
          <TabsTrigger value="access" count={access.data?.total}>
            Access changes
          </TabsTrigger>
        </TabsList>

        <TabsContent value="investigations" className="pt-6">
          {investigations.isLoading ? (
            <div className="rounded-lg border border-border bg-surface shadow-card">
              <SkeletonTableRows rows={8} columns={7} />
            </div>
          ) : investigations.isError ? (
            <ErrorCard
              title="Couldn't load investigations"
              layout="centered"
              className="py-16"
              onRetry={() => void investigations.refetch()}
              retrying={investigations.isFetching}
            />
          ) : investigations.data && investigations.data.items.length > 0 ? (
            <Table label="Investigations" footer={footerFor(investigations.data.total)}>
              <thead>
                <tr className="border-b border-border">
                  <Th>Investigation</Th>
                  <Th>Case</Th>
                  <Th>Model</Th>
                  <Th>Location</Th>
                  <Th right>Steps</Th>
                  <Th right>Duration</Th>
                  <Th>Integrity</Th>
                  <Th>
                    <span className="sr-only">Actions</span>
                  </Th>
                </tr>
              </thead>
              <tbody>
                {investigations.data.items.map((row) => (
                  <tr
                    key={row.id}
                    className="h-14 border-b border-border last:border-b-0 hover:bg-surface-2"
                  >
                    <td className="px-3">
                      <CopyableId id={row.id} />
                    </td>
                    <td className="px-3">
                      <CaseLink id={row.disputeId} />
                    </td>
                    <td className="px-3 whitespace-nowrap text-text">{row.model}</td>
                    <td className="px-3 whitespace-nowrap text-text-2">
                      {row.providerKind === 'onprem' ? 'On-premise' : 'Hosted'}
                    </td>
                    <td className="tabular px-3 text-right text-text">{row.stepsCount}</td>
                    <td className="tabular px-3 text-right whitespace-nowrap text-text-2">
                      {row.durationMs === null ? '—' : formatDurationMs(row.durationMs)}
                    </td>
                    <td className="px-3">
                      <Integrity
                        disputeId={row.disputeId}
                        state={verify[row.disputeId]}
                        onVerify={() => void runVerify(row.disputeId)}
                      />
                    </td>
                    <td className="px-3 text-right">
                      <Button
                        size="icon-sm"
                        variant="ghost"
                        aria-label={`Export case file for ${shortId(row.disputeId)}`}
                        loading={exporting === row.disputeId}
                        loadingLabel="Exporting…"
                        onClick={() => void exportFile(row.disputeId)}
                      >
                        <AppIcon name="common.download" size={16} />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          ) : (
            <div className="rounded-lg border border-border bg-surface shadow-card">
              <EmptyState
                icon="nav.audit"
                title="No investigations yet"
                description="Each investigation is recorded here as soon as the agent starts."
              />
            </div>
          )}
        </TabsContent>

        <TabsContent value="actions" className="pt-6">
          {actions.isLoading ? (
            <div className="rounded-lg border border-border bg-surface shadow-card">
              <SkeletonTableRows rows={6} columns={5} />
            </div>
          ) : actions.isError ? (
            <ErrorCard
              title="Couldn't load analyst actions"
              layout="centered"
              className="py-16"
              onRetry={() => void actions.refetch()}
              retrying={actions.isFetching}
            />
          ) : actions.data && actions.data.items.length > 0 ? (
            <Table label="Analyst actions" footer={footerFor(actions.data.total)}>
              <thead>
                <tr className="border-b border-border">
                  <Th>Who</Th>
                  <Th>What</Th>
                  <Th>Case</Th>
                  <Th>Reason</Th>
                  <Th right>When</Th>
                </tr>
              </thead>
              <tbody>
                {actions.data.items.map((row) => (
                  <tr
                    key={row.id}
                    className="h-14 border-b border-border last:border-b-0 hover:bg-surface-2"
                  >
                    <td className="px-3 whitespace-nowrap text-text">{row.actorEmail}</td>
                    <td className="px-3 whitespace-nowrap text-text">
                      {ANALYST_ACTION_LABELS[row.action]}
                    </td>
                    <td className="px-3">
                      <CaseLink id={row.disputeId} />
                    </td>
                    <td
                      className="max-w-md truncate px-3 text-text-2"
                      title={row.reason ?? undefined}
                    >
                      {row.reason ?? '—'}
                    </td>
                    <td className="px-3 text-right whitespace-nowrap text-text-2">
                      <RelativeTime at={row.createdAt} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          ) : (
            <div className="rounded-lg border border-border bg-surface shadow-card">
              <EmptyState
                icon="nav.audit"
                title="No analyst actions yet"
                description="Approvals, overrides and escalations are recorded here."
              />
            </div>
          )}
        </TabsContent>

        <TabsContent value="access" className="pt-6">
          {access.isLoading ? (
            <div className="rounded-lg border border-border bg-surface shadow-card">
              <SkeletonTableRows rows={6} columns={5} />
            </div>
          ) : access.isError ? (
            <ErrorCard
              title="Couldn't load access changes"
              layout="centered"
              className="py-16"
              onRetry={() => void access.refetch()}
              retrying={access.isFetching}
            />
          ) : access.data && access.data.items.length > 0 ? (
            <Table label="Access changes" footer={footerFor(access.data.total)}>
              <thead>
                <tr className="border-b border-border">
                  <Th>Who</Th>
                  <Th>What</Th>
                  <Th>Person</Th>
                  <Th>Detail</Th>
                  <Th right>When</Th>
                </tr>
              </thead>
              <tbody>
                {access.data.items.map((row) => (
                  <tr
                    key={row.id}
                    className="h-14 border-b border-border last:border-b-0 hover:bg-surface-2"
                  >
                    <td className="px-3 whitespace-nowrap text-text">{row.actorEmail}</td>
                    <td className="px-3 whitespace-nowrap text-text">
                      {ACCESS_LABELS[row.action]}
                    </td>
                    <td className="px-3 whitespace-nowrap text-text-2">{row.targetEmail}</td>
                    <td
                      className="max-w-md truncate px-3 text-text-2"
                      title={row.detail ?? undefined}
                    >
                      {row.detail ?? '—'}
                    </td>
                    <td className="px-3 text-right whitespace-nowrap text-text-2">
                      <RelativeTime at={row.createdAt} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          ) : (
            <div className="rounded-lg border border-border bg-surface shadow-card">
              <EmptyState
                icon="nav.team"
                title="No access changes yet"
                description="Invites, role changes and suspensions are recorded here."
              />
            </div>
          )}
        </TabsContent>
      </Tabs>
    </>
  );
}
