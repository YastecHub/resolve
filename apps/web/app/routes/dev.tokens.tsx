import { cn } from '~/lib/cn';
import { useTheme, type ThemePreference } from '~/lib/theme';

const SURFACES = ['bg', 'surface', 'surface-2', 'surface-3'] as const;
const BORDERS = ['border', 'border-strong'] as const;
const TEXTS = ['text', 'text-2', 'text-3'] as const;
const ACCENTS = ['accent', 'accent-soft', 'accent-text'] as const;
const STATUSES = ['success', 'warning', 'danger', 'info'] as const;

const SWATCH_BG: Record<string, string> = {
  bg: 'bg-bg',
  surface: 'bg-surface',
  'surface-2': 'bg-surface-2',
  'surface-3': 'bg-surface-3',
  border: 'bg-border',
  'border-strong': 'bg-border-strong',
  text: 'bg-text',
  'text-2': 'bg-text-2',
  'text-3': 'bg-text-3',
  accent: 'bg-accent',
  'accent-soft': 'bg-accent-soft',
  'accent-text': 'bg-accent-text',
  success: 'bg-success',
  'success-soft': 'bg-success-soft',
  warning: 'bg-warning',
  'warning-soft': 'bg-warning-soft',
  danger: 'bg-danger',
  'danger-soft': 'bg-danger-soft',
  info: 'bg-info',
  'info-soft': 'bg-info-soft',
};

const TYPE_SCALE = [
  { name: 'Display', cls: 'text-display', sample: 'Resolve disputes in minutes' },
  { name: 'KPI', cls: 'text-kpi tabular', sample: '₦12,500.00' },
  { name: 'H1', cls: 'text-h1', sample: 'Cases awaiting review' },
  { name: 'H2', cls: 'text-h2', sample: 'Agent reasoning' },
  { name: 'H3', cls: 'text-h3', sample: 'Decision' },
  { name: 'Body', cls: 'text-body', sample: 'The debit has no matching credit in the ledger.' },
  { name: 'Small', cls: 'text-small', sample: 'Settlement failed 41 minutes ago' },
  { name: 'Caption', cls: 'text-caption', sample: 'CONFIDENCE' },
  { name: 'Mono', cls: 'text-code font-mono', sample: 'stp_01J9ZK3Q7M2V8X4N6R5T1W0YBA' },
] as const;

const RADII = [
  { name: 'sm · 6', cls: 'rounded-sm' },
  { name: 'md · 10', cls: 'rounded-md' },
  { name: 'lg · 14', cls: 'rounded-lg' },
  { name: 'xl · 20', cls: 'rounded-xl' },
  { name: 'full', cls: 'rounded-full' },
] as const;

const SPACING = [
  { name: '4', cls: 'w-1' },
  { name: '8', cls: 'w-2' },
  { name: '12', cls: 'w-3' },
  { name: '16', cls: 'w-4' },
  { name: '20', cls: 'w-5' },
  { name: '24', cls: 'w-6' },
  { name: '32', cls: 'w-8' },
  { name: '40', cls: 'w-10' },
  { name: '56', cls: 'w-14' },
  { name: '80', cls: 'w-20' },
] as const;

const THEME_OPTIONS: ThemePreference[] = ['system', 'light', 'dark'];

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-h2">{title}</h2>
      {children}
    </section>
  );
}

function Swatch({ token }: { token: string }) {
  return (
    <div className="flex flex-col gap-2">
      <div className={cn('h-14 rounded-md border border-border', SWATCH_BG[token])} />
      <code className="text-text-2">--{token}</code>
    </div>
  );
}

function SwatchGrid({ tokens }: { tokens: readonly string[] }) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {tokens.map((token) => (
        <Swatch key={token} token={token} />
      ))}
    </div>
  );
}

export default function TokenShowcase() {
  const { preference, resolved, setPreference } = useTheme();

  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-10 px-6 py-10">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-h1">Design tokens</h1>
          <p className="text-text-2">Rendering in {resolved} mode.</p>
        </div>
        <div
          role="radiogroup"
          aria-label="Theme"
          className="flex rounded-md border border-border bg-surface p-1"
        >
          {THEME_OPTIONS.map((option) => (
            <button
              key={option}
              type="button"
              role="radio"
              aria-checked={preference === option}
              onClick={() => setPreference(option)}
              className={cn(
                'rounded-sm px-3 py-1 text-small capitalize duration-fast ease-standard transition-colors',
                preference === option
                  ? 'bg-accent-soft text-accent-text'
                  : 'text-text-2 hover:bg-surface-2',
              )}
            >
              {option}
            </button>
          ))}
        </div>
      </header>

      <Section title="Surfaces">
        <SwatchGrid tokens={SURFACES} />
      </Section>
      <Section title="Borders">
        <SwatchGrid tokens={BORDERS} />
      </Section>
      <Section title="Text">
        <SwatchGrid tokens={TEXTS} />
      </Section>
      <Section title="Accent">
        <SwatchGrid tokens={ACCENTS} />
        <div className="h-14 rounded-md" style={{ background: 'var(--ai-gradient)' }} />
        <code className="text-text-2">--ai-gradient (AI moments only)</code>
      </Section>
      <Section title="Status">
        <SwatchGrid tokens={STATUSES.flatMap((s) => [s, `${s}-soft`])} />
        <div className="flex flex-wrap gap-3">
          {STATUSES.map((status) => (
            <span
              key={status}
              className={cn(
                'inline-flex h-6 items-center gap-2 rounded-full px-3 text-caption capitalize',
                status === 'success' && 'bg-success-soft text-success',
                status === 'warning' && 'bg-warning-soft text-warning',
                status === 'danger' && 'bg-danger-soft text-danger',
                status === 'info' && 'bg-info-soft text-info',
              )}
            >
              {status}
            </span>
          ))}
        </div>
      </Section>

      <Section title="Typography">
        <div className="flex flex-col divide-y divide-border rounded-lg border border-border bg-surface">
          {TYPE_SCALE.map((row) => (
            <div key={row.name} className="flex items-baseline gap-6 px-5 py-3">
              <span className="w-20 shrink-0 text-caption text-text-3">{row.name}</span>
              <span className={row.cls}>{row.sample}</span>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Radii">
        <div className="flex flex-wrap gap-4">
          {RADII.map((radius) => (
            <div key={radius.name} className="flex flex-col items-center gap-2">
              <div className={cn('size-16 border border-border-strong bg-surface-2', radius.cls)} />
              <code className="text-text-2">{radius.name}</code>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Shadows">
        <div className="flex flex-wrap gap-6">
          <div className="flex h-24 w-48 items-center justify-center rounded-lg border border-border bg-surface text-small shadow-card">
            shadow-card
          </div>
          <div className="flex h-24 w-48 items-center justify-center rounded-xl bg-surface text-small shadow-pop">
            shadow-pop
          </div>
        </div>
      </Section>

      <Section title="Spacing">
        <div className="flex flex-col gap-2">
          {SPACING.map((space) => (
            <div key={space.name} className="flex items-center gap-4">
              <code className="w-10 text-text-2">{space.name}</code>
              <div className={cn('h-3 rounded-sm bg-accent', space.cls)} />
            </div>
          ))}
        </div>
      </Section>

      <Section title="Focus ring">
        <button
          type="button"
          className="w-fit rounded-md bg-primary px-4 py-2 text-small text-primary-foreground"
        >
          Tab to focus
        </button>
      </Section>
    </main>
  );
}
