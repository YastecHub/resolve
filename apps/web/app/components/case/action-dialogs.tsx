import { useEffect, useState } from 'react';
import type { ResolutionAction } from '@resolve/shared';
import { Button } from '~/components/ui/button';
import { Dialog } from '~/components/ui/dialog';
import { Field, Textarea } from '~/components/ui/field';
import { SegmentedControl } from '~/components/ui/segmented-control';

const ACTION_OPTIONS = [
  { value: 'reverse_debit', label: 'Reverse debit' },
  { value: 'refund_duplicate', label: 'Refund duplicate' },
  { value: 'none', label: 'No action' },
] as const;

interface OverrideDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pending: boolean;
  error?: string;
  onSubmit: (body: { action: ResolutionAction; reason: string }) => void;
}

export function OverrideDialog({
  open,
  onOpenChange,
  pending,
  error,
  onSubmit,
}: OverrideDialogProps) {
  const [action, setAction] = useState<ResolutionAction>('reverse_debit');
  const [reason, setReason] = useState('');
  const [touched, setTouched] = useState(false);
  const short = reason.trim().length < 10;

  useEffect(() => {
    if (open) {
      setReason('');
      setTouched(false);
      setAction('reverse_debit');
    }
  }, [open]);

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="Override the agent"
      description="Tell us why. This goes in the audit trail."
      actions={
        <>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={pending}>
            Cancel
          </Button>
          <Button
            variant="primary"
            loading={pending}
            loadingLabel="Overriding…"
            onClick={() => {
              setTouched(true);
              if (!short) onSubmit({ action, reason: reason.trim() });
            }}
          >
            Override
          </Button>
        </>
      }
    >
      <SegmentedControl
        label="What should happen"
        options={ACTION_OPTIONS}
        value={action}
        onChange={setAction}
        className="w-full"
      />
      <Field
        label="Reason"
        hint="At least 10 characters."
        error={error ?? (touched && short ? 'Give a reason of at least 10 characters.' : undefined)}
      >
        {({ id, describedBy, invalid }) => (
          <Textarea
            id={id}
            aria-describedby={describedBy}
            invalid={invalid}
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder="Why are you overriding the recommendation?"
            autoFocus
          />
        )}
      </Field>
    </Dialog>
  );
}

interface EscalateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pending: boolean;
  error?: string;
  onSubmit: (reason: string) => void;
}

export function EscalateDialog({
  open,
  onOpenChange,
  pending,
  error,
  onSubmit,
}: EscalateDialogProps) {
  const [reason, setReason] = useState('');
  const [touched, setTouched] = useState(false);
  const empty = reason.trim().length === 0;

  useEffect(() => {
    if (open) {
      setReason('');
      setTouched(false);
    }
  }, [open]);

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      tone="info"
      title="Send to a senior analyst"
      description="They will see the full trace and your note."
      actions={
        <>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={pending}>
            Cancel
          </Button>
          <Button
            variant="primary"
            loading={pending}
            loadingLabel="Escalating…"
            onClick={() => {
              setTouched(true);
              if (!empty) onSubmit(reason.trim());
            }}
          >
            Escalate
          </Button>
        </>
      }
    >
      <Field
        label="Note for the senior analyst"
        error={error ?? (touched && empty ? 'Add a short note.' : undefined)}
      >
        {({ id, describedBy, invalid }) => (
          <Textarea
            id={id}
            aria-describedby={describedBy}
            invalid={invalid}
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder="Anything they should look at first?"
            autoFocus
          />
        )}
      </Field>
    </Dialog>
  );
}
