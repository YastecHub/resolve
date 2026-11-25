import { AppIcon } from '~/components/app-icon';
import { ICONS, ICON_SIZES, type IconKey } from '~/lib/icons';

const GROUPS = ['nav', 'type', 'provider', 'trace', 'common'] as const;

export default function IconShowcase() {
  const keys = Object.keys(ICONS) as IconKey[];

  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-10 px-6 py-10">
      <header className="flex flex-col gap-1">
        <h1 className="text-h1">Icons</h1>
        <p className="text-text-2">
          Mode: {import.meta.env.VITE_ICONS_MODE === 'offline' ? 'offline bundle' : 'Iconify API'}
        </p>
      </header>

      <section className="flex flex-col gap-4">
        <h2 className="text-h2">Sizes</h2>
        <div className="flex items-end gap-6 text-text">
          {ICON_SIZES.map((size) => (
            <div key={size} className="flex flex-col items-center gap-2">
              <AppIcon name="trace.model" size={size} />
              <code className="text-text-3">{size}</code>
            </div>
          ))}
        </div>
      </section>

      {GROUPS.map((group) => (
        <section key={group} className="flex flex-col gap-4">
          <h2 className="text-h2 capitalize">{group}</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {keys
              .filter((key) => key.startsWith(`${group}.`))
              .map((key) => (
                <div
                  key={key}
                  className="flex items-center gap-3 rounded-lg border border-border bg-surface px-4 py-3"
                >
                  <AppIcon name={key} size={20} className="text-text" />
                  <code className="text-text-2">{key}</code>
                </div>
              ))}
          </div>
        </section>
      ))}

      <section className="flex flex-col gap-4">
        <h2 className="text-h2">Color follows text</h2>
        <div className="flex gap-4">
          <AppIcon name="common.shield_check" size={24} className="text-success" />
          <AppIcon name="common.warning" size={24} className="text-warning" />
          <AppIcon name="trace.error" size={24} className="text-danger" />
          <AppIcon name="common.info" size={24} className="text-info" />
          <AppIcon name="common.sparkle" size={24} className="text-accent" />
        </div>
      </section>
    </main>
  );
}
