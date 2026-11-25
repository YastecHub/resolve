import { useState } from 'react';
import { DecisionCard, type DecisionData } from '~/components/decision-card';
import { EvidenceChip } from '~/components/ui/evidence-chip';
import { IntegrityBadge } from '~/components/trace/integrity-badge';
import { RunningNode, TraceStep, type TraceStepData } from '~/components/trace/trace-step';
import { DesignSection, Specimen } from './specimen';
import { HOUR, MINUTE, NOW } from './sample';

const STEPS: TraceStepData[] = [
  {
    id: 'stp_01J8K2M4Q7X9V3N5R6T8W0Y001',
    kind: 'model',
    title: 'Model',
    summary: 'Decided to check the transaction first.',
  },
  {
    id: 'stp_01J8K2M4Q7X9V3N5R6T8W0Y002',
    kind: 'tool',
    icon: 'trace.transaction',
    title: 'Get transaction',
    summary: 'Card payment, ₦240,000.00, web, Abuja.',
    durationMs: 84,
    details: { Reference: 'TX-88421', Channel: 'Web', Status: 'Successful', 'IP country': 'NG' },
    raw: { ok: true, data: { reference: 'TX-88421', amount_minor: 24000000, channel: 'web' } },
  },
  {
    id: 'stp_01J8K2M4Q7X9V3N5R6T8W0Y003',
    kind: 'tool',
    icon: 'trace.device',
    title: 'Get device and location',
    summary: 'New device, first seen 6 minutes before the payment.',
    durationMs: 73,
    details: { Trusted: 'No', 'City matches home': 'No', 'First seen': 'Within 24 hours' },
  },
  {
    id: 'stp_01J8K2M4Q7X9V3N5R6T8W0Y004',
    kind: 'error',
    title: 'Get merchant info',
    summary: 'Merchant lookup timed out. The agent continued without it.',
    durationMs: 3000,
  },
  {
    id: 'stp_01J8K2M4Q7X9V3N5R6T8W0Y005',
    kind: 'decision',
    title: 'Decision submitted',
    summary: 'Send for human review at 88% confidence.',
  },
];

const DECISION: DecisionData = {
  outcome: 'escalate',
  action: 'manual_review',
  type: 'unauthorised_payment',
  confidence: 0.88,
  threshold: 0.9,
  risk: 'high',
  fraudSuspected: true,
  reasons: ['fraud_suspected', 'review_type', 'low_confidence'],
  model: 'qwen2.5-72b',
  providerKind: 'onprem',
  durationSeconds: 11.8,
};

const RESOLVED_DECISION: DecisionData = {
  ...DECISION,
  outcome: 'auto_resolve',
  action: 'reverse_debit',
  type: 'failed_transfer_debit',
  confidence: 0.96,
  risk: 'low',
  fraudSuspected: false,
  reasons: [],
};

export function TraceSection() {
  const [highlight, setHighlight] = useState<string | null>(null);

  const jump = (id: string) => {
    setHighlight(id);
    document.getElementById(`step-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    window.setTimeout(() => setHighlight(null), 1200);
  };

  return (
    <DesignSection
      id="trace"
      title="Reasoning trace"
      description="The agent's work is the product. Steps expand, cite and verify."
    >
      <Specimen
        title="Timeline"
        description="Expand a step for key-values and raw JSON. Citations scroll to and pulse the step."
        bodyClassName="w-full max-w-2xl flex-col"
      >
        <div className="flex flex-wrap gap-2">
          <EvidenceChip
            icon="trace.transaction"
            label="Transaction"
            stepId={STEPS[1]!.id}
            onClick={() => jump(STEPS[1]!.id)}
          />
          <EvidenceChip
            icon="trace.device"
            label="Device"
            stepId={STEPS[2]!.id}
            onClick={() => jump(STEPS[2]!.id)}
          />
        </div>
        <ol className="flex w-full flex-col">
          {STEPS.map((step, index) => (
            <TraceStep
              key={step.id}
              step={step}
              index={index}
              highlighted={highlight === step.id}
            />
          ))}
          <RunningNode />
        </ol>
        <IntegrityBadge verified steps={STEPS.length} />
        <IntegrityBadge verified={false} steps={STEPS.length} brokenAt={4} />
      </Specimen>
    </DesignSection>
  );
}

export function DecisionSection() {
  return (
    <DesignSection
      id="decision"
      title="Decision card"
      description="Needs review, investigating, resolved and the disabled action bar."
    >
      <Specimen title="Needs review" bodyClassName="w-full max-w-xl">
        <DecisionCard state="needs_review" decision={DECISION} className="w-full" />
      </Specimen>
      <Specimen
        title="Actions disabled"
        description="Disabled actions explain why in a tooltip."
        bodyClassName="w-full max-w-xl"
      >
        <DecisionCard
          state="needs_review"
          decision={{
            ...DECISION,
            reasons: ['rejection_needs_confirmation'],
            outcome: 'reject',
            action: 'none',
            fraudSuspected: false,
            risk: 'low',
            confidence: 0.94,
            type: 'legitimate_transaction',
          }}
          disabledReasons={{
            approve: 'Only analysts can act on a case.',
            override: 'Only analysts can act on a case.',
            escalate: 'Only analysts can act on a case.',
          }}
          className="w-full"
        />
      </Specimen>
      <Specimen title="Investigating" bodyClassName="w-full max-w-xl">
        <DecisionCard state="investigating" className="w-full" />
      </Specimen>
      <Specimen
        title="Resolved"
        description="The resolution block replaces the action bar: what was done, by whom, when, and the reason for an override."
        bodyClassName="w-full max-w-xl flex-col"
      >
        <DecisionCard
          state="resolved"
          decision={RESOLVED_DECISION}
          resolution={{
            outcome: 'Debit reversed. The customer message is ready to send.',
            resolvedBy: 'analyst',
            actor: 'ada@bank.example',
            at: NOW - 2 * HOUR,
            overridden: true,
            reason: 'Settlement failed upstream, so the debit should not stand.',
          }}
          className="w-full"
        />
        <DecisionCard
          state="resolved"
          decision={RESOLVED_DECISION}
          resolution={{
            outcome: 'Debit reversed.',
            resolvedBy: 'analyst',
            actor: 'tunde@bank.example',
            at: NOW - 25 * MINUTE,
          }}
          className="w-full"
        />
        <DecisionCard
          state="resolved"
          decision={RESOLVED_DECISION}
          resolution={{
            outcome: 'Debit reversed automatically.',
            resolvedBy: 'agent',
            at: NOW - 40_000,
          }}
          className="w-full"
        />
      </Specimen>
    </DesignSection>
  );
}
