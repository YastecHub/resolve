import { EmptyState } from '~/components/ui/empty-state';
import { EvidenceChip } from '~/components/ui/evidence-chip';
import { toolIcon, toolLabel } from '~/design/screens/lib/case-view';
import type { EvidenceItem, TraceStepRow } from '~/design/screens/data/types';

interface EvidencePanelProps {
  evidence: readonly EvidenceItem[];
  steps: readonly TraceStepRow[];
  onJump: (stepId: string) => void;
}

export function EvidencePanel({ evidence, steps, onJump }: EvidencePanelProps) {
  if (evidence.length === 0) {
    return (
      <EmptyState
        icon="trace.ledger"
        title="No evidence yet"
        description="Cited evidence appears once the agent has made a recommendation."
        className="py-8"
      />
    );
  }
  return (
    <ul className="flex flex-col gap-4">
      {evidence.map((item) => {
        const step = steps.find((candidate) => candidate.id === item.toolCallId);
        return (
          <li key={item.toolCallId + item.claim} className="flex flex-col gap-2">
            <EvidenceChip
              icon={toolIcon(step?.toolName ?? null)}
              label={toolLabel(step?.toolName ?? null)}
              stepId={item.toolCallId}
              onClick={() => onJump(item.toolCallId)}
              className="w-fit"
            />
            <p className="text-small text-text-2">{item.claim}</p>
          </li>
        );
      })}
    </ul>
  );
}
