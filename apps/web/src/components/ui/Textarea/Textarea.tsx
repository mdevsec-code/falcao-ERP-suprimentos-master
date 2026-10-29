import { forwardRef, useId, type TextareaHTMLAttributes } from 'react';
import { cn } from '@/utils/cn';

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  hint?: string;
  error?: string;
  inputClassName?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, inputClassName, label, hint, error, id, rows = 4, ...rest }, ref) => {
    const autoId = useId();
    const inputId = id ?? `textarea-${autoId}`;

    return (
      <div className={cn('flex w-full flex-col gap-1.5', className)}>
        {label && (
          <label htmlFor={inputId} className="text-xs font-semibold text-ink-soft">
            {label}
            {rest.required && (
              <span aria-hidden="true" className="ml-0.5 text-danger">
                *
              </span>
            )}
          </label>
        )}

        <textarea
          ref={ref}
          id={inputId}
          rows={rows}
          className={cn(
            'w-full resize-y rounded-md border bg-surface px-3 py-2 text-sm text-ink placeholder:text-muted',
            'border-border transition-[border-color,box-shadow] duration-fast',
            'focus:border-brand-gold-500 focus:shadow-focus focus:outline-none',
            error && 'border-danger focus:border-danger focus:shadow-focus',
            rest.disabled && 'cursor-not-allowed opacity-60',
            inputClassName,
          )}
          aria-invalid={!!error || undefined}
          aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
          {...rest}
        />

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
Textarea.displayName = 'Textarea';
