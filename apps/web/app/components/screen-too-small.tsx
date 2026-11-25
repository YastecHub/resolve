import { APP_NAME } from '@resolve/shared';
import { BrandTile } from '~/components/brand-mark';
import { useWindowWidth } from '~/lib/use-window-width';

export const MIN_WIDTH = 1024;

export function ScreenTooSmall() {
  const width = useWindowWidth();
  return (
    <div
      role="alert"
      className="screen-too-small fixed inset-0 z-100 hidden flex-col items-center justify-center gap-6 bg-bg p-8 text-center text-text"
    >
      <BrandTile size={56} />
      <div className="flex max-w-sm flex-col gap-2">
        <h1 className="text-h1">Use a larger screen</h1>
        <p className="text-body text-text-2">
          {APP_NAME} needs a screen at least {MIN_WIDTH} pixels wide to show cases, evidence and the
          reasoning trace clearly. Open it on a desktop, or make this window wider.
        </p>
        {width > 0 ? (
          <p className="tabular text-small text-text-3">This window is {width} pixels wide.</p>
        ) : null}
      </div>
    </div>
  );
}
