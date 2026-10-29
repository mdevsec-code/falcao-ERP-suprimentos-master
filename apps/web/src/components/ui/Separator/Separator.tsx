import * as React from 'react';
import * as SeparatorPrimitive from '@radix-ui/react-separator';
import { cn } from '@/utils/cn';

export const Separator = React.forwardRef<
  React.ElementRef<typeof SeparatorPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SeparatorPrimitive.Root>
>(({ className, orientation = 'horizontal', decorative = true, ...rest }, ref) => (
  <SeparatorPrimitive.Root
    ref={ref}
    decorative={decorative}
    orientation={orientation}
    className={cn(
      'shrink-0',
      // Fio que esmaece nas pontas, como um traço de régua.
      orientation === 'horizontal'
        ? 'h-px w-full bg-gradient-to-r from-transparent via-border to-transparent'
        : 'h-full w-px bg-gradient-to-b from-transparent via-border to-transparent',
      className,
    )}
    {...rest}
  />
));
Separator.displayName = 'Separator';
