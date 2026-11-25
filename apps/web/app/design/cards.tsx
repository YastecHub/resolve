import { Button } from '~/components/ui/button';
import { KpiCard } from '~/components/ui/kpi-card';
import { SectionCard } from '~/components/ui/section-card';
import { SkeletonKpiCard } from '~/components/ui/skeleton';
import { formatNaira } from '@resolve/shared';
import { DesignSection, Specimen } from './specimen';

export function Cards() {
  return (
    <DesignSection
      id="cards"
      title="Cards"
      description="Flat surfaces with a hairline. Cards never nest."
    >
      <Specimen
        title="KpiCard"
        description="Numbers tween in 600 ms when they change."
        bodyClassName="grid w-full grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        <KpiCard
          label="Median time"
          value={12.4}
          format={(v) => `${v.toFixed(1)} s`}
          context="vs 72h limit"
        />
        <KpiCard
          label="Auto-resolved"
          value={68}
          format={(v) => `${Math.round(v)}%`}
          context="Up 4 points this week"
        />
        <KpiCard label="Awaiting review" value={4} context="Oldest 2h" to="/design#cards" />
        <KpiCard
          label="Value in review"
          value={2_400_000}
          format={(v) => formatNaira(Math.round(v))}
          context="Across 4 cases"
        />
      </Specimen>
      <Specimen
        title="KpiCard loading"
        bodyClassName="grid w-full grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        <SkeletonKpiCard />
        <SkeletonKpiCard />
      </Specimen>
      <Specimen title="SectionCard" bodyClassName="w-full max-w-xl">
        <SectionCard
          title="Auto-resolve policy"
          description="Applies to every new investigation."
          action={
            <Button size="sm" variant="ghost">
              Reset
            </Button>
          }
          className="w-full"
        >
          <p className="text-body text-text-2">
            Failed transfers and duplicate charges under the value limit resolve without a person.
          </p>
        </SectionCard>
      </Specimen>
    </DesignSection>
  );
}
