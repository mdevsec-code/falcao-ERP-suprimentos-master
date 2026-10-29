import { type ReactNode } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { cn } from '@/utils/cn';

export interface FormSectionProps {
  title: string;
  description?: string;
  /** Ação no canto do cabeçalho (ex.: "Adicionar contato"). */
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  /** Atraso da animação de entrada, para seções aparecerem em cascata. */
  delayMs?: number;
}

/** Bloco de formulário em `Card`, com entrada em `slide-up` escalonável. */
export function FormSection({
  title,
  description,
  action,
  children,
  className,
  delayMs = 0,
}: FormSectionProps) {
  return (
    <Card
      className={cn('animate-slide-up', className)}
      style={{ animationDelay: `${delayMs}ms`, animationFillMode: 'backwards' }}
    >
      <CardHeader className="flex-row items-start justify-between gap-3 space-y-0 bg-gradient-to-b from-hover/60 to-transparent">
        <div className="space-y-1 border-l-2 border-brand-gold-300 pl-3">
          <CardTitle className="text-base">{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </div>
        {action}
      </CardHeader>
      <CardContent className="space-y-4">{children}</CardContent>
    </Card>
  );
}
