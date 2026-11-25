import { APP_NAME } from '@resolve/shared';
import { BrandTile } from '~/components/brand-mark';
import { cn } from '~/lib/cn';

interface AppLoadingProps {
  fullscreen?: boolean;
  message?: string;
  className?: string;
}

export function AppLoading({
  fullscreen = true,
  message = 'Getting things ready',
  className,
}: AppLoadingProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        'flex flex-col items-center justify-center gap-8 bg-bg text-text',
        fullscreen ? 'min-h-dvh' : 'h-80 rounded-lg',
        className,
      )}
    >
      <div
        className="flex animate-rise flex-col items-center gap-8"
        style={{ animationDelay: '150ms' }}
      >
        <BrandTile size={72} animated />
        <div className="flex flex-col items-center gap-3">
          <span className="text-h3">{APP_NAME}</span>
          <span
            aria-hidden="true"
            className="sweep-edge block h-0.5 w-40 rounded-full bg-surface-3"
          />
          <span className="text-small text-text-3">{message}</span>
        </div>
      </div>
    </div>
  );
}
