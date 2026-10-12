import { type ReactNode } from 'react';
import { Button } from '@/components/ui/Button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/Tooltip';
import { cn } from '@/utils/cn';

export interface RowActionProps {
  label: string;
  tooltip: string;
  onClick: () => void;
  disabled?: boolean;
  className?: string;
  children: ReactNode;
}

/** Botão-ícone de ação em linha de tabela, com tooltip (inclusive quando desabilitado). */
export function RowAction({
  label,
  tooltip,
  onClick,
  disabled,
  className,
  children,
}: RowActionProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        {/* span: tooltips não disparam em botões desabilitados */}
        <span>
          <Button
            variant="ghost"
            size="icon"
            className={cn('h-8 w-8', className)}
            aria-label={label}
            onClick={(event) => {
              // Ações não devem acionar o clique da linha (navegação).
              event.stopPropagation();
              onClick();
            }}
            disabled={disabled}
          >
            {children}
          </Button>
        </span>
      </TooltipTrigger>
      <TooltipContent>{tooltip}</TooltipContent>
    </Tooltip>
  );
}
