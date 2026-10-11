import { type HTMLAttributes } from 'react';
import { cn } from '@/utils/cn';

export type BadgeVariant =
  'neutral' | 'success' | 'warning' | 'danger' | 'info' | 'brand' | 'accent' | 'outline';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: 'sm' | 'md';
}

const variantClasses: Record<BadgeVariant, string> = {
  neutral: 'bg-hover text-ink-soft',
  success: 'bg-success/10 text-success border border-success/20',
  warning: 'bg-brand-gold-50 text-brand-gold-700 border border-brand-gold-100',
  danger: 'bg-danger/10 text-danger border border-danger/20',
  info: 'bg-info/10 text-info border border-info/20',
  brand: 'bg-brand-gold-100 text-brand-gold-900 border border-brand-gold-300',
  accent: 'bg-accent-50 text-accent-700 border border-accent-100',
  outline: 'bg-transparent text-ink-soft border border-border',
};

const sizeClasses: Record<'sm' | 'md', string> = {
  sm: 'h-5 px-2 text-2xs',
  md: 'h-6 px-2.5 text-xs',
};

export function Badge({
  variant = 'neutral',
  size = 'md',
  className,
  children,
  ...rest
}: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 whitespace-nowrap rounded-full font-semibold',
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
      {...rest}
    >
      {children}
    </span>
  );
}
