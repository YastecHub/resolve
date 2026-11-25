import { Toaster as Sonner } from 'sonner';
import { useTheme } from '~/lib/theme';

export function Toaster() {
  const { resolved } = useTheme();
  return (
    <Sonner
      theme={resolved}
      position="bottom-right"
      className="ui-zoom"
      toastOptions={{
        classNames: {
          toast:
            '!rounded-lg !border !border-border !bg-surface !text-text !shadow-pop !text-small',
          description: '!text-text-2',
          actionButton: '!bg-accent !text-accent-contrast',
        },
      }}
    />
  );
}
