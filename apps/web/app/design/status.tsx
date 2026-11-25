import { CopyableId } from '~/components/ui/copyable-id';
import { EvidenceChip } from '~/components/ui/evidence-chip';
import { Money } from '~/components/ui/money';
import { RelativeTime } from '~/components/ui/relative-time';
import { RiskPill } from '~/components/ui/risk-pill';
import { StatusPill } from '~/components/ui/status-pill';
import { TypeBadge } from '~/components/ui/type-badge';
import { DesignSection, Specimen } from './specimen';
import { HOUR, MINUTE, NOW, SAMPLE_IDS, STATUSES, TYPES } from './sample';

export function StatusAndData() {
  return (
    <>
      <DesignSection
        id="status"
        title="Status and badges"
        description="Color is never the only signal: a label is always present."
      >
        <Specimen title="StatusPill" description="One per dispute status. Investigating pulses.">
          {STATUSES.map((status) => (
            <StatusPill key={status} status={status} />
          ))}
          <StatusPill status="resolved" resolvedBy="agent" />
          <StatusPill status="resolved" resolvedBy="analyst" />
        </Specimen>
        <Specimen title="TypeBadge" description="Unauthorised carries the danger tint.">
          {TYPES.map((type) => (
            <TypeBadge key={type} type={type} />
          ))}
        </Specimen>
        <Specimen title="RiskPill">
          <RiskPill level="low" />
          <RiskPill level="medium" />
          <RiskPill level="high" />
        </Specimen>
        <Specimen title="EvidenceChip" description="Click jumps to the cited trace step.">
          <EvidenceChip icon="trace.transaction" label="Transaction" stepId={SAMPLE_IDS.step} />
          <EvidenceChip
            icon="trace.ledger"
            label="Ledger"
            stepId="stp_01J8K2M4Q7X9V3N5R6T8W0Y91C0"
          />
          <EvidenceChip
            icon="trace.device"
            label="Device"
            stepId="stp_01J8K2M4Q7X9V3N5R6T8W0Y3B7E"
          />
          <EvidenceChip
            icon="trace.customer"
            label="Profile"
            stepId="stp_01J8K2M4Q7X9V3N5R6T8W0Y55D1"
          />
        </Specimen>
      </DesignSection>

      <DesignSection
        id="data"
        title="Data formatting"
        description="Amounts, times and IDs follow the microcopy rules."
      >
        <Specimen
          title="Money"
          description="Integer kobo in, formatted naira out. Tabular numerals."
        >
          <div className="flex flex-col items-end gap-1 text-body">
            <Money minor={1_250_000} />
            <Money minor={5} />
            <Money minor={-1_250_000} />
            <Money minor={123_456_789_012_345} />
          </div>
          <Money minor={24_000_000} className="text-kpi" />
        </Specimen>
        <Specimen title="RelativeTime" description="Hover for the absolute time.">
          <RelativeTime at={NOW - 10_000} now={NOW} />
          <RelativeTime at={NOW - 12 * MINUTE} now={NOW} />
          <RelativeTime at={NOW - 2 * HOUR} now={NOW} />
          <RelativeTime at={NOW - 50 * HOUR} now={NOW} />
          <RelativeTime at={NOW + 9 * HOUR} now={NOW} />
        </Specimen>
        <Specimen
          title="CopyableId"
          description="Shortened to the last four characters. Click copies the full ID."
        >
          <CopyableId id={SAMPLE_IDS.dispute} />
          <CopyableId id="txn_01J8K2M4Q7X9V3N5R6T8W0Y3C91" />
        </Specimen>
      </DesignSection>
    </>
  );
}
