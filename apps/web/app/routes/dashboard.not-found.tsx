import { Link } from 'react-router';
import { AdireBand } from '~/components/adire';
import { AppIcon } from '~/components/app-icon';
import { paths } from '~/lib/paths';

export function meta() {
  return [{ title: 'Page not found · Resolve' }];
}

export default function NotFound() {
  return (
    <section className="overflow-hidden rounded-xl bg-stage text-stage-text">
      <div className="flex flex-col gap-5 px-10 pt-14 pb-12">
        <p className="eyebrow text-stage-text-2">Error 404 · page not found</p>
        <h1 className="max-w-2xl font-display text-hero italic">
          This page took a <span className="text-stage-accent">wrong turn.</span>
        </h1>
        <p className="max-w-md text-body text-stage-text-2">
          The link may be old, or the page was moved. Your cases are where you left them.
        </p>
        <Link
          to={paths.dashboard}
          className="inline-flex h-10 w-fit items-center gap-2 rounded-full bg-stage-accent px-5 text-small font-medium text-stage transition-opacity duration-fast ease-standard hover:opacity-90 focus-visible:outline-stage-accent"
        >
          Back to the overview
          <AppIcon name="common.chevron" size={16} className="-rotate-90" />
        </Link>
      </div>
      <AdireBand cell={32} className="h-16" />
    </section>
  );
}
