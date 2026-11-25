export const SWATCH_BG: Record<string, string> = {
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

export const TOKEN_GROUPS = [
  { title: 'Surfaces', tokens: ['bg', 'surface', 'surface-2', 'surface-3'] },
  { title: 'Borders', tokens: ['border', 'border-strong'] },
  { title: 'Text', tokens: ['text', 'text-2', 'text-3'] },
  { title: 'Accent', tokens: ['accent', 'accent-soft', 'accent-text'] },
  {
    title: 'Status',
    tokens: [
      'success',
      'success-soft',
      'warning',
      'warning-soft',
      'danger',
      'danger-soft',
      'info',
      'info-soft',
    ],
  },
] as const;

export const TYPE_SCALE = [
  { name: 'Display · 32/40', cls: 'text-display', sample: 'Resolve disputes in minutes' },
  { name: 'KPI · 36/40', cls: 'text-kpi tabular', sample: '₦12,500.00' },
  { name: 'H1 · 24/32', cls: 'text-h1', sample: 'Cases awaiting review' },
  { name: 'H2 · 18/26', cls: 'text-h2', sample: 'Agent reasoning' },
  { name: 'H3 · 15/22', cls: 'text-h3', sample: 'Decision' },
  { name: 'Body · 14/22', cls: 'text-body', sample: 'The debit has no matching credit.' },
  { name: 'Small · 13/20', cls: 'text-small', sample: 'Settlement failed 41 minutes ago' },
  { name: 'Caption · 12/16', cls: 'text-caption', sample: 'CONFIDENCE' },
  { name: 'Mono · 12.5/20', cls: 'text-code font-mono', sample: 'stp_01J9ZK3Q7M2V8X4N6R5T1W0YBA' },
] as const;

export const RADII = [
  { name: 'sm · 6', cls: 'rounded-sm' },
  { name: 'md · 10', cls: 'rounded-md' },
  { name: 'lg · 14', cls: 'rounded-lg' },
  { name: 'xl · 20', cls: 'rounded-xl' },
  { name: 'full', cls: 'rounded-full' },
] as const;

export const SPACING = [
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
