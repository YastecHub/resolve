import { Link } from 'react-router';
import { AppIcon } from '~/components/app-icon';
import { LIVE_DISPUTE_ID, REVIEW_DISPUTE_ID } from '~/design/screens/data/sample-server';
import { paths } from '~/lib/paths';
import { DesignSection } from './specimen';

interface ScreenTile {
  id: string;
  title: string;
  description: string;
  to: string;
  source: string;
  states: string;
}

const SCREENS: ScreenTile[] = [
  {
    id: 'login',
    title: 'Sign in',
    description: 'Staff ID sign-in with the Adire band. Suspended and expired-session notices.',
    to: paths.login,
    source: 'design/screens/login.tsx',
    states: 'Idle, submitting, wrong ID, suspended, session ended',
  },
  {
    id: 'overview',
    title: 'Overview',
    description: 'KPIs, throughput, outcomes by type and the cases waiting on you.',
    to: paths.dashboard,
    source: 'design/screens/overview.tsx',
    states: 'Loading, all clear, cases waiting, error',
  },
  {
    id: 'cases',
    title: 'Cases queue',
    description: 'Status tabs with counts, search, type filter, sort, density and paging.',
    to: paths.cases,
    source: 'design/screens/cases.tsx',
    states: 'Loading, empty, filtered empty, live rows, error',
  },
  {
    id: 'case-live',
    title: 'Case detail · live investigation',
    description:
      'Funke’s ₦40,000 transfer. The trace streams in, then the agent reverses the debit.',
    to: paths.case(LIVE_DISPUTE_ID),
    source: 'design/screens/case-detail.tsx',
    states: 'Investigating, resolved by agent',
  },
  {
    id: 'case-review',
    title: 'Case detail · needs review',
    description: 'A suspected unauthorised payment with the policy reasons and the action bar.',
    to: paths.case(REVIEW_DISPUTE_ID),
    source: 'design/screens/case-detail.tsx',
    states: 'Needs review, approve, override, escalate, resolved by analyst',
  },
  {
    id: 'audit',
    title: 'Audit trail',
    description: 'Investigations with chain verification, analyst actions and access changes.',
    to: paths.audit,
    source: 'design/screens/audit.tsx',
    states: 'Loading, verified, broken chain, empty',
  },
  {
    id: 'settings',
    title: 'Settings',
    description: 'AI model location with a connection test, and the auto-resolve policy.',
    to: paths.settings,
    source: 'design/screens/settings.tsx',
    states: 'Read-only for non-admins, dirty form, saving, saved',
  },
  {
    id: 'team',
    title: 'Team',
    description: 'Invite staff, change roles, suspend and reinstate, with the access log.',
    to: paths.team,
    source: 'design/screens/team.tsx',
    states: 'Invite, duplicate email, last admin, self change',
  },
];

export function ScreensGallery() {
  return (
    <DesignSection
      id="screens"
      title="Screens"
      description="Every dashboard screen, built from the system and running on sample data. Open a tile to use the live preview. Build the real screen in app/routes from its source; sign in with staff ID 100234."
    >
      <ul className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {SCREENS.map((screen) => (
          <li key={screen.id}>
            <Link
              to={screen.to}
              className="group flex h-full flex-col overflow-hidden rounded-lg border border-border bg-surface shadow-card transition-colors duration-fast ease-standard hover:border-border-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              <div className="aspect-[16/10] overflow-hidden border-b border-border bg-surface-2">
                <img
                  src={`/gallery/screens/${screen.id}.jpg`}
                  alt=""
                  loading="lazy"
                  className="h-full w-full object-cover object-top transition-transform duration-slow ease-standard group-hover:scale-[1.02]"
                />
              </div>
              <div className="flex flex-1 flex-col gap-2 p-4">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-h3">{screen.title}</h3>
                  <AppIcon
                    name="common.chevron"
                    size={16}
                    className="-rotate-90 text-text-3 transition-transform duration-fast group-hover:translate-x-0.5"
                  />
                </div>
                <p className="text-small text-text-2">{screen.description}</p>
                <p className="mt-auto pt-2 text-caption text-text-3">{screen.states}</p>
                <p className="font-mono text-caption text-text-3">app/{screen.source}</p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </DesignSection>
  );
}
