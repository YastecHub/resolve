import { useState } from 'react';
import { AppIcon } from '~/components/app-icon';
import { Button } from '~/components/ui/button';
import { Field, Input, Textarea } from '~/components/ui/field';
import { Kbd } from '~/components/ui/kbd';
import { SegmentedControl } from '~/components/ui/segmented-control';
import { DesignSection, Specimen } from './specimen';

const PROFILE_OPTIONS = [
  { value: 'hosted', label: 'Hosted', icon: 'provider.hosted' },
  { value: 'onprem', label: 'On-premise', icon: 'provider.onprem' },
] as const;

const DENSITY_OPTIONS = [
  { value: 'comfortable', label: 'Comfortable' },
  { value: 'compact', label: 'Compact' },
] as const;

export function Controls() {
  const [profile, setProfile] = useState<(typeof PROFILE_OPTIONS)[number]['value']>('onprem');
  const [density, setDensity] = useState<(typeof DENSITY_OPTIONS)[number]['value']>('comfortable');

  return (
    <DesignSection
      id="controls"
      title="Buttons and controls"
      description="36px default height, 32px compact, radius md."
    >
      <Specimen title="Buttons">
        <Button variant="primary">Approve</Button>
        <Button>Override</Button>
        <Button variant="ghost">Escalate</Button>
        <Button variant="destructive">Reject dispute</Button>
        <Button variant="primary" size="sm">
          Compact
        </Button>
        <Button size="icon" aria-label="Search">
          <AppIcon name="common.search" size={20} />
        </Button>
      </Specimen>
      <Specimen
        title="Button states"
        description="Loading shows a spinner and the verb of the action, never a bare spinner. The button never shrinks while loading. Disabled drops to 50% opacity."
      >
        <Button variant="primary" loading loadingLabel="Approving…">
          Approve
        </Button>
        <Button loading loadingLabel="Saving…">
          Save changes
        </Button>
        <Button variant="primary" size="sm" loading loadingLabel="Trying…">
          Try again
        </Button>
        <Button size="sm" loading loadingLabel="Testing…">
          Test connection
        </Button>
        <Button variant="destructive" loading loadingLabel="Rejecting…">
          Reject dispute
        </Button>
        <Button variant="primary" loading>
          Submit demo cases
        </Button>
        <Button size="icon" loading aria-label="Refreshing" />
        <Button variant="primary" disabled>
          Approve
        </Button>
        <Button disabled>Override</Button>
        <Button variant="primary">
          <AppIcon name="common.sparkle" size={16} />
          With icon
          <Kbd className="border-transparent bg-accent-contrast/15 text-accent-contrast">A</Kbd>
        </Button>
      </Specimen>
      <Specimen title="Inputs" bodyClassName="w-full max-w-md flex-col">
        <Field label="Search" hint="Id, reference or customer.">
          {({ id, describedBy, invalid }) => (
            <Input id={id} aria-describedby={describedBy} invalid={invalid} placeholder="dsp_…" />
          )}
        </Field>
        <Field label="Value limit" error="Enter an amount above zero.">
          {({ id, describedBy, invalid }) => (
            <Input id={id} aria-describedby={describedBy} invalid={invalid} defaultValue="0" />
          )}
        </Field>
        <Field label="Focused (forced for review)" hint="Real inputs show this on focus.">
          {({ id, describedBy }) => (
            <Input
              id={id}
              aria-describedby={describedBy}
              defaultValue="dsp_01J8K2M4"
              className="border-accent ring-3 ring-accent/25"
            />
          )}
        </Field>
        <Field label="Focused with error (forced for review)" error="Enter an amount above zero.">
          {({ id, describedBy, invalid }) => (
            <Input
              id={id}
              aria-describedby={describedBy}
              invalid={invalid}
              defaultValue="0"
              className="ring-3 ring-danger/25"
            />
          )}
        </Field>
        <Field label="Disabled">
          {({ id }) => <Input id={id} disabled defaultValue="Read only for non-admins" />}
        </Field>
        <Field label="Customer message">
          {({ id }) => <Textarea id={id} defaultValue="Hi Ada, we have reversed the debit." />}
        </Field>
      </Specimen>
      <Specimen
        title="Segmented control"
        description="Arrow keys move the selection. Thumb slides in 180 ms."
      >
        <SegmentedControl
          label="Model location"
          options={PROFILE_OPTIONS}
          value={profile}
          onChange={setProfile}
        />
        <SegmentedControl
          label="Density"
          options={DENSITY_OPTIONS}
          value={density}
          onChange={setDensity}
        />
      </Specimen>
      <Specimen title="Keyboard hints">
        <span className="flex items-center gap-2 text-small text-text-2">
          Open command palette <Kbd>⌘</Kbd>
          <Kbd>K</Kbd>
        </span>
        <span className="flex items-center gap-2 text-small text-text-2">
          Next case <Kbd>J</Kbd>
        </span>
        <span className="flex items-center gap-2 text-small text-text-2">
          Approve <Kbd>A</Kbd>
        </span>
      </Specimen>
    </DesignSection>
  );
}
