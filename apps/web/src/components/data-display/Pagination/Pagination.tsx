import { useTranslation } from 'react-i18next';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { useId } from 'react';
import { cn } from '@/utils/cn';
import { pageWindow } from './pageWindow';

export interface PaginationProps {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  className?: string;
}

const stepButton =
  'inline-flex h-8 min-w-8 items-center justify-center rounded-md px-2 text-sm font-medium tabular-nums ' +
  'transition-colors duration-fast focus:outline-none focus-visible:shadow-focus disabled:pointer-events-none disabled:opacity-40';

/** Rodapé de paginação: "Mostrando 1–10 de 42" + páginas numeradas com marcador deslizante. */
export function Pagination({ page, pageSize, total, onPageChange, className }: PaginationProps) {
  const { t } = useTranslation('common');
  const indicatorId = useId();
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const current = Math.min(page, totalPages);
  const start = total === 0 ? 0 : (current - 1) * pageSize + 1;
  const end = Math.min(current * pageSize, total);

  return (
    <nav
      aria-label={t('pagination.pageOf', { current, total: totalPages })}
      className={cn(
        'flex flex-wrap items-center justify-between gap-3 text-sm text-ink-soft',
        className,
      )}
    >
      <span className="tabular-nums">{t('pagination.showingRange', { start, end, total })}</span>
      <div className="flex items-center gap-1 rounded-lg border border-border bg-surface p-1 shadow-sm">
        <button
          type="button"
          className={cn(stepButton, 'text-ink-soft hover:bg-hover hover:text-ink')}
          disabled={current <= 1}
          onClick={() => onPageChange(current - 1)}
          aria-label={t('pagination.prevPage')}
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        {pageWindow(current, totalPages).map((item, idx) =>
          item === 'gap' ? (
            <span key={`gap-${idx}`} aria-hidden="true" className="px-1 text-muted">
              …
            </span>
          ) : (
            <button
              key={item}
              type="button"
              onClick={() => item !== current && onPageChange(item)}
              aria-current={item === current ? 'page' : undefined}
              className={cn(
                stepButton,
                'relative',
                item === current ? 'text-white' : 'text-ink-soft hover:bg-hover hover:text-ink',
              )}
            >
              {item === current && (
                <motion.span
                  layoutId={indicatorId}
                  className="absolute inset-0 rounded-md bg-gradient-to-b from-brand-gold-500 to-brand-gold-700 shadow-glow"
                  transition={{ type: 'spring', stiffness: 500, damping: 36 }}
                />
              )}
              <span className="relative">{item}</span>
            </button>
          ),
        )}
        <button
          type="button"
          className={cn(stepButton, 'text-ink-soft hover:bg-hover hover:text-ink')}
          disabled={current >= totalPages}
          onClick={() => onPageChange(current + 1)}
          aria-label={t('pagination.nextPage')}
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </nav>
  );
}
