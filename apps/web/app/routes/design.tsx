import { useState } from 'react';
import { Link } from 'react-router';
import { APP_NAME } from '@resolve/shared';
import { BrandMark, Lockup } from '~/components/brand-mark';
import { SegmentedControl } from '~/components/ui/segmented-control';
import { Cards } from '~/design/cards';
import { DataViz } from '~/design/dataviz';
import { Overlays } from '~/design/overlays';
import { ProductPatterns } from '~/design/product';
import { SettingsControls } from '~/design/settings-controls';
import { DecisionSection, TraceSection } from '~/design/trace';
import { Controls } from '~/design/controls';
import { Feedback } from '~/design/feedback';
import { Foundations } from '~/design/foundations';
import { CompareContext } from '~/design/specimen';
import { StatusAndData } from '~/design/status';
import { useTheme } from '~/lib/theme';

const NAV = [
  { id: 'color', label: 'Color' },
  { id: 'type', label: 'Typography' },
  { id: 'shape', label: 'Radius and spacing' },
  { id: 'motion', label: 'Motion and focus' },
  { id: 'icons', label: 'Iconography' },
  { id: 'controls', label: 'Buttons and controls' },
  { id: 'status', label: 'Status and badges' },
  { id: 'data', label: 'Data formatting' },
  { id: 'cards', label: 'Cards' },
  { id: 'dataviz', label: 'Confidence, SLA, charts' },
  { id: 'trace', label: 'Reasoning trace' },
  { id: 'decision', label: 'Decision card' },
  { id: 'table', label: 'Tables' },
  { id: 'shell', label: 'App shell' },
  { id: 'settings', label: 'Form patterns' },
  { id: 'overlays', label: 'Overlays and feedback' },
  { id: 'patterns', label: 'Patterns' },
  { id: 'feedback', label: 'Loading, empty, error' },
] as const;

const THEME_OPTIONS = [
  { value: 'system', label: 'System' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
] as const;

const VIEW_OPTIONS = [
  { value: 'single', label: 'Single' },
  { value: 'compare', label: 'Side by side' },
] as const;

export function meta() {
  return [{ title: `Design system · ${APP_NAME}` }];
}

export default function Design() {
  const { preference, setPreference } = useTheme();
  const [view, setView] = useState<(typeof VIEW_OPTIONS)[number]['value']>('single');

  return (
    <CompareContext.Provider value={view === 'compare'}>
      <div className="min-h-app bg-bg text-text">
        <header className="sticky top-0 z-20 flex flex-wrap items-center justify-between gap-4 border-b border-border bg-surface px-6 py-3">
          <div className="flex items-center gap-4">
            <Lockup Mark={BrandMark} size={20} />
            <span className="text-small text-text-3">Design system</span>
            <Link
              to="/brand"
              className="rounded-sm text-small text-accent-text underline underline-offset-4"
            >
              Brand
            </Link>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <SegmentedControl
              label="Specimen view"
              options={VIEW_OPTIONS}
              value={view}
              onChange={setView}
            />
            <SegmentedControl
              label="Theme"
              options={THEME_OPTIONS}
              value={preference}
              onChange={setPreference}
            />
          </div>
        </header>
        <div className="mx-auto flex max-w-360 gap-8 px-6 py-10">
          <nav
            aria-label="Design system sections"
            className="sticky top-24 hidden h-fit w-44 shrink-0 flex-col gap-1 lg:flex"
          >
            {NAV.map((item) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                className="rounded-md px-3 py-1.5 text-small text-text-2 transition-colors duration-fast ease-standard hover:bg-surface-2 hover:text-text"
              >
                {item.label}
              </a>
            ))}
          </nav>
          <main className="flex min-w-0 flex-1 flex-col gap-16">
            <Foundations />
            <Controls />
            <StatusAndData />
            <Cards />
            <DataViz />
            <TraceSection />
            <DecisionSection />
            <ProductPatterns />
            <SettingsControls />
            <Overlays />
            <Feedback />
          </main>
        </div>
      </div>
    </CompareContext.Provider>
  );
}
