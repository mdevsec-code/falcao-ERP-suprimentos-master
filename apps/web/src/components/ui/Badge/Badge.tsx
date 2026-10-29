import { type HTMLAttributes } from 'react';
import { cn } from '@/utils/cn';

export type BadgeVariant =
  'neutral' | 'success' | 'warning' | 'danger' | 'info' | 'brand' | 'accent' | 'outline';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: 'sm' | 'md';
  /** Ponto de status antes do texto. Padrão: ligado nas variantes de estado. */
  dot?: boolean;
}

const variantClasses: Record<BadgeVariant, string> = {
  neutral: 'bg-hover text-ink-soft ring-border',
  success: 'bg-success/10 text-success ring-success/25',
  warning: 'bg-brand-gold-50 text-brand-gold-700 ring-brand-gold-300/50',
  danger: 'bg-danger/10 text-danger ring-danger/25',
  info: 'bg-info/10 text-info ring-info/25',
  brand: 'bg-brand-gold-100 text-brand-gold-900 ring-brand-gold-300',
  accent: 'bg-accent-50 text-accent-700 ring-accent-100',
  outline: 'bg-transparent text-ink-soft ring-border',
};

const dotClasses: Partial<Record<BadgeVariant, string>> = {
  success: 'bg-success',
  warning: 'bg-brand-gold-500',
  danger: 'bg-danger',
  info: 'bg-info',
  brand: 'bg-brand-gold-700',
};

const sizeClasses: Record<'sm' | 'md', string> = {
  sm: 'h-5 px-2 text-2xs gap-1.5',
  md: 'h-6 px-2.5 text-xs gap-1.5',
};

export function Badge({
  variant = 'neutral',
  size = 'md',
  dot,
  className,
  children,
  ...rest
}: BadgeProps) {
  const dotColor = dotClasses[variant];
  const showDot = dot ?? Boolean(dotColor);
  return (
    <span
      className={cn(
        'inline-flex items-center whitespace-nowrap rounded-full font-semibold tracking-[0.01em] ring-1 ring-inset',
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
      {...rest}
    >
      {showDot && (
        <span
          aria-hidden="true"
          className={cn('h-1.5 w-1.5 shrink-0 rounded-full', dotColor ?? 'bg-current')}
        />
      )}
      {children}
    </span>
  );
}
