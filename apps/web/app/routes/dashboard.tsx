import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Outlet,
  isRouteErrorResponse,
  redirect,
  useLocation,
  useNavigate,
  useRouteError,
  useSearchParams,
} from 'react-router';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { CommandPalette, type PaletteItem } from '~/components/command-palette';
import { DemoDrawer } from '~/components/demo-drawer';
import { Sidebar, type SidebarItem } from '~/components/shell/sidebar';
import type { ProviderTestResult } from '~/components/provider-pill';
import { Topbar } from '~/components/shell/topbar';
import { ErrorCard } from '~/components/ui/error-card';
import { paths } from '~/lib/paths';
import { STAFF_SIGN_IN } from '~/lib/staff-sign-in';
import { useMediaQuery } from '~/lib/use-media-query';
import { useTheme } from '~/lib/theme';
import { TYPE_ICONS, TYPE_LABELS } from '~/lib/labels';
import { formatNaira } from '@resolve/shared';
import { shortId } from '~/lib/format';
import {
  fetchMe,
  keys,
  useDisputeSearch,
  useMe,
  useMetrics,
  useProfiles,
  useSetProfile,
  useTestProfile,
} from '~/api/hooks';
import { queryClient } from '~/lib/query-client';
import { ACCESS_LOGOUT_URL, clearToken, getToken } from '~/lib/session';
import { usePermissions } from '~/lib/use-permissions';
import { ApiError } from '@resolve/api-client';

const SIDEBAR_KEY = 'resolve-sidebar-collapsed';

export function noticeFor(error: ApiError) {
  if (error.code === 'suspended') return 'suspended';
  return error.code === 'no_access' ? 'no_access' : 'ended';
}

export async function clientLoader() {
  if (STAFF_SIGN_IN && !getToken()) return redirect(paths.login);
  try {
    await queryClient.fetchQuery({
      queryKey: keys.me,
      queryFn: () => fetchMe(),
      staleTime: 30_000,
    });
  } catch (error) {
    if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
      clearToken();
      queryClient.clear();
      return redirect(`${paths.login}?notice=${noticeFor(error)}`);
    }
    throw error;
  }
  return null;
}

const DEV_ITEMS: SidebarItem[] = import.meta.env.DEV
  ? [
      { id: 'design', label: 'Design system', icon: 'common.sparkle', to: '/design' },
      { id: 'brand', label: 'Brand', icon: 'common.shield_check', to: '/brand' },
    ]
  : [];

function activeIdFor(pathname: string) {
  const rest = pathname.startsWith(paths.dashboard)
    ? pathname.slice(paths.dashboard.length).split('/').filter(Boolean)
    : null;
  if (!rest) return '';
  if (rest.length === 0) return 'overview';
  const section = rest[0] ?? '';
  return ['cases', 'audit', 'team', 'settings'].includes(section) ? section : '';
}

export default function Shell() {
  const location = useLocation();
  const navigate = useNavigate();
  const client = useQueryClient();
  const { toggle } = useTheme();
  const me = useMe();
  const profiles = useProfiles();
  const testProfile = useTestProfile();
  const [providerTest, setProviderTest] = useState<ProviderTestResult | null>(null);
  const metrics = useMetrics();
  const [preferCollapsed, setCollapsed] = useState(false);
  const narrow = useMediaQuery('(max-width: 1279px)');
  const collapsed = narrow || preferCollapsed;
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [paletteQuery, setPaletteQuery] = useState('');
  const [searchParams, setSearchParams] = useSearchParams();
  const setProfile = useSetProfile();
  const found = useDisputeSearch(paletteOpen ? paletteQuery : '');

  useEffect(() => {
    setCollapsed(window.localStorage.getItem(SIDEBAR_KEY) === '1');
  }, []);

  const toggleCollapsed = useCallback(() => {
    setCollapsed((value) => {
      window.localStorage.setItem(SIDEBAR_KEY, value ? '0' : '1');
      return !value;
    });
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setPaletteOpen((open) => !open);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    const error = me.error;
    if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
      clearToken();
      client.clear();
      navigate(`${paths.login}?notice=${noticeFor(error)}`, { replace: true });
    }
  }, [me.error, client, navigate]);

  const handleSignOut = useCallback(() => {
    clearToken();
    client.clear();
    if (STAFF_SIGN_IN) {
      toast('You are signed out.');
      navigate(paths.login);
      return;
    }
    window.location.assign(ACCESS_LOGOUT_URL);
  }, [client, navigate]);

  const awaiting =
    (metrics.data?.countsByStatus.awaiting_review ?? 0) +
    (metrics.data?.countsByStatus.escalated ?? 0);
  const permissions = usePermissions();
  const isAdmin = permissions.can('demo.use');
  const canManageTeam = permissions.can('team.manage');

  const items = useMemo<SidebarItem[]>(
    () => [
      {
        id: 'overview',
        label: 'Overview',
        icon: 'nav.overview',
        to: paths.dashboard,
        group: 'Work',
      },
      {
        id: 'cases',
        label: 'Cases',
        icon: 'nav.cases',
        to: paths.cases,
        count: awaiting,
        group: 'Work',
      },
      { id: 'audit', label: 'Audit', icon: 'nav.audit', to: paths.audit, group: 'Work' },
      ...(canManageTeam
        ? [{ id: 'team', label: 'Team', icon: 'nav.team' as const, to: paths.team, group: 'Admin' }]
        : []),
      {
        id: 'settings',
        label: 'Settings',
        icon: 'nav.settings',
        to: paths.settings,
        group: 'Admin',
      },
    ],
    [awaiting, canManageTeam],
  );

  const footerItems = useMemo<SidebarItem[]>(
    () => [
      ...(isAdmin
        ? [
            {
              id: 'demo',
              label: 'Demo',
              icon: 'nav.demo' as const,
              onSelect: () =>
                setSearchParams(
                  (current) => {
                    const next = new URLSearchParams(current);
                    next.set('demo', '1');
                    return next;
                  },
                  { replace: true },
                ),
            },
          ]
        : []),
      ...DEV_ITEMS,
    ],
    [isAdmin, setSearchParams],
  );

  const paletteItems = useMemo<PaletteItem[]>(
    () => [
      {
        id: 'go-overview',
        label: 'Go to Overview',
        icon: 'nav.overview',
        group: 'Navigation',
        onSelect: () => navigate(paths.dashboard),
      },
      {
        id: 'go-cases',
        label: 'Go to Cases',
        icon: 'nav.cases',
        group: 'Navigation',
        onSelect: () => navigate(paths.cases),
      },
      {
        id: 'go-review',
        label: 'Cases needing review',
        icon: 'common.filter',
        group: 'Navigation',
        onSelect: () => navigate(`${paths.cases}?status=awaiting_review`),
      },
      {
        id: 'go-audit',
        label: 'Go to Audit',
        icon: 'nav.audit',
        group: 'Navigation',
        onSelect: () => navigate(paths.audit),
      },
      ...(canManageTeam
        ? [
            {
              id: 'go-team',
              label: 'Go to Team',
              icon: 'nav.team' as const,
              group: 'Navigation',
              onSelect: () => navigate(paths.team),
            },
          ]
        : []),
      {
        id: 'go-settings',
        label: 'Go to Settings',
        icon: 'nav.settings',
        group: 'Navigation',
        onSelect: () => navigate(paths.settings),
      },
      {
        id: 'theme',
        label: 'Toggle theme',
        icon: 'common.moon',
        group: 'Actions',
        onSelect: toggle,
      },
      ...(isAdmin && profiles.data
        ? profiles.data
            .filter((profile) => !profile.active)
            .map<PaletteItem>((profile) => ({
              id: `profile-${profile.name}`,
              label: `Switch to ${profile.label.toLowerCase()} model`,
              icon: profile.kind === 'onprem' ? 'provider.onprem' : 'provider.hosted',
              group: 'Actions',
              hint: profile.kind === 'hosted' ? 'Asks to confirm' : undefined,
              onSelect: () => {
                if (profile.kind === 'hosted') navigate(paths.settings);
                else
                  setProfile.mutate(profile.name, {
                    onSuccess: () => toast.success('Switched to the on-premise model.'),
                  });
              },
            }))
        : []),
      {
        id: 'sign-out',
        label: 'Sign out',
        icon: 'common.logout',
        group: 'Actions',
        onSelect: handleSignOut,
      },
      ...(found.data?.items ?? []).map<PaletteItem>((item) => ({
        id: `case-${item.id}`,
        label: `${item.customerName} · ${item.classifiedType ? TYPE_LABELS[item.classifiedType] : 'Investigating'} · ${formatNaira(item.amountMinor)} · ${item.reference} ${item.id}`,
        icon: item.classifiedType ? TYPE_ICONS[item.classifiedType] : 'nav.cases',
        group: 'Cases',
        hint: shortId(item.id),
        onSelect: () => navigate(paths.case(item.id)),
      })),
    ],
    [
      navigate,
      toggle,
      handleSignOut,
      isAdmin,
      canManageTeam,
      profiles.data,
      setProfile,
      found.data,
    ],
  );

  const active = profiles.data?.find((profile) => profile.active) ?? null;

  const runProviderTest = () => {
    if (!active) return;
    setProviderTest(null);
    testProfile.mutate(active.name, {
      onSuccess: (result) =>
        setProviderTest({ ok: result.ok, latency: result.latencyMs, error: result.error }),
      onError: (error) =>
        setProviderTest({
          ok: false,
          error:
            error instanceof ApiError
              ? error.message
              : 'Something went wrong on our side. Try again.',
        }),
    });
  };

  return (
    <div className="flex h-app bg-bg text-text">
      <a
        href="#main"
        className="sr-only rounded-md bg-surface px-4 py-2 text-small focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50"
      >
        Skip to content
      </a>
      <Sidebar
        items={items}
        footerItems={footerItems}
        activeId={activeIdFor(location.pathname)}
        collapsed={collapsed}
        onToggle={toggleCollapsed}
        toggleDisabled={narrow}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar
          provider={active ?? { name: 'loading', kind: 'onprem', model: 'loading' }}
          profiles={profiles.data}
          onTestProvider={permissions.can('settings.edit') && active ? runProviderTest : undefined}
          testingProvider={testProfile.isPending}
          providerTest={providerTest}
          user={{
            email: me.data?.email ?? '',
            name: me.data?.name,
            role: me.data?.role ?? 'analyst',
            authMode: me.data?.authMode ?? 'dev',
            signedInAt: me.data?.signedInAt ?? undefined,
          }}
          onSignOut={handleSignOut}
          onSearch={() => setPaletteOpen(true)}
          section={
            [...items, ...footerItems].find((item) => item.id === activeIdFor(location.pathname))
              ?.label
          }
        />
        <main
          id="main"
          tabIndex={-1}
          className="relative min-h-0 flex-1 overflow-y-auto focus:outline-none"
        >
          <div
            aria-hidden="true"
            className="grid-paper grid-fade pointer-events-none absolute inset-x-0 top-0 h-80"
          />
          <div
            key={location.pathname}
            className="relative mx-auto max-w-360 animate-rise px-8 py-8 max-xl:px-6"
          >
            <Outlet />
          </div>
        </main>
      </div>
      <CommandPalette
        open={paletteOpen}
        onOpenChange={(open) => {
          setPaletteOpen(open);
          if (!open) setPaletteQuery('');
        }}
        items={paletteItems}
        query={paletteQuery}
        onQueryChange={setPaletteQuery}
      />
      {isAdmin ? (
        <DemoDrawer
          open={searchParams.get('demo') === '1'}
          onOpenChange={(open) => {
            if (open) return;
            setSearchParams(
              (current) => {
                const next = new URLSearchParams(current);
                next.delete('demo');
                return next;
              },
              { replace: true },
            );
          }}
        />
      ) : null}
    </div>
  );
}

export function ErrorBoundary() {
  const error = useRouteError();
  const notFound = isRouteErrorResponse(error) && error.status === 404;
  return (
    <ErrorCard
      layout="centered"
      title={notFound ? 'Page not found' : 'This page did not load'}
      message={notFound ? "That page doesn't exist." : 'Reload the page, or go back and try again.'}
      code={isRouteErrorResponse(error) ? String(error.status) : undefined}
      onRetry={() => window.location.reload()}
      className="mt-8"
    />
  );
}
