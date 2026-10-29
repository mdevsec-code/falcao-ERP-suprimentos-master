import { type ReactNode } from 'react';
import { type LucideIcon } from 'lucide-react';
import { cn } from '@/utils/cn';

export interface InfoTileProps {
  icon: LucideIcon;
  label: string;
  value: ReactNode;
  className?: string;
}

/** Bloco rótulo/valor das telas de detalhe — mesmo ícone dourado do `StatTile`. */
export function InfoTile({ icon: Icon, label, value, className }: InfoTileProps) {
  return (
    <div
      className={cn(
        'group flex items-start gap-3 rounded-lg border border-border bg-surface p-4 shadow-sm',
        'transition-[box-shadow,border-color] duration-base hover:border-brand-gold-300/50 hover:shadow-md',
        className,
      )}
    >
      <span
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-brand-gold-50 text-brand-gold-700 ring-1 ring-inset ring-brand-gold-100 transition-transform duration-base ease-spring group-hover:-rotate-6"
        aria-hidden="true"
      >
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0">
        <p className="text-2xs font-semibold uppercase tracking-wide text-ink-soft">{label}</p>
        <div className="mt-0.5 break-words text-sm font-medium text-ink">{value}</div>
      </div>
    </div>
  );
}
