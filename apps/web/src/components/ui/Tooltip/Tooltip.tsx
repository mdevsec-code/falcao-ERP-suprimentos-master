import * as React from 'react';
import * as TooltipPrimitive from '@radix-ui/react-tooltip';
import { cn } from '@/utils/cn';

export const TooltipProvider = TooltipPrimitive.Provider;
export const Tooltip = TooltipPrimitive.Root;
export const TooltipTrigger = TooltipPrimitive.Trigger;

export const TooltipContent = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>
>(({ className, sideOffset = 6, ...rest }, ref) => (
  <TooltipPrimitive.Portal>
    <TooltipPrimitive.Content
      ref={ref}
      sideOffset={sideOffset}
      className={cn(
        // Grafite da barra lateral com fio dourado no topo.
        'relative z-tooltip overflow-hidden rounded-md border border-rail-border bg-rail px-2.5 py-1.5',
        'text-xs font-medium text-rail-text shadow-lg',
        "before:absolute before:inset-x-2 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-brand-gold-300/70 before:to-transparent before:content-['']",
        'origin-[var(--radix-tooltip-content-transform-origin)]',
        'data-[state=closed]:animate-scale-out data-[state=delayed-open]:animate-scale-in',
        className,
      )}
      {...rest}
    />
  </TooltipPrimitive.Portal>
));
TooltipContent.displayName = 'TooltipContent';
