import { cn } from '../lib';

interface StatProps {
  label: string;
  value: string;
  /** Unidad pequeña junto a la cifra: "kg", "min", "sesiones". */
  unit?: string;
  /** Una nota debajo: "+2,5 kg esta semana". */
  note?: string;
  className?: string;
}

/**
 * Una cifra con su etiqueta: lo que el usuario mira de un vistazo. La etiqueta
 * y la unidad van en monoespaciada; la cifra, grande y con los dígitos a igual
 * ancho, para que no baile al cambiar.
 */
export function Stat({ label, value, unit, note, className }: StatProps) {
  return (
    <div className={cn('flex flex-col gap-1', className)}>
      <p className="eyebrow">{label}</p>
      <p className="flex items-baseline gap-1.5">
        <span className="numeric text-foreground text-4xl leading-none font-medium">{value}</span>
        {unit ? <span className="eyebrow normal-case">{unit}</span> : null}
      </p>
      {note ? <p className="text-muted text-sm">{note}</p> : null}
    </div>
  );
}
