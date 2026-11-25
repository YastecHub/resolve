import { useState } from 'react';
import { AppIcon } from '~/components/app-icon';
import { Button } from '~/components/ui/button';
import { ICONS, ICON_SIZES, type IconKey } from '~/lib/icons';
import { cn } from '~/lib/cn';
import { DesignSection, Specimen } from './specimen';
import { RADII, SPACING, SWATCH_BG, TOKEN_GROUPS, TYPE_SCALE } from './token-data';

const ICON_GROUPS = ['nav', 'type', 'provider', 'trace', 'common'] as const;

export function Foundations() {
  const [replay, setReplay] = useState(0);
  const keys = Object.keys(ICONS) as IconKey[];

  return (
    <>
      <DesignSection
        id="color"
        title="Color"
        description="Semantic tokens only. Every surface below is shown in the active theme, or both with side by side on."
      >
        {TOKEN_GROUPS.map((group) => (
          <Specimen
            key={group.title}
            title={group.title}
            bodyClassName="grid w-full grid-cols-2 gap-4 sm:grid-cols-4"
          >
            {group.tokens.map((token) => (
              <div key={token} className="flex flex-col gap-2">
                <div className={cn('h-14 rounded-md border border-border', SWATCH_BG[token])} />
                <code className="text-text-2">--{token}</code>
              </div>
            ))}
          </Specimen>
        ))}
        <Specimen
          title="AI gradient"
          description="Reserved for AI moments: sparkle, investigating edge, high-confidence arc."
          bodyClassName="w-full"
        >
          <div className="h-14 w-full rounded-md bg-(image:--ai-gradient)" />
        </Specimen>
      </DesignSection>

      <DesignSection
        id="type"
        title="Typography"
        description="Geist and Geist Mono. Tabular numerals on every amount."
      >
        <Specimen title="Scale" bodyClassName="w-full flex-col">
          <div className="flex w-full flex-col divide-y divide-border rounded-lg border border-border bg-surface">
            {TYPE_SCALE.map((row) => (
              <div key={row.name} className="flex items-baseline gap-6 px-5 py-3">
                <span className="w-32 shrink-0 text-caption text-text-3">{row.name}</span>
                <span className={row.cls}>{row.sample}</span>
              </div>
            ))}
          </div>
        </Specimen>
        <Specimen title="Tabular numerals" description="Digits keep their width so columns align.">
          <div className="flex flex-col items-end gap-1 rounded-md border border-border bg-surface px-4 py-3 text-body tabular">
            <span>₦1,111,111.11</span>
            <span>₦8,888,888.88</span>
            <span>₦ 12,500.00</span>
          </div>
        </Specimen>
      </DesignSection>

      <DesignSection id="shape" title="Radius, elevation and spacing">
        <Specimen title="Radii">
          {RADII.map((radius) => (
            <div key={radius.name} className="flex flex-col items-center gap-2">
              <div className={cn('size-16 border border-border-strong bg-surface-2', radius.cls)} />
              <code className="text-text-2">{radius.name}</code>
            </div>
          ))}
        </Specimen>
        <Specimen
          title="Elevation"
          description="Cards sit flat with a hairline. Popovers and dialogs use shadow-pop; dark mode uses a border instead."
        >
          <div className="flex h-24 w-48 items-center justify-center rounded-lg border border-border bg-surface text-small shadow-card">
            shadow-card
          </div>
          <div className="flex h-24 w-48 items-center justify-center rounded-xl bg-surface text-small shadow-pop">
            shadow-pop
          </div>
        </Specimen>
        <Specimen title="Spacing" description="4px base. Values in px." bodyClassName="flex-col">
          {SPACING.map((space) => (
            <div key={space.name} className="flex items-center gap-4">
              <code className="w-8 text-text-2">{space.name}</code>
              <div className={cn('h-3 rounded-sm bg-accent', space.cls)} />
            </div>
          ))}
        </Specimen>
      </DesignSection>

      <DesignSection
        id="motion"
        title="Motion and focus"
        description="Durations 120, 180 and 280 ms with one easing curve. Reduced motion removes movement."
      >
        <Specimen title="Entrances and loops">
          <Button onClick={() => setReplay((n) => n + 1)}>Replay</Button>
          <div
            key={replay}
            className="animate-rise rounded-lg border border-border bg-surface px-5 py-3 text-small"
          >
            Fade and 6px rise, 180 ms
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-border bg-surface px-5 py-3 text-small">
            <span className="size-2 animate-pulse-dot rounded-full bg-accent" />
            Pulsing dot, 1.4 s
          </div>
          <div className="relative overflow-hidden rounded-lg border border-border bg-surface px-5 py-3 text-small">
            Investigating edge, 1.6 s
            <span className="sweep-edge absolute inset-x-0 bottom-0 h-0.5" />
          </div>
          <div className="skeleton h-12 w-48 rounded-lg" />
        </Specimen>
        <Specimen
          title="Focus ring"
          description="2px accent, 2px offset, keyboard focus only. Press Tab."
        >
          <Button variant="primary">Primary</Button>
          <Button>Secondary</Button>
          <Button variant="ghost">Ghost</Button>
          <a
            href="#focus"
            className="rounded-sm text-small text-accent-text underline underline-offset-4"
          >
            Link
          </a>
        </Specimen>
      </DesignSection>

      <DesignSection
        id="icons"
        title="Iconography"
        description="Hugeicons through AppIcon and semantic keys. Sizes 16, 20, 24, 48."
      >
        <Specimen title="Sizes">
          {ICON_SIZES.map((size) => (
            <div key={size} className="flex flex-col items-center gap-2">
              <AppIcon name="trace.model" size={size} />
              <code className="text-text-3">{size}</code>
            </div>
          ))}
        </Specimen>
        {ICON_GROUPS.map((group) => (
          <Specimen
            key={group}
            title={group}
            bodyClassName="grid w-full grid-cols-2 gap-3 sm:grid-cols-4"
          >
            {keys
              .filter((key) => key.startsWith(`${group}.`))
              .map((key) => (
                <div
                  key={key}
                  className="flex items-center gap-3 rounded-md border border-border bg-surface px-3 py-2"
                >
                  <AppIcon name={key} size={20} />
                  <code className="truncate text-text-2">{key}</code>
                </div>
              ))}
          </Specimen>
        ))}
      </DesignSection>
    </>
  );
}
