import { useState } from 'react';
import { toast } from 'sonner';
import { Banner } from '~/components/ui/banner';
import { Button } from '~/components/ui/button';
import { Sheet } from '~/components/ui/sheet';
import { TYPE_LABELS } from '~/lib/labels';
import { formatPercent, shortId } from '~/lib/format';
import { useDemoEval, useDemoSubmit } from '~/api/hooks';
import { ApiError } from '@resolve/api-client';

function errorText(error: unknown) {
  return error instanceof ApiError ? error.message : 'Something went wrong on our side. Try again.';
}

interface DemoDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DemoDrawer({ open, onOpenChange }: DemoDrawerProps) {
  const [count, setCount] = useState(3);
  const [showEval, setShowEval] = useState(false);
  const submit = useDemoSubmit();
  const evaluation = useDemoEval(showEval);

  return (
    <>
      <Sheet
        open={open}
        onOpenChange={onOpenChange}
        title="Demo controls"
        description="Create disputes, watch the agent work, and check how it did."
      >
        <section className="flex flex-col gap-3">
          <h3 className="text-h3">Submit demo disputes</h3>
          <p className="text-small text-text-2">
            Each one is a synthetic dispute that the agent investigates live. Open Cases to watch
            them move.
          </p>
          <div className="flex items-center gap-3">
            <div className="flex items-center rounded-md border border-control-border">
              <Button
                variant="ghost"
                size="icon"
                aria-label="Fewer cases"
                disabled={count <= 1}
                onClick={() => setCount((value) => Math.max(1, value - 1))}
              >
                −
              </Button>
              <span className="tabular w-10 text-center text-body" aria-live="polite">
                {count}
              </span>
              <Button
                variant="ghost"
                size="icon"
                aria-label="More cases"
                disabled={count >= 12}
                onClick={() => setCount((value) => Math.min(12, value + 1))}
              >
                +
              </Button>
            </div>
            <Button
              variant="primary"
              loading={submit.isPending}
              loadingLabel="Submitting…"
              onClick={() =>
                submit.mutate(
                  { count },
                  {
                    onSuccess: ({ created }) =>
                      toast.success(
                        `${created} ${created === 1 ? 'case' : 'cases'} submitted. Watch them in Cases.`,
                      ),
                    onError: (error) => toast.error(errorText(error)),
                  },
                )
              }
            >
              Submit {count} {count === 1 ? 'case' : 'cases'}
            </Button>
          </div>
          <Button
            className="w-fit"
            disabled={submit.isPending}
            onClick={() =>
              submit.mutate(
                { all: true },
                {
                  onSuccess: ({ created }) =>
                    toast.success(`One of each type submitted (${created}).`),
                  onError: (error) => toast.error(errorText(error)),
                },
              )
            }
          >
            Submit one of each type
          </Button>
        </section>

        <section className="flex flex-col gap-3 border-t border-border pt-6">
          <h3 className="text-h3">Evaluate the agent</h3>
          <p className="text-small text-text-2">
            Compares what the agent decided with what each seeded case should produce.
          </p>
          <Button
            className="w-fit"
            loading={evaluation.isFetching}
            loadingLabel="Evaluating…"
            onClick={() => {
              if (showEval) void evaluation.refetch();
              else setShowEval(true);
            }}
          >
            Run evaluation
          </Button>
          {evaluation.data ? (
            <div className="flex flex-col gap-3">
              <Banner
                variant={evaluation.data.accuracy >= 0.9 ? 'success' : 'warning'}
                title={`${formatPercent(evaluation.data.accuracy)} matched`}
              >
                {evaluation.data.rows.filter((row) => row.match).length} of{' '}
                {evaluation.data.rows.length} finished cases matched the expected type and routing.
              </Banner>
              {evaluation.data.rows.some((row) => !row.match) ? (
                <ul className="flex flex-col divide-y divide-border rounded-md border border-border text-small">
                  {evaluation.data.rows
                    .filter((row) => !row.match)
                    .map((row) => (
                      <li key={row.disputeId} className="flex flex-col gap-0.5 px-3 py-2">
                        <span className="font-mono text-code text-text-2">
                          {shortId(row.disputeId)}
                        </span>
                        <span className="text-text">
                          Expected {TYPE_LABELS[row.expectedType]}, got{' '}
                          {row.actualType ? TYPE_LABELS[row.actualType] : 'no decision'}
                        </span>
                      </li>
                    ))}
                </ul>
              ) : null}
            </div>
          ) : null}
        </section>
      </Sheet>
    </>
  );
}
