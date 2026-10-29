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
        'relative overflow-hidden bg-hover',
        'before:absolute before:inset-0 before:animate-shimmer',
        // Brilho com um toque de dourado — o carregamento "fala" a cor da marca.
        'before:bg-gradient-to-r before:from-transparent before:via-brand-gold-50 before:to-transparent',
        'before:bg-[length:200%_100%] dark:before:via-brand-gold-300/10',
        variant === 'default' && 'rounded-md',
        variant === 'circle' && 'rounded-full',
        variant === 'text' && 'h-3 w-full rounded',
        className,
      )}
      {...rest}
    />
  );
}
