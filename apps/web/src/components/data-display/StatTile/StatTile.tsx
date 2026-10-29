import { type ReactNode } from 'react';
import { TrendingDown, TrendingUp, Minus } from 'lucide-react';
import { cn } from '@/utils/cn';
import { useSpotlight } from '@/hooks/useSpotlight';
import { CornerBrackets } from '@/components/brand/CornerBrackets';

export interface StatTileProps {
  label: string;
  value: ReactNode;
  delta?: { value: string; direction: 'up' | 'down' | 'flat' };
  /** Linha de apoio abaixo do valor (ex.: "7 contas"), para valores longos como moeda. */
  hint?: ReactNode;
  icon?: ReactNode;
  /** Pede atenção: ponto dourado pulsando ao lado do rótulo. */
  attention?: boolean;
  className?: string;
}

const deltaClasses = {
  up: 'text-success bg-success/10',
  down: 'text-danger bg-danger/10',
  flat: 'text-ink-soft bg-hover',
} as const;

export function StatTile({
  label,
  value,
  delta,
  hint,
  icon,
  attention = false,
  className,
}: StatTileProps) {
  const spotlight = useSpotlight<HTMLDivElement>();

  return (
    <div
      onPointerMove={spotlight.onPointerMove}
      className={cn(
        'spotlight group flex flex-col gap-3 overflow-hidden rounded-lg border border-border bg-surface p-5 shadow-sm',
        'transition-[transform,box-shadow,border-color] duration-base ease-out',
        'hover:-translate-y-0.5 hover:border-brand-gold-300/60 hover:shadow-md',
        className,
      )}
    >
      <CornerBrackets className="opacity-0 transition-opacity duration-base group-hover:opacity-100 [&>span]:h-3 [&>span]:w-3 [&>span]:rounded-none" />

      <div className="flex items-start justify-between gap-3">
        <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-ink-soft">
          {attention && (
            <span aria-hidden="true" className="relative flex h-2 w-2">
              <span className="absolute inset-0 animate-ping-soft rounded-full bg-brand-gold-300" />
              <span className="relative h-2 w-2 rounded-full bg-brand-gold-500" />
            </span>
          )}
          {label}
        </span>
        {icon && (
          <span
            className="flex h-9 w-9 items-center justify-center rounded-md bg-brand-gold-50 text-brand-gold-700 ring-1 ring-inset ring-brand-gold-100 transition-transform duration-base ease-spring group-hover:-rotate-6 group-hover:scale-110"
            aria-hidden="true"
          >
            {icon}
          </span>
        )}
      </div>

      <div className="flex items-end justify-between gap-3">
        <span className="min-w-0 truncate font-display text-3xl font-semibold tabular-nums tracking-tight text-ink">
          {value}
        </span>

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
      {hint && <div className="-mt-1 text-xs text-ink-soft">{hint}</div>}

      {/* Régua de medida na base: se desenha ao montar, acende no hover. */}
      <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-0.5 bg-border/60">
        <div className="h-full origin-left animate-grow-x bg-gradient-to-r from-brand-gold-500/70 via-brand-gold-300/50 to-transparent transition-opacity duration-base group-hover:from-brand-gold-500 group-hover:via-brand-gold-300" />
      </div>
    </div>
  );
}
