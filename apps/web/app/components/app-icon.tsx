import { IconRenderer } from '~/components/icon-renderer';
import { iconName, type IconKey, type IconSize } from '~/lib/icons';
import { cn } from '~/lib/cn';

interface AppIconProps {
  name: IconKey;
  size?: IconSize;
  className?: string;
  label?: string;
}

export function AppIcon({ name, size = 16, className, label }: AppIconProps) {
  return (
    <IconRenderer
      icon={iconName(name)}
      width={size}
      height={size}
      className={cn('shrink-0', className)}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      role={label ? 'img' : undefined}
    />
  );
}
