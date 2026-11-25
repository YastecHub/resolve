import { AppIcon } from '~/components/app-icon';
import { Lockup, Wordmark, type MarkProps } from '~/components/brand-mark';
import { useMark } from './context';
import { cn } from '~/lib/cn';
import { DesignSection, Specimen } from '~/design/specimen';
import { Caption, LightDark } from './panels';

function BrandMark({ size, className }: MarkProps & { title?: string }) {
  const Mark = useMark();
  return <Mark size={size} className={className} />;
}

function SelectedLockup(props: Omit<React.ComponentProps<typeof Lockup>, 'Mark'>) {
  return <Lockup Mark={useMark()} {...props} />;
}

const SIZES = [16, 20, 24, 32, 48, 64, 96, 128] as const;

function Tile({
  size,
  className,
  markSize,
  children,
}: {
  size: number;
  className?: string;
  markSize: number;
  children?: React.ReactNode;
}) {
  return (
    <span
      className={cn('flex items-center justify-center', className)}
      style={{ width: size, height: size, borderRadius: size * 0.225 }}
    >
      {children ?? <BrandMark size={markSize} />}
    </span>
  );
}

export function MarkSection() {
  return (
    <DesignSection
      id="mark"
      title="Selected mark"
      description="The selected concept, on light and dark."
    >
      <Specimen title="Primary mark" bodyClassName="w-full">
        <LightDark>
          <BrandMark size={160} />
        </LightDark>
      </Specimen>
    </DesignSection>
  );
}

export function WordmarkSection() {
  return (
    <DesignSection
      id="wordmark"
      title="Wordmark and lockups"
      description="Geist SemiBold, tracking -2%. The wordmark is set as text, never drawn. The mark sits slightly taller than the cap height so the two read as one unit."
    >
      <Specimen title="Wordmark" bodyClassName="w-full">
        <LightDark>
          <Wordmark size={40} />
          <Wordmark size={40} lowercase />
        </LightDark>
      </Specimen>
      <Specimen title="Horizontal lockup" bodyClassName="w-full">
        <LightDark>
          <SelectedLockup size={32} />
          <SelectedLockup size={32} lowercase />
        </LightDark>
      </Specimen>
      <Specimen title="Stacked lockup" bodyClassName="w-full">
        <LightDark>
          <SelectedLockup size={28} layout="stacked" />
        </LightDark>
      </Specimen>
    </DesignSection>
  );
}

export function SizesSection() {
  return (
    <DesignSection
      id="sizes"
      title="Small sizes and one colour"
      description="The mark has to hold at 16px and work in a single colour."
    >
      <Specimen title="Scale" description="16, 20, 24, 32, 48, 64, 96, 128." bodyClassName="w-full">
        <LightDark className="items-end">
          {SIZES.map((size) => (
            <div key={size} className="flex flex-col items-center gap-1">
              <BrandMark size={size} />
              <span className="text-caption opacity-60">{size}</span>
            </div>
          ))}
        </LightDark>
      </Specimen>
      <Specimen
        title="Colour"
        description="Ink, accent, and reversed on the accent."
        bodyClassName="w-full"
      >
        <div className="grid w-full grid-cols-2 gap-4 md:grid-cols-4">
          <div className="flex h-40 items-center justify-center rounded-lg border border-border bg-surface text-text">
            <BrandMark size={72} />
          </div>
          <div className="flex h-40 items-center justify-center rounded-lg border border-border bg-surface text-accent">
            <BrandMark size={72} />
          </div>
          <div className="flex h-40 items-center justify-center rounded-lg bg-accent text-accent-contrast">
            <BrandMark size={72} />
          </div>
          <div className="dark flex h-40 items-center justify-center rounded-lg border border-border bg-bg text-text">
            <BrandMark size={72} />
          </div>
        </div>
        <Caption>
          Ink on paper, accent on paper, reversed on accent, paper on near-black. The palette
          (violet in the UI spec, red and navy in the deck) is still open.
        </Caption>
      </Specimen>
    </DesignSection>
  );
}

export function IconSection() {
  return (
    <DesignSection
      id="icon"
      title="App icon and favicon"
      description="The mark centred on a rounded tile."
    >
      <Specimen title="Tiles" bodyClassName="w-full items-end gap-6">
        <Tile size={128} markSize={84} className="bg-accent text-accent-contrast" />
        <Tile size={128} markSize={84} className="bg-text text-bg" />
        <Tile size={128} markSize={84} className="border border-border bg-surface text-text" />
        <Tile size={64} markSize={42} className="bg-accent text-accent-contrast" />
        <Tile size={32} markSize={22} className="bg-accent text-accent-contrast" />
        <Tile size={16} markSize={12} className="bg-accent text-accent-contrast" />
      </Specimen>
      <Specimen title="Browser tab" bodyClassName="w-full">
        <LightDark>
          <div className="flex w-full max-w-xs items-center gap-2 rounded-t-lg border border-b-0 border-border bg-bg px-3 py-2 text-small">
            <Tile size={16} markSize={12} className="bg-accent text-accent-contrast" />
            <span className="truncate">Resolve</span>
            <AppIcon name="common.close" size={16} className="ml-auto text-text-3" />
          </div>
        </LightDark>
      </Specimen>
    </DesignSection>
  );
}

const MISUSE: { label: string; style: React.CSSProperties; className?: string }[] = [
  { label: 'Do not rotate', style: { transform: 'rotate(18deg)' } },
  { label: 'Do not stretch', style: { transform: 'scaleX(1.5)' } },
  { label: 'Do not add effects', style: {}, className: 'drop-shadow-lg' },
  { label: 'Do not use low contrast', style: {}, className: 'text-text-3 opacity-40' },
];

export function UsageSection() {
  return (
    <DesignSection
      id="usage"
      title="Clear space and misuse"
      description="Keep clear space of a quarter of the mark on every side."
    >
      <Specimen title="Clear space" bodyClassName="w-full">
        <LightDark>
          <div className="relative p-8">
            <div className="absolute inset-0 border border-dashed border-accent" />
            <div className="absolute inset-8 border border-dashed border-border-strong" />
            <BrandMark size={128} />
          </div>
        </LightDark>
      </Specimen>
      <Specimen title="Misuse" bodyClassName="w-full">
        <div className="grid w-full grid-cols-2 gap-4 md:grid-cols-4">
          {MISUSE.map((item) => (
            <div
              key={item.label}
              className="flex flex-col items-center gap-3 rounded-lg border border-border bg-surface p-5 text-text"
            >
              <span className="flex h-24 items-center justify-center">
                <span style={item.style} className="inline-flex">
                  <BrandMark size={64} className={item.className} />
                </span>
              </span>
              <span className="text-small text-danger">{item.label}</span>
            </div>
          ))}
        </div>
      </Specimen>
    </DesignSection>
  );
}
