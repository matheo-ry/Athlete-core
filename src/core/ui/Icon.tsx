import { ICONS } from './icon-registry';
import type { IconName } from './icon-registry';

interface IconProps {
  name: IconName;
  className?: string;
}

/** Icono decorativo: el texto que lo acompaña es el que lo explica. */
export function Icon({ name, className = 'size-5' }: IconProps) {
  const Glyph = ICONS[name];
  return <Glyph aria-hidden="true" className={className} />;
}
