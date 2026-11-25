import { EmptyState } from '~/components/ui/empty-state';

export function meta() {
  return [{ title: 'Overview · Resolve' }];
}

export default function Overview() {
  return (
    <EmptyState
      title="Overview is next"
      description="You are signed in. The overview, cases queue and case detail are built one screen at a time."
    />
  );
}
