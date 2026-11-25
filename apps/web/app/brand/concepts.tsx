import { CONCEPTS, Wordmark, type Concept } from '~/components/brand-mark';
import { Button } from '~/components/ui/button';
import { DesignSection, Specimen } from '~/design/specimen';
import { cn } from '~/lib/cn';

function ConceptCard({
  concept,
  selected,
  onSelect,
}: {
  concept: Concept;
  selected: boolean;
  onSelect: () => void;
}) {
  const { Mark } = concept;
  return (
    <div
      className={cn(
        'flex flex-col gap-4 rounded-xl border bg-surface p-5 shadow-card',
        selected ? 'border-accent' : 'border-border',
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h4 className="text-h3">{concept.name}</h4>
          <p className="text-small text-text-2">{concept.idea}</p>
        </div>
        <Button
          size="sm"
          variant={selected ? 'primary' : 'secondary'}
          aria-pressed={selected}
          onClick={onSelect}
        >
          {selected ? 'Testing below' : 'Test below'}
        </Button>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {(['light', 'dark'] as const).map((theme) => (
          <div
            key={theme}
            className={cn(
              theme,
              'flex flex-col items-center justify-between gap-4 rounded-lg border border-border bg-surface p-4 text-text',
            )}
          >
            <Mark size={104} />
            <div className="flex items-end gap-3">
              <Mark size={16} />
              <Mark size={24} />
              <Mark size={32} />
              <Mark size={48} />
            </div>
            <span className="inline-flex items-center gap-2">
              <Mark size={26} />
              <Wordmark size={20} />
            </span>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-3">
        <span className="flex size-12 items-center justify-center rounded-xl bg-accent text-accent-contrast">
          <Mark size={32} />
        </span>
        <span className="flex size-12 items-center justify-center rounded-xl bg-text text-bg">
          <Mark size={32} />
        </span>
        <span className="flex size-8 items-center justify-center rounded-lg bg-accent text-accent-contrast">
          <Mark size={20} />
        </span>
        <span className="flex size-4 items-center justify-center rounded-sm bg-accent text-accent-contrast">
          <Mark size={12} />
        </span>
      </div>
    </div>
  );
}

export function ConceptsSection({
  selectedId,
  onSelect,
}: {
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  return (
    <DesignSection
      id="concepts"
      title="Concepts"
      description="Each direction is tested the same way: light and dark, 16 to 104px, with the wordmark, and as an app tile. Pick one to run the rest of the page on it."
    >
      <Specimen title="Directions" bodyClassName="w-full">
        <div className="grid w-full grid-cols-1 gap-4 xl:grid-cols-2">
          {CONCEPTS.map((concept) => (
            <ConceptCard
              key={concept.id}
              concept={concept}
              selected={concept.id === selectedId}
              onSelect={() => onSelect(concept.id)}
            />
          ))}
        </div>
      </Specimen>
    </DesignSection>
  );
}
