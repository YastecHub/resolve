import type { StaffRole } from '@resolve/shared';
import { AppIcon } from '~/components/app-icon';
import { Avatar } from '~/components/ui/avatar';
import { Button } from '~/components/ui/button';
import { Popover } from '~/components/ui/popover';
import { RelativeTime } from '~/components/ui/relative-time';
import { RolePill } from '~/components/ui/role-pill';
import { ROLE_SUMMARIES } from '~/lib/labels';
import { SegmentedControl, type SegmentedOption } from '~/components/ui/segmented-control';
import { useTheme, type ThemePreference } from '~/lib/theme';
import { cn } from '~/lib/cn';

export interface UserInfo {
  name?: string;
  email: string;
  role: StaffRole;
  authMode: 'dev' | 'access';
  signedInAt?: number;
}

const THEME_OPTIONS: readonly SegmentedOption<ThemePreference>[] = [
  { value: 'system', label: 'System', icon: 'common.system' },
  { value: 'light', label: 'Light', icon: 'common.sun' },
  { value: 'dark', label: 'Dark', icon: 'common.moon' },
];

const AUTH_LABELS: Record<UserInfo['authMode'], string> = {
  access: 'Cloudflare Access',
  dev: 'Local dev mode',
};

function displayName(user: UserInfo) {
  if (user.name) return user.name;
  const local = user.email.split('@')[0] ?? user.email;
  return local
    .split(/[._-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

interface PanelProps {
  user: UserInfo;
  preference: ThemePreference;
  onThemeChange: (theme: ThemePreference) => void;
  onSignOut: () => void;
  now?: number;
  className?: string;
}

export function UserMenuPanel({
  user,
  preference,
  onThemeChange,
  onSignOut,
  now,
  className,
}: PanelProps) {
  return (
    <div className={cn('flex flex-col gap-4', className)}>
      <div className="flex items-center gap-3">
        <Avatar name={user.email} className="size-10 text-small" />
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="truncate text-body font-medium text-text">{displayName(user)}</span>
          <span className="truncate text-small text-text-3">{user.email}</span>
        </div>
        <RolePill role={user.role} />
      </div>

      <dl className="grid grid-cols-[6.5rem_1fr] gap-x-3 gap-y-2 rounded-md bg-surface-2 p-3 text-small">
        <dt className="text-text-3">Permissions</dt>
        <dd className="text-text">{ROLE_SUMMARIES[user.role]}</dd>
        <dt className="text-text-3">Signed in with</dt>
        <dd className="text-text">{AUTH_LABELS[user.authMode]}</dd>
        {user.signedInAt ? (
          <>
            <dt className="text-text-3">Signed in</dt>
            <dd className="text-text">
              <RelativeTime at={user.signedInAt} now={now} />
            </dd>
          </>
        ) : null}
      </dl>

      <div className="flex flex-col gap-2">
        <span className="text-caption text-text-2">Theme</span>
        <SegmentedControl
          label="Theme"
          options={THEME_OPTIONS}
          value={preference}
          onChange={onThemeChange}
          className="w-full"
        />
      </div>

      <div className="-mx-4 -mb-4 border-t border-border p-2">
        <Button variant="ghost" className="w-full justify-start gap-3" onClick={onSignOut}>
          <AppIcon name="common.logout" size={20} />
          Sign out
        </Button>
      </div>
    </div>
  );
}

interface UserMenuProps {
  user: UserInfo;
  onSignOut: () => void;
}

export function UserMenu({ user, onSignOut }: UserMenuProps) {
  const { preference, setPreference } = useTheme();
  return (
    <Popover
      align="end"
      className="w-88"
      trigger={
        <button
          type="button"
          aria-label={`Account menu for ${user.email}`}
          className="rounded-full transition-opacity duration-fast ease-standard hover:opacity-80"
        >
          <Avatar name={user.email} />
        </button>
      }
    >
      <UserMenuPanel
        user={user}
        preference={preference}
        onThemeChange={setPreference}
        onSignOut={onSignOut}
      />
    </Popover>
  );
}
