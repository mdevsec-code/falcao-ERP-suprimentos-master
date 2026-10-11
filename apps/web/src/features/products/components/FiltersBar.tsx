import { Filter, Search, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { ProductCategory } from '@falcao-erp/shared-types';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Badge } from '@/components/ui/Badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select';
import { PRODUCT_CATEGORY_LABELS } from '@/constants/enums';
import type { ProductFilters } from '../types';

const ALL_VALUE = '__all';

interface FiltersBarProps {
  filters: ProductFilters;
  onChange: (patch: Partial<ProductFilters>) => void;
  onClearAll: () => void;
}

export function FiltersBar({ filters, onChange, onClearAll }: FiltersBarProps) {
  const { t } = useTranslation('products');
  const chips: { key: keyof ProductFilters; label: string }[] = [];
  if (filters.categoria)
    chips.push({
      key: 'categoria',
      label: t('products:filters.chipCategory', {
        value: PRODUCT_CATEGORY_LABELS[filters.categoria],
      }),
    });
  if (filters.busca)
    chips.push({ key: 'busca', label: t('products:filters.chipSearch', { value: filters.busca }) });

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Filter className="h-4 w-4 text-ink-soft" aria-hidden="true" />
        <span className="text-sm font-semibold text-ink">{t('products:filters.title')}</span>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-[2fr_1fr]">
        <Input
          label={t('products:filters.search.label')}
          placeholder={t('products:filters.search.placeholder')}
          leftIcon={<Search className="h-4 w-4" />}
          value={filters.busca ?? ''}
          onChange={(e) => onChange({ busca: e.target.value || undefined })}
          name="product-search"
        />

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="products-filter-category">{t('products:filters.category.label')}</Label>
          <Select
            value={filters.categoria ?? ALL_VALUE}
            onValueChange={(v) =>
              onChange({ categoria: v === ALL_VALUE ? undefined : (v as ProductCategory) })
            }
          >
            <SelectTrigger id="products-filter-category" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_VALUE}>{t('products:filters.allCategories')}</SelectItem>
              {Object.values(ProductCategory).map((value) => (
                <SelectItem key={value} value={value}>
                  {PRODUCT_CATEGORY_LABELS[value]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {chips.length > 0 && (
        <div className="flex animate-fade-in flex-wrap items-center gap-2 border-t border-border pt-3">
          {chips.map((chip) => (
            <Badge key={chip.key} variant="outline" className="gap-1.5 pr-1.5">
              {chip.label}
              <button
                type="button"
                onClick={() => onChange({ [chip.key]: undefined })}
                aria-label={t('common:filters.removeChipAria', { label: chip.label })}
                className="rounded-full p-0.5 hover:bg-hover"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
          <Button variant="ghost" size="sm" onClick={onClearAll}>
            {t('common:filters.clearAll')}
          </Button>
        </div>
      )}
    </div>
  );
}
