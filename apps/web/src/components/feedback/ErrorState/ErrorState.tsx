import { type ReactNode } from 'react';
import { AlertCircle } from 'lucide-react';
import { cn } from '@/utils/cn';

export interface ErrorStateProps {
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function ErrorState({ title, description, action, className }: ErrorStateProps) {
  return (
    <div
      role="alert"
      className={cn(
        'flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-danger/30 bg-danger/[0.03]',
        'animate-fade-in px-6 py-14 text-center',
        className,
      )}
    >
      <div
        className="flex h-12 w-12 animate-pop-in items-center justify-center rounded-full bg-danger/10 text-danger ring-1 ring-inset ring-danger/20"
        aria-hidden="true"
      >
        <AlertCircle className="h-6 w-6" />
      </div>
      <div className="space-y-1">
        <h3 className="font-display text-xl font-semibold text-ink">{title}</h3>
        {description && <p className="mx-auto max-w-sm text-sm text-ink-soft">{description}</p>}
      </div>
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
