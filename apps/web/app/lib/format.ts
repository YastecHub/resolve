const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

export function shortId(id: string): string {
  const underscore = id.indexOf('_');
  const prefix = underscore === -1 ? '' : id.slice(0, underscore + 1);
  return `${prefix}…${id.slice(-4).toUpperCase()}`;
}

export function relativeTime(at: number, now: number = Date.now()): string {
  const delta = now - at;
  const abs = Math.abs(delta);
  if (abs < 45_000) return 'just now';
  const unit =
    abs < HOUR
      ? `${Math.round(abs / MINUTE)}m`
      : abs < DAY
        ? `${Math.round(abs / HOUR)}h`
        : `${Math.round(abs / DAY)}d`;
  return delta >= 0 ? `${unit} ago` : `in ${unit}`;
}

const absoluteFormat = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});

export function formatAbsolute(at: number): string {
  return absoluteFormat.format(at).replace(' at ', ', ');
}

export function formatDurationMs(ms: number): string {
  return ms < 1000 ? `${Math.round(ms)} ms` : `${(ms / 1000).toFixed(1)} s`;
}

export function formatPercent(value: number): string {
  return `${Math.round(value * 100)}%`;
}

export function formatSpan(ms: number): string {
  const abs = Math.abs(ms);
  if (abs < MINUTE) return 'under a minute';
  if (abs < HOUR) return `${Math.round(abs / MINUTE)}m`;
  if (abs < DAY) return `${Math.round(abs / HOUR)}h`;
  return `${Math.round(abs / DAY)}d`;
}

export function greeting(now: Date = new Date()): string {
  const hour = now.getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}
