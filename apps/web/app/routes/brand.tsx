import { useState } from 'react';
import { ConceptsSection } from '~/brand/concepts';
import { BrandContext } from '~/brand/context';
import { APP_NAME } from '@resolve/shared';
import { Link } from 'react-router';
import { CONCEPTS, Lockup } from '~/components/brand-mark';
import { SegmentedControl } from '~/components/ui/segmented-control';
import {
  IconSection,
  MarkSection,
  SizesSection,
  UsageSection,
  WordmarkSection,
} from '~/brand/sections';
import { useTheme } from '~/lib/theme';

const NAV = [
  { id: 'concepts', label: 'Concepts' },
  { id: 'mark', label: 'Selected mark' },
  { id: 'wordmark', label: 'Wordmark and lockups' },
  { id: 'sizes', label: 'Sizes and colour' },
  { id: 'icon', label: 'App icon' },
  { id: 'usage', label: 'Clear space and misuse' },
] as const;

const THEME_OPTIONS = [
  { value: 'system', label: 'System' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
] as const;

export function meta() {
  return [{ title: `Brand · ${APP_NAME}` }];
}

export default function Brand() {
  const { preference, setPreference } = useTheme();
  const [conceptId, setConceptId] = useState<string>('slice');
  const concept = CONCEPTS.find((item) => item.id === conceptId) ?? CONCEPTS[2]!;

  return (
    <div className="min-h-app bg-bg text-text">
      <header className="sticky top-0 z-20 flex flex-wrap items-center justify-between gap-4 border-b border-border bg-surface px-6 py-3">
        <div className="flex items-center gap-4">
          <Lockup Mark={concept.Mark} size={20} />
          <span className="text-small text-text-3">Brand</span>
          <Link
            to="/design"
            className="rounded-sm text-small text-accent-text underline underline-offset-4"
          >
            Design system
          </Link>
        </div>
        <SegmentedControl
          label="Theme"
          options={THEME_OPTIONS}
          value={preference}
          onChange={setPreference}
        />
      </header>
      <div className="mx-auto flex max-w-360 gap-8 px-6 py-10">
        <nav
          aria-label="Brand sections"
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
        <BrandContext.Provider value={concept.Mark}>
          <main className="flex min-w-0 flex-1 flex-col gap-16">
            <ConceptsSection selectedId={conceptId} onSelect={setConceptId} />
            <MarkSection />
            <WordmarkSection />
            <SizesSection />
            <IconSection />
            <UsageSection />
          </main>
        </BrandContext.Provider>
      </div>
    </div>
  );
}
