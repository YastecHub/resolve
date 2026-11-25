import { formatAbsolute, relativeTime } from '~/lib/format';

interface RelativeTimeProps {
  at: number;
  now?: number;
  className?: string;
}

export function RelativeTime({ at, now, className }: RelativeTimeProps) {
  return (
    <time
      dateTime={new Date(at).toISOString()}
      title={formatAbsolute(at)}
      className={className ?? 'whitespace-nowrap'}
    >
      {relativeTime(at, now)}
    </time>
  );
}
