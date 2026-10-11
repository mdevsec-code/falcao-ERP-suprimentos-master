import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { Slot } from '@radix-ui/react-slot';
import { Loader2 } from 'lucide-react';
import { cn } from '@/utils/cn';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'link';
export type ButtonSize = 'sm' | 'md' | 'lg' | 'icon';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  asChild?: boolean;
  fullWidth?: boolean;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-brand-gold-500 text-white hover:bg-brand-gold-700 active:bg-brand-gold-900 ' +
    'shadow-sm hover:shadow-md focus-visible:shadow-focus',
  secondary:
    'bg-ink text-bg hover:opacity-90 active:opacity-80 ' + 'shadow-sm focus-visible:shadow-focus',
  outline:
    'border border-border bg-surface text-ink hover:bg-hover active:bg-border ' +
    'focus-visible:shadow-focus',
  ghost: 'text-ink-soft hover:bg-hover hover:text-ink active:bg-border',
  danger:
    'bg-danger text-white hover:opacity-90 active:opacity-80 ' +
    'shadow-sm focus-visible:shadow-focus',
  link: 'text-brand-gold-700 hover:text-brand-gold-900 underline-offset-4 hover:underline',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-xs gap-1.5 rounded-md',
  md: 'h-10 px-4 text-sm gap-2 rounded-md',
  lg: 'h-12 px-6 text-base gap-2.5 rounded-lg',
  icon: 'h-10 w-10 rounded-md',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      children,
      asChild = false,
      fullWidth = false,
      disabled,
      type = 'button',
      ...rest
    },
    ref,
  ) => {
    const Comp = asChild ? Slot : 'button';

    // Quando asChild, o Radix Slot exige um único React element como filho direto.
    // Renderizamos os ícones + children como irmãos — Slot vai clonar as props no único filho.
    if (asChild) {
      return (
        <Comp
          ref={ref as never}
          data-loading={isLoading || undefined}
          className={cn(
            'inline-flex select-none items-center justify-center font-medium',
            'transition-[background,box-shadow,transform,color] duration-fast ease-out',
            'focus:outline-none focus-visible:shadow-focus',
            'disabled:cursor-not-allowed disabled:opacity-60',
            'active:scale-[0.985]',
            variantClasses[variant],
            sizeClasses[size],
            fullWidth && 'w-full',
            isLoading && 'pointer-events-none',
            className,
          )}
          aria-busy={isLoading || undefined}
          {...rest}
        >
          {children}
        </Comp>
      );
    }

    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || isLoading}
        data-loading={isLoading || undefined}
        className={cn(
          'inline-flex select-none items-center justify-center font-medium',
          'transition-[background,box-shadow,transform,color] duration-fast ease-out',
          'focus:outline-none focus-visible:shadow-focus',
          'disabled:cursor-not-allowed disabled:opacity-60',
          'active:scale-[0.985]',
          variantClasses[variant],
          sizeClasses[size],
          fullWidth && 'w-full',
          isLoading && 'pointer-events-none',
          className,
        )}
        aria-busy={isLoading || undefined}
        {...rest}
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        ) : (
          leftIcon && <span className="flex shrink-0 items-center">{leftIcon}</span>
        )}
        {children && <span className="truncate">{children}</span>}
        {!isLoading && rightIcon && <span className="flex shrink-0 items-center">{rightIcon}</span>}
      </button>
    );
  },
);

Button.displayName = 'Button';
