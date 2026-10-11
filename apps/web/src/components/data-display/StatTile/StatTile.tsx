import { type ReactNode } from 'react';
import { TrendingDown, TrendingUp, Minus } from 'lucide-react';
import { cn } from '@/utils/cn';

export interface StatTileProps {
  label: string;
  value: ReactNode;
  delta?: { value: string; direction: 'up' | 'down' | 'flat' };
  icon?: ReactNode;
  className?: string;
}

const deltaClasses = {
  up: 'text-success bg-success/10',
  down: 'text-danger bg-danger/10',
  flat: 'text-ink-soft bg-hover',
} as const;

export function StatTile({ label, value, delta, icon, className }: StatTileProps) {
  return (
    <div
      className={cn(
        'group relative flex flex-col gap-3 rounded-lg border border-border bg-surface p-5',
        'transition-[transform,box-shadow] duration-base ease-out hover:-translate-y-0.5 hover:shadow-md',
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <span className="text-xs font-semibold uppercase tracking-wide text-ink-soft">{label}</span>
        {icon && (
          <span
            className="flex h-9 w-9 items-center justify-center rounded-md bg-brand-gold-50 text-brand-gold-700 transition-transform duration-base ease-out group-hover:scale-110"
            aria-hidden="true"
          >
            {icon}
          </span>
        )}
      </div>

      <div className="flex items-end justify-between gap-3">
        <span className="font-display text-3xl font-semibold tracking-tight text-ink">{value}</span>

        {delta && (
          <span
            className={cn(
              'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-2xs font-semibold',
              deltaClasses[delta.direction],
            )}
          >
            {delta.direction === 'up' && <TrendingUp className="h-3 w-3" aria-hidden="true" />}
            {delta.direction === 'down' && <TrendingDown className="h-3 w-3" aria-hidden="true" />}
            {delta.direction === 'flat' && <Minus className="h-3 w-3" aria-hidden="true" />}
            {delta.value}
          </span>
        )}
      </div>
    </div>
  );
}
