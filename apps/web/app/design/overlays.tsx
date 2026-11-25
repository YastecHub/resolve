import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { CommandPalette, PaletteList, type PaletteItem } from '~/components/command-palette';
import { ProviderPill, type ProviderProfile } from '~/components/provider-pill';
import { Button } from '~/components/ui/button';
import { Dialog } from '~/components/ui/dialog';
import { DialogGallery, EscalateForm, LongBody, OverrideForm } from './dialog-gallery';
import { Kbd } from '~/components/ui/kbd';
import { Tooltip, TooltipBubble } from '~/components/ui/tooltip';
import { AppIcon } from '~/components/app-icon';
import { UserMenuPanel } from '~/components/shell/user-menu';
import type { ThemePreference } from '~/lib/theme';
import { HOUR, NOW } from './sample';
import { DesignSection, Specimen } from './specimen';

export const PROFILES: readonly ProviderProfile[] = [
  { name: 'onprem', kind: 'onprem', model: 'qwen2.5-72b' },
  { name: 'hosted', kind: 'hosted', model: 'anthropic/claude' },
];

export const PALETTE_ITEMS: readonly PaletteItem[] = [
  { id: 'overview', label: 'Go to Overview', icon: 'nav.overview', group: 'Navigation' },
  { id: 'cases', label: 'Go to Cases', icon: 'nav.cases', group: 'Navigation', hint: 'G C' },
  { id: 'audit', label: 'Go to Audit', icon: 'nav.audit', group: 'Navigation' },
  { id: 'settings', label: 'Go to Settings', icon: 'nav.settings', group: 'Navigation' },
  {
    id: 'case-1',
    label: 'dsp_…7F2A · Unauthorised · ₦240,000.00',
    icon: 'type.unauthorised',
    group: 'Cases',
  },
  {
    id: 'case-2',
    label: 'dsp_…3C91 · Failed transfer · ₦12,500.00',
    icon: 'type.failed_transfer',
    group: 'Cases',
  },
  { id: 'theme', label: 'Toggle theme', icon: 'common.moon', group: 'Actions' },
  { id: 'demo', label: 'Submit demo cases', icon: 'nav.demo', group: 'Actions' },
];

export function Overlays() {
  const [dialog, setDialog] = useState<
    'override' | 'hosted' | 'escalate' | 'reject' | 'long' | null
  >(null);
  const [palette, setPalette] = useState(false);
  const [theme, setTheme] = useState<ThemePreference>('system');

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setPalette((open) => !open);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <DesignSection
      id="overlays"
      title="Overlays and feedback"
      description="Tooltips, dialogs, popovers, toasts and the command palette."
    >
      <Specimen
        title="Tooltip"
        description="Inverted so it stands apart from cards: dark in light mode, light in dark mode. 300 ms delay, then instant while moving between triggers. Hover or focus these."
      >
        <Tooltip content="Customer data stays inside your infrastructure.">
          <Button>Default</Button>
        </Tooltip>
        <Tooltip content="Approve the recommendation" shortcut={['A']}>
          <Button variant="primary">With shortcut</Button>
        </Tooltip>
        <Tooltip title="On-premise model" content="Customer data stays inside your infrastructure.">
          <Button>With title</Button>
        </Tooltip>
        <Tooltip content="Search or jump to…" shortcut={['⌘', 'K']} side="bottom">
          <Button size="icon" aria-label="Search">
            <AppIcon name="common.search" size={20} />
          </Button>
        </Tooltip>
        <Tooltip content="Only analysts can act on a case.">
          <span tabIndex={0} className="inline-flex">
            <Button variant="primary" disabled>
              Disabled action
            </Button>
          </span>
        </Tooltip>
      </Specimen>
      <Specimen title="Tooltip placements">
        {(['top', 'right', 'bottom', 'left'] as const).map((side) => (
          <Tooltip key={side} content={`Opens on the ${side}`} side={side}>
            <Button className="capitalize">{side}</Button>
          </Tooltip>
        ))}
      </Specimen>
      <Specimen
        title="Tooltip gallery"
        description="Static previews of each shape, no hovering needed."
        bodyClassName="items-end gap-6 pb-4"
      >
        <TooltipBubble arrow content="Copy dsp_…7F2A" />
        <TooltipBubble arrow content="Approve the recommendation" shortcut={['A']} />
        <TooltipBubble
          arrow
          title="Resolution window"
          content="72 hours for failed PoS and web disputes."
        />
        <TooltipBubble arrow content="Search or jump to…" shortcut={['⌘', 'K']} />
      </Specimen>
      <Specimen
        title="Dialog"
        description="Focus is trapped, Esc closes, focus returns to the trigger. Below 768px dialogs become bottom sheets."
      >
        <Button onClick={() => setDialog('override')}>Override</Button>
        <Button onClick={() => setDialog('hosted')}>Hosted warning</Button>
        <Button onClick={() => setDialog('escalate')}>Escalate</Button>
        <Button onClick={() => setDialog('reject')}>Reject</Button>
        <Button onClick={() => setDialog('long')}>Long content</Button>
        <Dialog
          open={dialog === 'override'}
          onOpenChange={(open) => !open && setDialog(null)}
          title="Override the agent"
          description="Tell us why. This goes in the audit trail."
          actions={
            <>
              <Button variant="ghost" onClick={() => setDialog(null)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={() => setDialog(null)}>
                Override
              </Button>
            </>
          }
        >
          <OverrideForm />
        </Dialog>
        <Dialog
          open={dialog === 'hosted'}
          onOpenChange={(open) => !open && setDialog(null)}
          tone="warning"
          size="sm"
          title="Switch to a hosted model?"
          description="Masked case data will be sent to the model provider through AI Gateway."
          actions={
            <>
              <Button variant="ghost" onClick={() => setDialog(null)}>
                Keep on-premise
              </Button>
              <Button variant="primary" onClick={() => setDialog(null)}>
                Switch to hosted
              </Button>
            </>
          }
        />
        <Dialog
          open={dialog === 'escalate'}
          onOpenChange={(open) => !open && setDialog(null)}
          tone="info"
          title="Send to a senior analyst"
          description="They will see the full trace and your note."
          actions={
            <>
              <Button variant="ghost" onClick={() => setDialog(null)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={() => setDialog(null)}>
                Escalate
              </Button>
            </>
          }
        >
          <EscalateForm />
        </Dialog>
        <Dialog
          open={dialog === 'reject'}
          onOpenChange={(open) => !open && setDialog(null)}
          tone="danger"
          size="sm"
          title="Reject this dispute?"
          description="The customer will be told the transaction stands. This is recorded in the audit trail."
          actions={
            <>
              <Button variant="ghost" onClick={() => setDialog(null)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={() => setDialog(null)}>
                Reject dispute
              </Button>
            </>
          }
        />
        <Dialog
          open={dialog === 'long'}
          onOpenChange={(open) => !open && setDialog(null)}
          size="lg"
          title="Case file"
          description="The header and footer stay put while the body scrolls."
          actions={
            <Button variant="primary" onClick={() => setDialog(null)}>
              Done
            </Button>
          }
        >
          <LongBody />
        </Dialog>
      </Specimen>
      <DialogGallery />
      <Specimen
        title="ProviderPill"
        description="Always visible in the topbar. Click for the profile list."
      >
        <ProviderPill active={PROFILES[0]!} profiles={PROFILES} />
        <ProviderPill active={PROFILES[1]!} profiles={PROFILES} />
      </Specimen>
      <Specimen
        title="User tray"
        description="Opens from the avatar in the topbar. Static preview here; the live one is in the shell preview."
      >
        <div className="w-88 rounded-xl border border-border bg-surface p-4 shadow-pop">
          <UserMenuPanel
            user={{
              email: 'ada.okafor@bank.example',
              role: 'admin',
              authMode: 'access',
              signedInAt: NOW - 3 * HOUR,
            }}
            preference={theme}
            onThemeChange={setTheme}
            onSignOut={() => undefined}
            now={NOW}
          />
        </div>
        <div className="w-88 rounded-xl border border-border bg-surface p-4 shadow-pop">
          <UserMenuPanel
            user={{ email: 'dev@local', role: 'analyst', authMode: 'dev' }}
            preference={theme}
            onThemeChange={setTheme}
            onSignOut={() => undefined}
          />
        </div>
      </Specimen>
      <Specimen title="Toasts" description="Bottom right, with undo where it helps.">
        <Button onClick={() => toast.success('Done. The customer message is ready to send.')}>
          Success
        </Button>
        <Button onClick={() => toast.error('Something went wrong on our side. Try again.')}>
          Error
        </Button>
        <Button onClick={() => toast.info('Switched to the hosted model.')}>Info</Button>
        <Button
          onClick={() =>
            toast('Case escalated.', { action: { label: 'Undo', onClick: () => undefined } })
          }
        >
          With undo
        </Button>
      </Specimen>
      <Specimen
        title="Command palette"
        description="Press ⌘K anywhere on this page, or use the button."
      >
        <Button onClick={() => setPalette(true)}>
          Open palette <Kbd>⌘</Kbd>
          <Kbd>K</Kbd>
        </Button>
        <div className="w-full max-w-xl overflow-hidden rounded-xl border border-border bg-surface shadow-pop">
          <PaletteList items={PALETTE_ITEMS} />
        </div>
        <CommandPalette open={palette} onOpenChange={setPalette} items={PALETTE_ITEMS} />
      </Specimen>
    </DesignSection>
  );
}
