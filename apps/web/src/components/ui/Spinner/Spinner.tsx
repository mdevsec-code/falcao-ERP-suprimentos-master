import { type HTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/utils/cn';

export interface SpinnerProps extends HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg';
  label?: string;
}

const sizeClasses = {
  sm: 'h-3 w-3 border-2',
  md: 'h-4 w-4 border-2',
  lg: 'h-6 w-6 border-[3px]',
} as const;

export function Spinner({ size = 'md', label, className, ...rest }: SpinnerProps): ReactNode {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={label ?? 'Carregando'}
      className={cn(
        'inline-block animate-spin rounded-full border-current border-r-transparent text-ink-soft',
        sizeClasses[size],
        className,
      )}
      {...rest}
    />
  );
}
