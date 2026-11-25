import { Link } from 'react-router';
import { buttonStyles } from '~/components/ui/button';
import { EmptyState } from '~/components/ui/empty-state';
import { paths } from '~/design/screens/lib/paths';

export function NotPermitted({ what }: { what: string }) {
  return (
    <div className="rounded-lg border border-border bg-surface shadow-card">
      <EmptyState
        icon="common.shield_alert"
        title={`Only admins can ${what}`}
        description="Your role doesn't include this. Ask an admin if you need it."
        action={
          <Link to={paths.dashboard} className={buttonStyles({ variant: 'primary' })}>
            Back to overview
          </Link>
        }
      />
    </div>
  );
}
