import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Boxes, Search } from 'lucide-react';
import { ProductCategory, type ProductSummaryDto } from '@falcao-erp/shared-types';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Skeleton } from '@/components/ui/Skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/Dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select';
import { EmptyState } from '@/components/feedback/EmptyState';
import { PRODUCT_CATEGORY_LABELS } from '@/constants/enums';
import { useDebounce } from '@/hooks/useDebounce';
import { useDisciplines } from '@/features/disciplines/hooks/useDisciplines';
import { useProducts } from '@/features/products/hooks/useProducts';
import { formatCurrencyBRL, formatDate } from '@/utils/format';
import { cn } from '@/utils/cn';

const ALL = '__all';

interface CatalogPickerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPick: (product: ProductSummaryDto) => void;
}

/**
 * Catálogo vivo na hora de pedir: o solicitante filtra por disciplina e
 * categoria, vê marca, referência e o último preço pago, e escolhe o item.
 */
export function CatalogPickerDialog({ open, onOpenChange, onPick }: CatalogPickerDialogProps) {
  const { t } = useTranslation('purchaseRequests');
  const [search, setSearch] = useState('');
  const [disciplineId, setDisciplineId] = useState<string | undefined>();
  const [categoria, setCategoria] = useState<ProductCategory | undefined>();
  const debouncedSearch = useDebounce(search, 250);
  const { data: disciplines = [] } = useDisciplines();

  const list = useProducts(
    {
      page: 1,
      pageSize: 30,
      isActive: true,
      search: debouncedSearch || undefined,
      disciplineId,
      categoria,
    },
    { enabled: open },
  );
  const rows = list.data?.data ?? [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{t('purchaseRequests:catalog.title')}</DialogTitle>
          <DialogDescription>{t('purchaseRequests:catalog.description')}</DialogDescription>
        </DialogHeader>

        <div
          className="flex flex-wrap gap-2"
          role="group"
          aria-label={t('purchaseRequests:catalog.disciplineGroup')}
        >
          <Button
            size="sm"
            variant={disciplineId ? 'outline' : 'primary'}
            aria-pressed={!disciplineId}
            onClick={() => setDisciplineId(undefined)}
          >
            {t('purchaseRequests:catalog.allDisciplines')}
          </Button>
          {disciplines.map((d) => (
            <Button
              key={d.id}
              size="sm"
              variant={disciplineId === d.id ? 'primary' : 'outline'}
              aria-pressed={disciplineId === d.id}
              onClick={() => setDisciplineId(disciplineId === d.id ? undefined : d.id)}
            >
              {d.nome}
            </Button>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-[2fr_1fr]">
          <Input
            label={t('purchaseRequests:catalog.search')}
            placeholder={t('purchaseRequests:catalog.searchPlaceholder')}
            leftIcon={<Search className="h-4 w-4" />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            name="catalog-search"
          />
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="catalog-category">{t('purchaseRequests:catalog.category')}</Label>
            <Select
              value={categoria ?? ALL}
              onValueChange={(v) => setCategoria(v === ALL ? undefined : (v as ProductCategory))}
            >
              <SelectTrigger id="catalog-category">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>{t('purchaseRequests:catalog.allCategories')}</SelectItem>
                {Object.values(ProductCategory).map((value) => (
                  <SelectItem key={value} value={value}>
                    {PRODUCT_CATEGORY_LABELS[value]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div
          className={cn(
            'max-h-[50vh] overflow-y-auto rounded-md border border-border',
            list.isFetching && !list.isLoading && 'opacity-70',
          )}
        >
          {list.isLoading && (
            <div className="space-y-2 p-3">
              {Array.from({ length: 5 }).map((_, idx) => (
                <Skeleton key={idx} className="h-12 w-full" />
              ))}
            </div>
          )}
          {list.data && rows.length === 0 && (
            <EmptyState
              icon={<Boxes className="h-6 w-6" />}
              title={t('purchaseRequests:catalog.emptyTitle')}
              description={t('purchaseRequests:catalog.emptyDescription')}
            />
          )}
          <ul className="divide-y divide-border">
            {rows.map((product) => (
              <li key={product.id}>
                <button
                  type="button"
                  onClick={() => onPick(product)}
                  className="flex w-full items-start gap-4 px-4 py-3 text-left transition-colors duration-fast hover:bg-hover focus-visible:bg-hover focus-visible:outline-none"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-ink">{product.nome}</p>
                    <p className="text-xs text-ink-soft">
                      <span className="font-mono">{product.codigo}</span>
                      {product.discipline ? ` · ${product.discipline.nome}` : ''}
                      {product.marca ? ` · ${product.marca}` : ''}
                      {product.referencia ? (
                        <>
                          {' · '}
                          <span className="font-mono">{product.referencia}</span>
                        </>
                      ) : null}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="font-semibold tabular-nums text-ink">
                      {formatCurrencyBRL(product.lastPrice)}
                    </p>
                    {product.lastPriceAt && (
                      <p className="text-xs text-ink-soft">
                        {t('purchaseRequests:catalog.lastPaid', {
                          date: formatDate(product.lastPriceAt),
                        })}
                      </p>
                    )}
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </div>
        <p className="text-xs text-ink-soft">{t('purchaseRequests:catalog.notFoundHint')}</p>
      </DialogContent>
    </Dialog>
  );
}
