import * as React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/utils/cn';

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogClose = DialogPrimitive.Close;
export const DialogPortal = DialogPrimitive.Portal;

export const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...rest }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      'fixed inset-0 z-modal-backdrop bg-accent-900/55 backdrop-blur-[3px]',
      'data-[state=closed]:animate-fade-out data-[state=open]:animate-fade-in',
      className,
    )}
    {...rest}
  />
));
DialogOverlay.displayName = 'DialogOverlay';

export const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...rest }, ref) => {
  const { t } = useTranslation('common');
  return (
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Content
        ref={ref}
        className={cn(
          'fixed left-1/2 top-1/2 z-modal max-h-[90vh] w-[calc(100%-2rem)] max-w-lg overflow-y-auto',
          '-translate-x-1/2 -translate-y-1/2 rounded-lg border border-border bg-surface p-6 shadow-lg',
          // Fio dourado no topo: o mesmo da borda da Sidebar.
          "before:pointer-events-none before:absolute before:inset-x-6 before:top-0 before:h-px before:content-['']",
          'before:bg-gradient-to-r before:from-transparent before:via-brand-gold-300 before:to-transparent',
          'data-[state=closed]:animate-dialog-out data-[state=open]:animate-dialog-in',
          className,
        )}
        {...rest}
      >
        {children}
        <DialogPrimitive.Close
          className="absolute right-4 top-4 rounded-md p-1.5 text-ink-soft transition-[color,background-color,transform] duration-base hover:rotate-90 hover:bg-hover hover:text-ink focus:outline-none focus-visible:shadow-focus"
          aria-label={t('actions.close')}
        >
          <X className="h-4 w-4" />
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPortal>
  );
});
DialogContent.displayName = 'DialogContent';

export function DialogHeader({ className, ...rest }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex flex-col gap-1.5 pb-5 pr-8', className)} {...rest} />;
}

export function DialogFooter({ className, ...rest }: React.HTMLAttributes<HTMLDivElement>) {
  // Rodapé em faixa própria, encostado nas bordas do diálogo (o conteúdo tem p-6).
  return (
    <div
      className={cn(
        '-mx-6 -mb-6 mt-6 flex flex-wrap justify-end gap-2 rounded-b-lg border-t border-border bg-hover/50 px-6 py-4',
        className,
      )}
      {...rest}
    />
  );
}

export const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...rest }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn('font-display text-xl font-semibold tracking-tight text-ink', className)}
    {...rest}
  />
));
DialogTitle.displayName = 'DialogTitle';

export const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...rest }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn('text-sm text-ink-soft', className)}
    {...rest}
  />
));
DialogDescription.displayName = 'DialogDescription';
