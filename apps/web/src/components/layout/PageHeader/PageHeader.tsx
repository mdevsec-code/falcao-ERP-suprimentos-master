import { type ReactNode } from 'react';
import { cn } from '@/utils/cn';

export interface PageHeaderProps {
  title: string;
  description?: string;
  eyebrow?: string;
  actions?: ReactNode;
  className?: string;
}

/**
 * Cabeçalho de página como o carimbo de uma prancha: malha milimetrada
 * esmaecendo à direita e uma régua dourada que se desenha sob o título ao
 * abrir a tela — a única animação de entrada "de palco" da página.
 */
export function PageHeader({ title, description, eyebrow, actions, className }: PageHeaderProps) {
  return (
    <header
      className={cn(
        'relative isolate overflow-hidden border-b border-border bg-bg px-6 py-6 sm:px-8 sm:py-8',
        className,
      )}
    >
      <div
        aria-hidden="true"
        className="blueprint-grid pointer-events-none absolute inset-y-0 right-0 -z-10 w-2/3 [mask-image:linear-gradient(to_left,black,transparent)] motion-safe:animate-grid-pan"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-24 -top-24 -z-10 h-64 w-64 rounded-full bg-brand-gold-300/10 blur-3xl"
      />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0 flex-1 space-y-1.5">
          {eyebrow && (
            <p className="flex items-center gap-2 font-mono text-2xs uppercase tracking-[0.14em] text-brand-gold-700">
              <span
                aria-hidden="true"
                className="h-1.5 w-1.5 rotate-45 bg-brand-gold-300 motion-safe:animate-pop-in"
              />
              {eyebrow}
            </p>
          )}
          <h1 className="animate-rise font-display text-3xl font-semibold tracking-tight text-ink lg:text-4xl">
            {title}
          </h1>
          <div
            aria-hidden="true"
            className="h-[3px] w-28 origin-left animate-grow-x rounded-full bg-gradient-to-r from-brand-gold-300 via-brand-gold-500 to-brand-gold-500/0 [animation-delay:120ms]"
          />
          {description && (
            <p className="max-w-2xl animate-rise text-sm text-ink-soft [animation-delay:80ms]">
              {description}
            </p>
          )}
        </div>

        {actions && (
          <div className="flex animate-rise flex-wrap items-center gap-2 [animation-delay:140ms] sm:justify-end lg:shrink-0 lg:flex-nowrap">
            {actions}
          </div>
        )}
      </div>
    </header>
  );
}
