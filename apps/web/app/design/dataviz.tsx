import { AreaChart } from '~/components/charts/area-chart';
import { ProgressBar } from '~/components/charts/progress-bar';
import { Sparkline } from '~/components/charts/sparkline';
import { StackedBars } from '~/components/charts/stacked-bars';
import { ConfidenceArc, ConfidenceMeter } from '~/components/ui/confidence-meter';
import { KpiCard } from '~/components/ui/kpi-card';
import { SectionCard } from '~/components/ui/section-card';
import { SlaRing } from '~/components/ui/sla-ring';
import { DesignSection, Specimen } from './specimen';
import { AREA_DATA, HOUR, NOW, SPARK_DATA, STACK_ROWS, STACK_SEGMENTS } from './sample';

export function DataViz() {
  return (
    <DesignSection
      id="dataviz"
      title="Confidence, SLA and charts"
      description="Hand-built SVG on the tokens. Every chart has a text equivalent."
    >
      <Specimen
        title="ConfidenceMeter, compact"
        description="Green at 90% and above, amber from 60%, red below. The tick marks the policy threshold."
      >
        <ConfidenceMeter value={0.96} threshold={0.9} />
        <ConfidenceMeter value={0.88} threshold={0.9} />
        <ConfidenceMeter value={0.72} threshold={0.9} />
        <ConfidenceMeter value={0.41} threshold={0.9} />
      </Specimen>
      <Specimen
        title="ConfidenceArc, large"
        description="Arc and number animate together over 700 ms. The tick marks the policy threshold; high confidence uses the AI gradient."
      >
        <ConfidenceArc value={0.96} threshold={0.9} />
        <ConfidenceArc value={0.9} threshold={0.9} />
        <ConfidenceArc value={0.78} threshold={0.9} />
        <ConfidenceArc value={0.42} threshold={0.9} />
        <ConfidenceArc value={1} />
        <ConfidenceArc value={0} />
      </Specimen>
      <Specimen
        title="SlaRing"
        description="Green under 50% elapsed, amber to 85%, red beyond or overdue. Hover for the rule."
      >
        <SlaRing dueAt={NOW + 60 * HOUR} now={NOW} />
        <SlaRing dueAt={NOW + 41 * HOUR} now={NOW} />
        <SlaRing dueAt={NOW + 9 * HOUR} now={NOW} />
        <SlaRing dueAt={NOW - 3 * HOUR} now={NOW} />
        <SlaRing dueAt={NOW + 9 * HOUR} now={NOW} showLabel={false} />
      </Specimen>
      <Specimen title="Sparkline and progress">
        <div className="flex items-center gap-4">
          <Sparkline data={SPARK_DATA} label="Auto-resolved trend, rising" />
          <KpiCard
            label="Auto-resolved"
            value={68}
            format={(v) => `${Math.round(v)}%`}
            context="Up 4 points"
            chart={<Sparkline data={SPARK_DATA} label="Auto-resolved trend, rising" />}
            className="w-64"
          />
        </div>
        <div className="flex w-64 flex-col gap-2">
          <span className="text-small text-text-2">12.4 s of the 72h window</span>
          <ProgressBar value={0.02} label="Median time against the 72 hour limit" />
          <ProgressBar value={0.55} tone="warning" label="Warning example" />
          <ProgressBar value={0.92} tone="danger" label="Danger example" />
        </div>
      </Specimen>
      <Specimen
        title="AreaChart"
        description="Throughput per hour. Hover or move the pointer for values."
        bodyClassName="w-full"
      >
        <SectionCard title="Throughput" description="Investigations per hour" className="w-full">
          <AreaChart data={AREA_DATA} label="Investigations per hour over 24 hours" />
        </SectionCard>
      </Specimen>
      <Specimen
        title="StackedBars"
        description="Outcomes by type. Legend labels carry the meaning, not only color."
        bodyClassName="w-full"
      >
        <SectionCard title="Outcomes by type" className="w-full">
          <StackedBars segments={STACK_SEGMENTS} rows={STACK_ROWS} />
        </SectionCard>
      </Specimen>
    </DesignSection>
  );
}
