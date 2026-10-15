import { Star } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { SupplierCategory } from '@falcao-erp/shared-types';

import { Badge } from '@/components/ui/Badge';
import { SUPPLIER_CATEGORY_LABELS } from '@/constants/enums';
import { cn } from '@/utils/cn';

export function SupplierStatusBadge({
  isActive,
  pending = false,
}: {
  isActive: boolean;
  /** Cadastro feito pelo próprio fornecedor, ainda não revisado. */
  pending?: boolean;
}) {
  const { t } = useTranslation('common');
  if (pending) {
    return (
      <Badge variant="warning" size="sm">
        {t('suppliers:registration.pendingBadge')}
      </Badge>
    );
  }
  return (
    <Badge variant={isActive ? 'success' : 'neutral'} size="sm">
      {isActive ? t('status.active') : t('status.inactive')}
    </Badge>
  );
}

export function SupplierCategoryBadge({ categoria }: { categoria: SupplierCategory }) {
  return (
    <Badge variant="outline" size="sm">
      {SUPPLIER_CATEGORY_LABELS[categoria]}
    </Badge>
  );
}

interface ScoreStarsProps {
  score: number;
  className?: string;
}

/** Cinco estrelas com as `score` primeiras preenchidas (avaliações individuais). */
export function ScoreStars({ score, className }: ScoreStarsProps) {
  const { t } = useTranslation('suppliers');
  return (
    <span
      className={cn('inline-flex items-center gap-0.5', className)}
      role="img"
      aria-label={t('suppliers:evaluations.scoreAria', { score })}
    >
      {Array.from({ length: 5 }).map((_, index) => (
        <Star
          key={index}
          aria-hidden="true"
          className={cn(
            'h-4 w-4',
            index < Math.round(score) ? 'fill-brand-gold-300 text-brand-gold-500' : 'text-border',
          )}
        />
      ))}
    </span>
  );
}

/** Nota média compacta para tabelas: ★ 4,5 — ou "Sem avaliações". */
export function SupplierScore({ score }: { score: number | null }) {
  const { t, i18n } = useTranslation('suppliers');
  if (score === null) {
    return <span className="text-xs text-ink-soft">{t('suppliers:evaluations.none')}</span>;
  }
  return (
    <span className="inline-flex items-center gap-1 text-sm font-semibold text-ink">
      <Star className="h-3.5 w-3.5 fill-brand-gold-300 text-brand-gold-500" aria-hidden="true" />
      {new Intl.NumberFormat(i18n.language, {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
      }).format(score)}
    </span>
  );
}
