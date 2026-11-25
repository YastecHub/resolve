import { useState } from 'react';
import { Button } from '~/components/ui/button';
import { DialogSurface, type DialogSize, type DialogTone } from '~/components/ui/dialog';
import { Field, Textarea } from '~/components/ui/field';
import { SegmentedControl } from '~/components/ui/segmented-control';
import { Specimen } from './specimen';

export function OverrideForm() {
  const [reason, setReason] = useState('');
  return (
    <>
      <SegmentedControl
        label="Override action"
        options={[
          { value: 'reverse_debit', label: 'Reverse debit' },
          { value: 'refund_duplicate', label: 'Refund' },
          { value: 'none', label: 'No action' },
        ]}
        value="reverse_debit"
        onChange={() => undefined}
        className="w-full"
      />
      <Field label="Reason" hint={`${reason.length} / 500`}>
        {({ id, describedBy }) => (
          <Textarea
            id={id}
            aria-describedby={describedBy}
            value={reason}
            maxLength={500}
            onChange={(event) => setReason(event.target.value)}
            placeholder="Why are you overriding the recommendation?"
          />
        )}
      </Field>
    </>
  );
}

export function EscalateForm() {
  return (
    <Field label="Note for the senior analyst">
      {({ id }) => <Textarea id={id} placeholder="Anything they should look at first?" />}
    </Field>
  );
}

export function LongBody() {
  return (
    <div className="flex flex-col gap-3 text-small text-text-2">
      {Array.from({ length: 14 }, (_, index) => (
        <p key={index}>
          Step {index + 1}. The agent checked the ledger, compared the settlement record with the
          debit, and found no matching credit within the expected window.
        </p>
      ))}
    </div>
  );
}

interface PreviewProps {
  title: string;
  description?: string;
  tone?: DialogTone;
  size?: DialogSize;
  loading?: boolean;
  confirm: string;
  confirmLoading?: string;
  destructive?: boolean;
  children?: React.ReactNode;
}

const WIDTH: Record<DialogSize, string> = { sm: 'max-w-100', md: 'max-w-120', lg: 'max-w-160' };

function Preview({
  title,
  description,
  tone,
  size = 'md',
  loading,
  confirm,
  confirmLoading,
  destructive,
  children,
}: PreviewProps) {
  return (
    <div className="flex w-full items-center justify-center rounded-lg bg-scrim p-6">
      <div
        className={`w-full overflow-hidden rounded-xl border border-border bg-surface shadow-pop ${WIDTH[size]}`}
      >
        <DialogSurface
          tone={tone}
          compact={size === 'sm'}
          title={<h2 className="text-h2">{title}</h2>}
          description={
            description ? <p className="text-small text-text-2">{description}</p> : undefined
          }
          actions={
            <>
              <Button variant="ghost">Cancel</Button>
              <Button
                variant={destructive ? 'destructive' : 'primary'}
                loading={loading}
                loadingLabel={confirmLoading}
              >
                {confirm}
              </Button>
            </>
          }
        >
          {children}
        </DialogSurface>
      </div>
    </div>
  );
}

export function DialogGallery() {
  return (
    <Specimen
      title="Dialog gallery"
      description="Static previews of every variant on the scrim, no clicking needed. Same surface as the live dialogs."
      bodyClassName="w-full flex-col gap-6"
    >
      <Preview
        title="Override the agent"
        description="Tell us why. This goes in the audit trail."
        confirm="Override"
      >
        <OverrideForm />
      </Preview>
      <Preview
        tone="warning"
        size="sm"
        title="Switch to a hosted model?"
        description="Masked case data will be sent to the model provider through AI Gateway."
        confirm="Switch to hosted"
      />
      <Preview
        tone="info"
        title="Send to a senior analyst"
        description="They will see the full trace and your note."
        confirm="Escalate"
      >
        <EscalateForm />
      </Preview>
      <Preview
        tone="danger"
        size="sm"
        destructive
        title="Reject this dispute?"
        description="The customer will be told the transaction stands. This is recorded in the audit trail."
        confirm="Reject dispute"
      />
      <Preview
        title="Override the agent"
        description="Submitting."
        confirm="Override"
        confirmLoading="Overriding…"
        loading
      >
        <OverrideForm />
      </Preview>
    </Specimen>
  );
}
