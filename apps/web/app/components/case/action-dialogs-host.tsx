import type { ResolutionAction } from '@resolve/shared';
import { EscalateDialog, OverrideDialog } from './action-dialogs';

interface Props {
  overrideOpen: boolean;
  escalateOpen: boolean;
  onOverrideOpenChange: (open: boolean) => void;
  onEscalateOpenChange: (open: boolean) => void;
  overridePending: boolean;
  escalatePending: boolean;
  overrideError?: string;
  escalateError?: string;
  onOverride: (body: { action: ResolutionAction; reason: string }) => void;
  onEscalate: (reason: string) => void;
}

export function ActionDialogsHost({
  overrideOpen,
  escalateOpen,
  onOverrideOpenChange,
  onEscalateOpenChange,
  overridePending,
  escalatePending,
  overrideError,
  escalateError,
  onOverride,
  onEscalate,
}: Props) {
  return (
    <>
      <OverrideDialog
        open={overrideOpen}
        onOpenChange={onOverrideOpenChange}
        pending={overridePending}
        error={overrideError}
        onSubmit={onOverride}
      />
      <EscalateDialog
        open={escalateOpen}
        onOpenChange={onEscalateOpenChange}
        pending={escalatePending}
        error={escalateError}
        onSubmit={onEscalate}
      />
    </>
  );
}
