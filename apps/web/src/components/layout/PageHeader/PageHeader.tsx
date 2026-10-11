import { type ReactNode } from 'react';
import { cn } from '@/utils/cn';

export interface PageHeaderProps {
  title: string;
  description?: string;
  eyebrow?: string;
  actions?: ReactNode;
  className?: string;
}

export function PageHeader({ title, description, eyebrow, actions, className }: PageHeaderProps) {
  return (
    <header
      className={cn(
        'flex flex-col gap-4 border-b border-border bg-bg px-6 py-6 sm:flex-row sm:items-end sm:justify-between sm:px-8 sm:py-7',
        className,
      )}
    >
      <div className="space-y-1">
        {eyebrow && (
          <p className="font-mono text-2xs uppercase tracking-[0.14em] text-brand-gold-700">
            {eyebrow}
          </p>
        )}
        <h1 className="font-display text-3xl font-semibold tracking-tight text-ink">{title}</h1>
        {description && <p className="max-w-2xl text-sm text-ink-soft">{description}</p>}
      </div>

      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}
