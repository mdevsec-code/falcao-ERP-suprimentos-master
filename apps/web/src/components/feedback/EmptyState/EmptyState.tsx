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
        'flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border bg-surface/60',
        'animate-fade-in px-6 py-14 text-center',
        className,
      )}
    >
      {icon && (
        <div
          className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-gold-50 text-brand-gold-700"
          aria-hidden="true"
        >
          {icon}
        </div>
      )}

      <div className="space-y-1">
        <h3 className="font-display text-xl font-semibold text-ink">{title}</h3>
        {description && <p className="mx-auto max-w-sm text-sm text-ink-soft">{description}</p>}
      </div>

      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
