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
        'flex items-start gap-3 rounded-lg border border-border bg-surface p-4',
        'transition-shadow duration-base hover:shadow-sm',
        className,
      )}
    >
      <span
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-brand-gold-50 text-brand-gold-700"
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
