import {
  forwardRef,
  type HTMLAttributes,
  type TdHTMLAttributes,
  type ThHTMLAttributes,
} from 'react';
import { cn } from '@/utils/cn';

/**
 * Primitivas de tabela com o visual padrão dos módulos Falcão: contêiner
 * com borda arredondada e rolagem horizontal, cabeçalho em dourado suave
 * com rótulos em caixa-alta e linhas com hover.
 */
export const Table = forwardRef<HTMLTableElement, HTMLAttributes<HTMLTableElement>>(
  ({ className, ...rest }, ref) => (
    <div className="scrollbar-thin overflow-x-auto rounded-md border border-border shadow-sm">
      <table ref={ref} className={cn('w-full text-left text-sm', className)} {...rest} />
    </div>
  ),
);
Table.displayName = 'Table';

export const TableHeader = forwardRef<
  HTMLTableSectionElement,
  HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...rest }, ref) => (
  <thead ref={ref} className={cn('bg-brand-gold-50/60 text-ink', className)} {...rest} />
));
TableHeader.displayName = 'TableHeader';

export const TableBody = forwardRef<
  HTMLTableSectionElement,
  HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...rest }, ref) => (
  <tbody ref={ref} className={cn('divide-y divide-border bg-surface', className)} {...rest} />
));
TableBody.displayName = 'TableBody';

export const TableRow = forwardRef<HTMLTableRowElement, HTMLAttributes<HTMLTableRowElement>>(
  ({ className, ...rest }, ref) => (
    <tr
      ref={ref}
      className={cn(
        'transition-[background-color,box-shadow] duration-fast',
        // Hover marca a linha com o trilho dourado da Sidebar.
        '[tbody_&]:hover:bg-hover [tbody_&]:hover:shadow-[inset_3px_0_0_rgb(var(--color-brand-gold-300))]',
        className,
      )}
      {...rest}
    />
  ),
);
TableRow.displayName = 'TableRow';

export const TableHead = forwardRef<HTMLTableCellElement, ThHTMLAttributes<HTMLTableCellElement>>(
  ({ className, ...rest }, ref) => (
    <th
      ref={ref}
      className={cn(
        'whitespace-nowrap px-3 py-2 text-xs font-semibold uppercase tracking-wider text-ink-soft',
        className,
      )}
      {...rest}
    />
  ),
);
TableHead.displayName = 'TableHead';

export const TableCell = forwardRef<HTMLTableCellElement, TdHTMLAttributes<HTMLTableCellElement>>(
  ({ className, ...rest }, ref) => (
    <td ref={ref} className={cn('px-3 py-2.5 text-ink', className)} {...rest} />
  ),
);
TableCell.displayName = 'TableCell';
