import { type HTMLAttributes } from 'react';
import { cn } from '@/utils/cn';

export interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'circle' | 'text';
}

export function Skeleton({ variant = 'default', className, ...rest }: SkeletonProps) {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-live="polite"
      className={cn(
        'relative overflow-hidden bg-neutral-100 dark:bg-neutral-700',
        'before:absolute before:inset-0 before:animate-shimmer',
        'before:bg-gradient-to-r before:from-transparent before:via-white/60 before:to-transparent',
        'dark:before:via-white/5',
        variant === 'default' && 'rounded-md',
        variant === 'circle' && 'rounded-full',
        variant === 'text' && 'h-3 w-full rounded',
        className,
      )}
      {...rest}
    />
  );
}
