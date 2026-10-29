import { type LabelHTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/utils/cn';
import { fieldLabel } from '../field';

export interface LabelProps extends LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean;
  children: ReactNode;
}

export function Label({ required, className, children, ...rest }: LabelProps) {
  return (
    <label className={cn(fieldLabel, className)} {...rest}>
      {children}
      {required && (
        <span aria-hidden="true" className="ml-0.5 text-danger">
          *
        </span>
      )}
    </label>
  );
}
