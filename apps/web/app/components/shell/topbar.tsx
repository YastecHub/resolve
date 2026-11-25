import { APP_NAME } from '@resolve/shared';
import { AppIcon } from '~/components/app-icon';
import {
  ProviderPill,
  type ProviderProfile,
  type ProviderTestResult,
} from '~/components/provider-pill';
import { UserMenu, type UserInfo } from './user-menu';
import { Button } from '~/components/ui/button';
import { Kbd } from '~/components/ui/kbd';
import { useTheme } from '~/lib/theme';

interface TopbarProps {
  provider: ProviderProfile;
  profiles?: readonly ProviderProfile[];
  onTestProvider?: () => void;
  testingProvider?: boolean;
  providerTest?: ProviderTestResult | null;
  user: UserInfo;
  onSignOut: () => void;
  onSearch: () => void;
  section?: string;
}

export function Topbar({
  provider,
  profiles,
  onTestProvider,
  testingProvider,
  providerTest,
  user,
  onSignOut,
  onSearch,
  section,
}: TopbarProps) {
  const { resolved, toggle } = useTheme();
  return (
    <header className="flex h-14 shrink-0 items-center gap-4 border-b border-border bg-bg px-6">
      {section ? (
        <p className="eyebrow hidden shrink-0 xl:block">
          {APP_NAME} <span className="text-border-strong">/</span>{' '}
          <span className="text-text">{section}</span>
        </p>
      ) : null}
      <button
        type="button"
        onClick={onSearch}
        className="flex h-9 max-w-md flex-1 items-center gap-2 rounded-full border border-border bg-surface px-4 text-small text-text-3 shadow-sticker transition-colors duration-fast ease-standard hover:border-border-strong"
      >
        <AppIcon name="common.search" size={16} />
        <span className="flex-1 text-left">Search cases, pages and actions…</span>
        <Kbd>⌘</Kbd>
        <Kbd>K</Kbd>
      </button>
      <div className="ml-auto flex items-center gap-3">
        <ProviderPill
          active={provider}
          profiles={profiles}
          onTest={onTestProvider}
          testing={testingProvider}
          testResult={providerTest}
        />
        <Button
          variant="ghost"
          size="icon"
          onClick={toggle}
          aria-label={resolved === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
        >
          <AppIcon name={resolved === 'dark' ? 'common.sun' : 'common.moon'} size={20} />
        </Button>
        <UserMenu user={user} onSignOut={onSignOut} />
      </div>
    </header>
  );
}
