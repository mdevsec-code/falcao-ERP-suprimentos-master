import { forwardRef, useId, type InputHTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/utils/cn';
import { fieldError, fieldFocusWithin, fieldLabel, fieldSurface } from '../field';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  inputClassName?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, inputClassName, label, hint, error, leftIcon, rightIcon, id, ...rest }, ref) => {
    // useId: estável entre renders e único mesmo com dois campos de mesmo `name` na tela.
    const autoId = useId();
    const inputId = id ?? `input-${autoId}`;

    return (
      <div className={cn('group/field flex w-full flex-col gap-1.5', className)}>
        {label && (
          <label htmlFor={inputId} className={fieldLabel}>
            {label}
            {rest.required && (
              <span aria-hidden="true" className="ml-0.5 text-danger">
                *
              </span>
            )}
          </label>
        )}

        <div
          className={cn(
            'group flex h-10 w-full items-center gap-2 px-3',
            fieldSurface,
            fieldFocusWithin,
            error && fieldError,
            rest.disabled && 'cursor-not-allowed opacity-60',
          )}
        >
          {leftIcon && (
            <span className="flex shrink-0 items-center text-muted transition-colors duration-fast group-focus-within:text-brand-gold-700">
              {leftIcon}
            </span>
          )}

          <input
            ref={ref}
            id={inputId}
            className={cn(
              'h-full w-full flex-1 bg-transparent text-sm text-ink placeholder:text-muted',
              'focus:outline-none disabled:cursor-not-allowed',
              inputClassName,
            )}
            aria-invalid={!!error || undefined}
            aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
            {...rest}
          />

          {rightIcon && (
            <span className="flex shrink-0 items-center text-ink-soft">{rightIcon}</span>
          )}
        </div>

        {error ? (
          <p id={`${inputId}-error`} className="text-xs text-danger">
            {error}
          </p>
        ) : hint ? (
          <p id={`${inputId}-hint`} className="text-xs text-ink-soft">
            {hint}
          </p>
        ) : null}
      </div>
    );
  },
);

Input.displayName = 'Input';
