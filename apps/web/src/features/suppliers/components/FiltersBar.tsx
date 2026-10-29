import { Filter, Search, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { BRAZILIAN_STATES, SupplierCategory } from '@falcao-erp/shared-types';

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
import { SUPPLIER_CATEGORY_LABELS } from '@/constants/enums';
import type { SupplierFilters } from '../types';

const ALL_VALUE = '__all';

interface FiltersBarProps {
  filters: SupplierFilters;
  onChange: (patch: Partial<SupplierFilters>) => void;
  onClearAll: () => void;
}

export function FiltersBar({ filters, onChange, onClearAll }: FiltersBarProps) {
  const { t } = useTranslation('suppliers');
  const chips: { key: keyof SupplierFilters; label: string }[] = [];
  if (filters.categoria)
    chips.push({
      key: 'categoria',
      label: t('suppliers:filters.chipCategory', {
        value: SUPPLIER_CATEGORY_LABELS[filters.categoria],
      }),
    });
  if (filters.estado)
    chips.push({
      key: 'estado',
      label: t('suppliers:filters.chipState', { value: filters.estado }),
    });
  if (filters.busca)
    chips.push({
      key: 'busca',
      label: t('suppliers:filters.chipSearch', { value: filters.busca }),
    });

  return (
    <div className="filter-panel space-y-4">
      <div className="flex items-center gap-2">
        <Filter className="h-4 w-4 text-ink-soft" aria-hidden="true" />
        <span className="text-sm font-semibold text-ink">{t('suppliers:filters.title')}</span>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-[2fr_1.5fr_1fr]">
        <Input
          label={t('suppliers:filters.search.label')}
          placeholder={t('suppliers:filters.search.placeholder')}
          leftIcon={<Search className="h-4 w-4" />}
          value={filters.busca ?? ''}
          onChange={(e) => onChange({ busca: e.target.value || undefined })}
          name="supplier-search"
        />

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="suppliers-filter-category">{t('suppliers:filters.category.label')}</Label>
          <Select
            value={filters.categoria ?? ALL_VALUE}
            onValueChange={(v) =>
              onChange({ categoria: v === ALL_VALUE ? undefined : (v as SupplierCategory) })
            }
          >
            <SelectTrigger id="suppliers-filter-category" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_VALUE}>{t('suppliers:filters.allCategories')}</SelectItem>
              {Object.values(SupplierCategory).map((value) => (
                <SelectItem key={value} value={value}>
                  {SUPPLIER_CATEGORY_LABELS[value]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="suppliers-filter-state">{t('suppliers:filters.state.label')}</Label>
          <Select
            value={filters.estado ?? ALL_VALUE}
            onValueChange={(v) => onChange({ estado: v === ALL_VALUE ? undefined : v })}
          >
            <SelectTrigger id="suppliers-filter-state" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_VALUE}>{t('suppliers:filters.allStates')}</SelectItem>
              {BRAZILIAN_STATES.map((uf) => (
                <SelectItem key={uf} value={uf}>
                  {uf}
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
