import { useEffect, useState } from 'react';
import { AppIcon } from '~/components/app-icon';
import { Button } from '~/components/ui/button';
import { Textarea } from '~/components/ui/field';
import { cn } from '~/lib/cn';

const MIN = 20;
const MAX = 800;

interface MessageEditorProps {
  message: string | null;
  editable: boolean;
  saving: boolean;
  onSave: (message: string) => void;
}

export function MessageEditor({ message, editable, saving, onSave }: MessageEditorProps) {
  const [draft, setDraft] = useState(message ?? '');
  const [base, setBase] = useState(message);
  const [copied, setCopied] = useState(false);

  if (message !== base) {
    if (draft === (base ?? '')) setDraft(message ?? '');
    setBase(message);
  }

  const dirty = draft !== (message ?? '');

  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), 1400);
    return () => window.clearTimeout(timer);
  }, [copied]);

  if (!message) {
    return <p className="text-small text-text-3">The draft appears when the agent finishes.</p>;
  }

  const length = draft.trim().length;
  const invalid = length < MIN || length > MAX;

  if (!editable) {
    return (
      <div className="flex flex-col gap-3">
        <p className="rounded-md bg-surface-2 p-3 text-small whitespace-pre-wrap text-text">
          {message}
        </p>
        <Button
          size="sm"
          className="w-fit"
          onClick={async () => {
            await navigator.clipboard.writeText(message);
            setCopied(true);
          }}
        >
          <AppIcon name={copied ? 'common.check' : 'common.copy'} size={16} />
          {copied ? 'Copied' : 'Copy message'}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <Textarea
        aria-label="Customer message draft"
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        invalid={dirty && invalid}
        className="min-h-40"
      />
      <div className="flex items-center justify-between gap-3">
        <span className={cn('tabular text-caption', invalid ? 'text-danger' : 'text-text-3')}>
          {length} / {MAX}
        </span>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="ghost"
            disabled={!dirty || saving}
            onClick={() => setDraft(message)}
          >
            Reset
          </Button>
          <Button
            size="sm"
            variant="primary"
            disabled={!dirty || invalid}
            loading={saving}
            loadingLabel="Saving…"
            onClick={() => onSave(draft.trim())}
          >
            Save edit
          </Button>
        </div>
      </div>
    </div>
  );
}
