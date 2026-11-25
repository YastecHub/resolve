import { useState } from 'react';
import { Field, Input } from '~/components/ui/field';
import { RadioGroup, RadioItem, Slider, Switch } from '~/components/ui/form-controls';
import { SectionCard } from '~/components/ui/section-card';
import { Button } from '~/components/ui/button';
import { DesignSection, Specimen } from './specimen';

export function SettingsControls() {
  const [threshold, setThreshold] = useState(90);
  const [mode, setMode] = useState('execute');
  const [notify, setNotify] = useState(true);

  return (
    <DesignSection
      id="settings"
      title="Form patterns"
      description="The auto-resolve policy form, assembled from the controls above."
    >
      <Specimen title="Switch, slider and radio" bodyClassName="w-full max-w-xl flex-col">
        <SectionCard
          title="Auto-resolve policy"
          description="Applies to every new investigation."
          className="w-full"
        >
          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between text-small">
                <span className="text-text-2">Confidence threshold</span>
                <span className="tabular text-text">{threshold}%</span>
              </div>
              <Slider
                aria-label="Confidence threshold"
                min={50}
                max={100}
                step={1}
                value={[threshold]}
                onValueChange={([value]) => setThreshold(value ?? 90)}
              />
            </div>
            <Field label="Value limit (₦)">
              {({ id }) => (
                <Input id={id} inputMode="numeric" defaultValue="50,000" className="tabular w-40" />
              )}
            </Field>
            <div className="flex flex-col gap-2">
              <span className="text-caption text-text-2">Execution</span>
              <RadioGroup value={mode} onValueChange={setMode} aria-label="Execution mode">
                <RadioItem id="mode-execute" value="execute" label="Execute resolutions" />
                <RadioItem id="mode-recommend" value="recommend_only" label="Recommend only" />
              </RadioGroup>
            </div>
            <label className="flex items-center justify-between gap-4 text-small">
              <span className="text-text-2">Draft a customer message for every case</span>
              <Switch
                checked={notify}
                onCheckedChange={setNotify}
                aria-label="Draft customer messages"
              />
            </label>
            <div className="flex justify-end gap-2">
              <Button variant="ghost">Reset</Button>
              <Button variant="primary">Save changes</Button>
            </div>
          </div>
        </SectionCard>
      </Specimen>
    </DesignSection>
  );
}
