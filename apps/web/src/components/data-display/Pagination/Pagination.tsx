import { useTranslation } from 'react-i18next';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/utils/cn';

export interface PaginationProps {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  className?: string;
}

/** Rodapé de paginação padrão: "Mostrando 1–10 de 42" + página X de Y. */
export function Pagination({ page, pageSize, total, onPageChange, className }: PaginationProps) {
  const { t } = useTranslation('common');
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const current = Math.min(page, totalPages);
  const start = total === 0 ? 0 : (current - 1) * pageSize + 1;
  const end = Math.min(current * pageSize, total);

  return (
    <div
      className={cn(
        'flex flex-wrap items-center justify-between gap-3 text-sm text-ink-soft',
        className,
      )}
    >
      <span>{t('pagination.showingRange', { start, end, total })}</span>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={current <= 1}
          onClick={() => onPageChange(current - 1)}
          aria-label={t('pagination.prevPage')}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span>{t('pagination.pageOf', { current, total: totalPages })}</span>
        <Button
          variant="outline"
          size="sm"
          disabled={current >= totalPages}
          onClick={() => onPageChange(current + 1)}
          aria-label={t('pagination.nextPage')}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
