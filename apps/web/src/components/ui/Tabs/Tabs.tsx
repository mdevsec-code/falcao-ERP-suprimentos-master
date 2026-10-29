import * as React from 'react';
import * as TabsPrimitive from '@radix-ui/react-tabs';
import { cn } from '@/utils/cn';

export const Tabs = TabsPrimitive.Root;

export const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...rest }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      // Controle segmentado: trilho afundado, aba ativa como peça em relevo.
      'inline-flex h-10 items-center justify-center gap-1 rounded-lg border border-border bg-hover p-1 shadow-field',
      className,
    )}
    {...rest}
  />
));
TabsList.displayName = 'TabsList';

export const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...rest }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      'relative inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium',
      'text-ink-soft transition-[color,background-color,box-shadow] duration-base ease-out hover:text-ink',
      'focus-visible:shadow-focus focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50',
      'data-[state=active]:bg-surface data-[state=active]:text-ink data-[state=active]:shadow-sm',
      // Fio dourado sob a aba ativa.
      "after:absolute after:inset-x-3 after:-bottom-px after:h-[2px] after:origin-center after:scale-x-0 after:rounded-full after:bg-brand-gold-300 after:transition-transform after:duration-base after:content-['']",
      'data-[state=active]:after:scale-x-100',
      className,
    )}
    {...rest}
  />
));
TabsTrigger.displayName = 'TabsTrigger';

export const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...rest }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn('mt-3 focus-visible:outline-none', 'data-[state=active]:animate-rise', className)}
    {...rest}
  />
));
TabsContent.displayName = 'TabsContent';
