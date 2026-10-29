import { forwardRef, type HTMLAttributes } from 'react';
import { cn } from '@/utils/cn';
import { useSpotlight } from '@/hooks/useSpotlight';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** Holofote dourado sob o cursor + leve elevação no hover. */
  interactive?: boolean;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, interactive = false, onPointerMove, ...rest }, ref) => {
    const spotlight = useSpotlight<HTMLDivElement>();
    return (
      <div
        ref={ref}
        onPointerMove={
          interactive
            ? (event) => {
                spotlight.onPointerMove(event);
                onPointerMove?.(event);
              }
            : onPointerMove
        }
        className={cn(
          'rounded-lg border border-border bg-surface shadow-sm',
          'transition-[box-shadow,border-color,transform] duration-base ease-out',
          interactive &&
            'spotlight hover:-translate-y-0.5 hover:border-brand-gold-300/60 hover:shadow-md',
          className,
        )}
        {...rest}
      />
    );
  },
);
Card.displayName = 'Card';

export const CardHeader = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...rest }, ref) => (
    <div
      ref={ref}
      className={cn('flex flex-col gap-1 border-b border-border px-5 py-4', className)}
      {...rest}
    />
  ),
);
CardHeader.displayName = 'CardHeader';

export const CardTitle = forwardRef<HTMLHeadingElement, HTMLAttributes<HTMLHeadingElement>>(
  ({ className, children, ...rest }, ref) => (
    <h3
      ref={ref}
      className={cn('font-display text-lg font-semibold text-ink', className)}
      {...rest}
    >
      {children}
    </h3>
  ),
);
CardTitle.displayName = 'CardTitle';

export const CardDescription = forwardRef<
  HTMLParagraphElement,
  HTMLAttributes<HTMLParagraphElement>
>(({ className, ...rest }, ref) => (
  <p ref={ref} className={cn('text-sm text-ink-soft', className)} {...rest} />
));
CardDescription.displayName = 'CardDescription';

export const CardContent = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...rest }, ref) => (
    <div ref={ref} className={cn('px-5 py-4', className)} {...rest} />
  ),
);
CardContent.displayName = 'CardContent';

export const CardFooter = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...rest }, ref) => (
    <div
      ref={ref}
      className={cn(
        'flex items-center justify-end gap-2 border-t border-border px-5 py-4',
        className,
      )}
      {...rest}
    />
  ),
);
CardFooter.displayName = 'CardFooter';
