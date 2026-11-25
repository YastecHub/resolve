import { AppLoading } from '~/components/app-loading';
import { Button } from '~/components/ui/button';
import { EmptyState } from '~/components/ui/empty-state';
import { ErrorCard } from '~/components/ui/error-card';
import { Skeleton, SkeletonCard, SkeletonTableRows, SkeletonText } from '~/components/ui/skeleton';
import { DesignSection, Specimen } from './specimen';

export function Feedback() {
  return (
    <DesignSection
      id="feedback"
      title="Loading, empty and error"
      description="Every screen ships all three. Page-level loads use skeletons, never spinners."
    >
      <Specimen
        title="Skeletons"
        description="Shapes mirror the final layout; slow shimmer."
        bodyClassName="grid w-full grid-cols-1 gap-4 lg:grid-cols-2"
      >
        <SkeletonCard />
        <div className="flex flex-col gap-4 rounded-lg border border-border bg-surface p-5">
          <Skeleton className="h-4 w-32" />
          <SkeletonText lines={4} />
        </div>
      </Specimen>
      <Specimen title="Table skeleton" bodyClassName="w-full">
        <div className="w-full rounded-lg border border-border bg-surface">
          <SkeletonTableRows rows={4} />
        </div>
      </Specimen>
      <Specimen
        title="App loading"
        description="Shown on a fresh load or reload, before the app is ready. Pure CSS so it works before any script runs. Appears after 150 ms so fast loads never flash it."
        bodyClassName="grid w-full grid-cols-1 gap-4 lg:grid-cols-2"
      >
        <AppLoading fullscreen={false} className="border border-border" />
        <AppLoading fullscreen={false} message="Reconnecting" className="border border-border" />
      </Specimen>
      <Specimen title="EmptyState" bodyClassName="grid w-full grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-lg border border-border bg-surface">
          <EmptyState
            icon="nav.cases"
            title="No cases yet"
            description="Submit a dispute to watch the agent work."
            action={<Button variant="primary">Submit demo cases</Button>}
          />
        </div>
        <div className="rounded-lg border border-border bg-surface">
          <EmptyState
            icon="common.filter"
            title="Nothing matches those filters"
            description="Try a different status or clear the type filter."
            action={<Button>Clear filters</Button>}
          />
        </div>
      </Specimen>
      <Specimen
        title="ErrorCard"
        description="Neutral card with a danger badge. Details holds the code and request ID for support."
        bodyClassName="grid w-full grid-cols-1 gap-4 lg:grid-cols-2"
      >
        <ErrorCard
          title="Couldn't load cases"
          message="Something went wrong on our side. Try again."
          code="internal_error"
          requestId="req_01J8K2M4Q7X9V3N5R6T8"
          occurredAt="12 Oct 2026, 14:02"
          onRetry={() => undefined}
        />
        <ErrorCard
          title="Couldn't reach the model"
          message="The on-premise model did not respond. Check the connection in Settings."
          code="provider_unreachable"
          onRetry={() => undefined}
          retrying
          action={<Button size="sm">Open settings</Button>}
        />
        <ErrorCard
          title="Couldn't save your changes"
          message="Something went wrong on our side. Try again."
        />
      </Specimen>
      <Specimen
        title="ErrorCard, page level"
        description="Used by route error boundaries."
        bodyClassName="w-full"
      >
        <ErrorCard
          layout="centered"
          title="This page didn't load"
          message="Reload the page, or go back and try again. If it keeps happening, share the details below with support."
          code="route_error"
          requestId="req_01J8K2M4Q7X9V3N5R6T8"
          occurredAt="12 Oct 2026, 14:02"
          onRetry={() => undefined}
          className="w-full"
        />
      </Specimen>
    </DesignSection>
  );
}
