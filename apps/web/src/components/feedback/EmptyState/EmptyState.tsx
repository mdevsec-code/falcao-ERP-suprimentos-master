import { type ReactNode } from 'react';
import { cn } from '@/utils/cn';

export interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'relative isolate flex flex-col items-center justify-center gap-3 overflow-hidden rounded-lg border border-dashed border-border bg-surface/60',
        'animate-fade-in px-6 py-14 text-center',
        className,
      )}
    >
      {icon && (
        // Ícone num "alvo" de prancha: círculo tracejado girando devagar.
        <div className="relative flex h-16 w-16 items-center justify-center" aria-hidden="true">
          <svg
            viewBox="0 0 64 64"
            className="absolute inset-0 h-full w-full text-brand-gold-300 motion-safe:animate-[spin_24s_linear_infinite]"
          >
            <circle
              cx="32"
              cy="32"
              r="30"
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
              strokeDasharray="3 5"
            />
          </svg>
          <div className="flex h-12 w-12 animate-pop-in items-center justify-center rounded-full bg-brand-gold-50 text-brand-gold-700 ring-1 ring-inset ring-brand-gold-100">
            {icon}
          </div>
        </div>
      )}

      <div className="animate-rise space-y-1 [animation-delay:60ms]">
        <h3 className="font-display text-xl font-semibold text-ink">{title}</h3>
        {description && <p className="mx-auto max-w-sm text-sm text-ink-soft">{description}</p>}
      </div>

      {action && <div className="mt-2 animate-rise [animation-delay:120ms]">{action}</div>}
    </div>
  );
}
