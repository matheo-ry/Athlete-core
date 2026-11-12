import {
  CalendarDays,
  ChartLine,
  ClipboardList,
  Dumbbell,
  House,
  LayoutTemplate,
  Settings,
  User,
  Users,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

// Los módulos piden sus iconos por nombre en el manifest. Así ningún módulo
// depende de la librería de iconos y solo se empaquetan los que están aquí.
// Para usar un icono nuevo, añádelo a esta lista.
export const ICONS = {
  calendar: CalendarDays,
  chart: ChartLine,
  clipboard: ClipboardList,
  dumbbell: Dumbbell,
  home: House,
  settings: Settings,
  template: LayoutTemplate,
  user: User,
  users: Users,
} as const satisfies Record<string, LucideIcon>;

export type IconName = keyof typeof ICONS;
