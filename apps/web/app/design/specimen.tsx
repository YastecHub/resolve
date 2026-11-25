import { createContext, useContext, type ReactNode } from 'react';
import { cn } from '~/lib/cn';

export const CompareContext = createContext(false);

interface SpecimenProps {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}

export function Specimen({
  title,
  description,
  children,
  className,
  bodyClassName,
}: SpecimenProps) {
  const compare = useContext(CompareContext);
  const body = cn('flex flex-wrap items-start gap-4', bodyClassName);

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      <div className="flex flex-col gap-0.5">
        <h3 className="text-h3">{title}</h3>
        {description ? <p className="text-small text-text-3">{description}</p> : null}
      </div>
      {compare ? (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {(['light', 'dark'] as const).map((theme) => (
            <div
              key={theme}
              className={cn(
                theme,
                'flex flex-col gap-3 rounded-lg border border-border bg-bg p-5 text-text',
              )}
            >
              <span className="text-caption text-text-3 capitalize">{theme}</span>
              <div className={body}>{children}</div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-border bg-bg p-5">
          <div className={body}>{children}</div>
        </div>
      )}
    </div>
  );
}

export function DesignSection({
  id,
  title,
  description,
  children,
}: {
  id: string;
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="flex scroll-mt-20 flex-col gap-6">
      <header className="flex flex-col gap-1 border-b border-border pb-4">
        <h2 className="font-display text-h1 font-bold">{title}</h2>
        {description ? <p className="text-text-2">{description}</p> : null}
      </header>
      <div className="flex flex-col gap-8">{children}</div>
    </section>
  );
}
