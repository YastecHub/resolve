import { useState } from 'react';
import { redirect, useLoaderData, useNavigate, useSearchParams } from 'react-router';
import { APP_NAME } from '@resolve/shared';
import { fetchMe } from '~/design/screens/data/hooks';
import { ApiError } from '@resolve/api-client';
import { keys } from '~/design/screens/data/hooks';
import { AdireBand } from '~/components/adire';
import { AppIcon } from '~/components/app-icon';
import { BrandTile } from '~/components/brand-mark';
import { Banner } from '~/components/ui/banner';
import { Button } from '~/components/ui/button';
import { Field, Input } from '~/components/ui/field';
import { paths } from '~/lib/paths';
import { STAFF_SIGN_IN } from '~/design/screens/lib/staff-sign-in';
import { queryClient } from '~/lib/query-client';
import { clearDevUser, getDevUser, setDevUser } from '~/design/screens/lib/session';

export function meta() {
  return [{ title: `Sign in · ${APP_NAME}` }];
}

const NOTICES: Record<string, string> = {
  ended: 'Your session ended, or your access changed. Sign in again, or ask an admin.',
  suspended: 'This account is suspended. Ask an admin to restore it.',
  noAccess: "Your account isn't set up for this app. Ask an admin to add you.",
};

interface LoaderData {
  problem: string | null;
}

export async function clientLoader({
  request,
}: {
  request: Request;
}): Promise<LoaderData | Response> {
  const search = new URL(request.url).searchParams;
  const notice = search.get('notice');
  const to = search.get('to');
  const destination = to?.startsWith(paths.dashboard) ? to : paths.dashboard;

  if (STAFF_SIGN_IN) {
    const as = search.get('as');
    if (as) {
      setDevUser(as);
      queryClient.clear();
      return redirect(destination);
    }
    if (getDevUser() && !notice) return redirect(destination);
    return { problem: null };
  }

  try {
    await queryClient.fetchQuery({
      queryKey: keys.me,
      queryFn: () => fetchMe(),
      staleTime: 30_000,
    });
    if (!notice) return redirect(destination);
    return { problem: null };
  } catch (error) {
    if (error instanceof ApiError && error.status === 403) {
      return { problem: error.code === 'suspended' ? 'suspended' : 'no_access' };
    }
    return { problem: null };
  }
}

const TRUST_POINTS = [
  { icon: 'provider.onprem', text: 'Customer data stays inside your infrastructure.' },
  { icon: 'common.shield_check', text: 'Every agent step is recorded and tamper-evident.' },
  { icon: 'common.clock', text: 'Built around the 72-hour resolution window.' },
] as const;

export default function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { problem } = useLoaderData<LoaderData>();
  const noticeKey = searchParams.get('notice') ?? problem;
  const notice = noticeKey ? (NOTICES[noticeKey] ?? NOTICES.ended) : null;
  const [staffId, setStaffId] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const fail = (caught: unknown) => {
    if (caught instanceof ApiError && caught.code === 'no_access') {
      setError(
        "We couldn't find that staff ID. If you should have access, ask an admin to add you.",
      );
      return;
    }
    setError(
      caught instanceof ApiError ? caught.message : 'Something went wrong on our side. Try again.',
    );
  };

  const submitStaff = async () => {
    if (!/^\d{4,8}$/.test(staffId.trim())) {
      setError('Enter your staff ID. It is 4 to 8 digits.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      setDevUser(staffId);
      queryClient.clear();
      const me = await fetchMe();
      queryClient.setQueryData(keys.me, me);
      navigate(paths.dashboard);
    } catch (caught) {
      clearDevUser();
      fail(caught);
      setBusy(false);
    }
  };

  return (
    <div className="relative grid min-h-app grid-cols-1 bg-bg text-text lg:grid-cols-[minmax(0,1fr)_minmax(0,34rem)]">
      <aside className="relative hidden overflow-hidden bg-stage text-stage-text lg:flex lg:flex-col lg:justify-between lg:p-12 lg:pb-36">
        <div className="flex items-center gap-3">
          <BrandTile size={36} />
          <span className="font-display text-h2 font-bold">{APP_NAME}</span>
        </div>
        <div className="relative z-10 flex max-w-xl flex-col gap-10">
          <div className="flex flex-col gap-5">
            <p className="eyebrow text-stage-text-2">Dispute investigation for banks</p>
            <h2 className="font-display text-hero italic">
              Settle disputes with the <span className="text-stage-accent">evidence in view.</span>
            </h2>
            <p className="max-w-md text-body text-stage-text-2">
              An investigator for card and transfer disputes that shows its work, so every decision
              can be checked.
            </p>
          </div>
          <ul className="flex flex-col gap-4">
            {TRUST_POINTS.map((point) => (
              <li key={point.text} className="flex items-center gap-3 text-small text-stage-text-2">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-stage-2 text-stage-accent">
                  <AppIcon name={point.icon} size={16} />
                </span>
                {point.text}
              </li>
            ))}
          </ul>
        </div>
        <p className="relative z-10 text-caption text-stage-text-2">
          For authorised bank staff only. Activity is logged.
        </p>
      </aside>

      <main className="grid-paper flex flex-col justify-center px-6 pt-12 pb-36 sm:px-12">
        <div className="mx-auto flex w-full max-w-sm flex-col gap-8">
          <div className="flex items-center gap-3 lg:hidden">
            <BrandTile size={32} />
            <span className="font-display text-h2 font-bold">{APP_NAME}</span>
          </div>

          <div className="flex flex-col gap-6 rounded-xl border border-border bg-surface p-8 shadow-card">
            <div className="flex flex-col gap-1">
              <h1 className="font-display text-lead">Sign in</h1>
              <p className="text-body text-text-2">
                {STAFF_SIGN_IN
                  ? 'Use your staff ID to sign in.'
                  : 'You sign in through your bank single sign-on. We then check your access here.'}
              </p>
            </div>

            {notice && !error ? <Banner variant="warning">{notice}</Banner> : null}
            {error ? <Banner variant="danger">{error}</Banner> : null}

            {STAFF_SIGN_IN ? (
              <form
                className="flex flex-col gap-5"
                onSubmit={(event) => {
                  event.preventDefault();
                  void submitStaff();
                }}
              >
                <Field label="Staff ID" hint="Printed on your staff card.">
                  {({ id, describedBy }) => (
                    <Input
                      id={id}
                      aria-describedby={describedBy}
                      value={staffId}
                      onChange={(event) =>
                        setStaffId(event.target.value.replace(/\D/g, '').slice(0, 8))
                      }
                      inputMode="numeric"
                      autoComplete="username"
                      autoFocus
                      placeholder="e.g. 100234"
                      className="tabular h-11"
                    />
                  )}
                </Field>
                <Button
                  type="submit"
                  variant="primary"
                  loading={busy}
                  loadingLabel="Checking…"
                  className="h-11"
                >
                  Continue
                </Button>
              </form>
            ) : (
              <Button variant="primary" className="h-11" onClick={() => navigate(paths.dashboard)}>
                <AppIcon name="common.shield_check" size={20} />
                Continue
              </Button>
            )}
          </div>

          {STAFF_SIGN_IN ? (
            <div className="rounded-lg border border-dashed border-border-strong p-4 text-small text-text-2">
              <p className="mb-1 text-caption text-text-3">Seeded staff IDs</p>
              <p>
                Staff IDs in the sample team: <span className="font-mono text-text">100234</span>{' '}
                admin, <span className="font-mono text-text">100871</span> analyst,{' '}
                <span className="font-mono text-text">102007</span> viewer (invited),{' '}
                <span className="font-mono text-text">099310</span> suspended.
              </p>
            </div>
          ) : null}

          <p className="text-caption text-text-3">
            Need access? Ask your administrator. Activity is logged.
          </p>
        </div>
      </main>
      <AdireBand cell={36} className="pointer-events-none absolute inset-x-0 bottom-0 h-24" />
    </div>
  );
}
