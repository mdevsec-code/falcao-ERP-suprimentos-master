import * as React from 'react';
import * as CheckboxPrimitive from '@radix-ui/react-checkbox';
import { Check } from 'lucide-react';
import { cn } from '@/utils/cn';

export const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>
>(({ className, ...rest }, ref) => (
  <CheckboxPrimitive.Root
    ref={ref}
    className={cn(
      'peer h-4 w-4 shrink-0 rounded-[5px] border border-neutral-300 bg-surface shadow-field dark:border-neutral-700',
      'transition-[background-color,border-color,box-shadow] duration-fast hover:border-brand-gold-500',
      'focus-visible:shadow-focus focus-visible:outline-none',
      'disabled:cursor-not-allowed disabled:opacity-60',
      'data-[state=checked]:border-brand-gold-700 data-[state=checked]:bg-gradient-to-b data-[state=checked]:from-brand-gold-500 data-[state=checked]:to-brand-gold-700 data-[state=checked]:text-white data-[state=checked]:shadow-glow',
      className,
    )}
    {...rest}
  >
    <CheckboxPrimitive.Indicator className={cn('flex items-center justify-center text-current')}>
      <Check className="h-3 w-3 animate-pop-in" strokeWidth={3} />
    </CheckboxPrimitive.Indicator>
  </CheckboxPrimitive.Root>
));
Checkbox.displayName = 'Checkbox';
