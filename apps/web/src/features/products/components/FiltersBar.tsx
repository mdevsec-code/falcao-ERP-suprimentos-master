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
import { useDisciplines } from '@/features/disciplines/hooks/useDisciplines';
import { useActiveSupplierOptions } from '@/features/suppliers/hooks/useSuppliers';
import type { ProductFilters } from '../types';

const ALL_VALUE = '__all';
/** Mesmo valor que a API entende como "sem disciplina". */
const NO_DISCIPLINE = 'none';

interface FiltersBarProps {
  filters: ProductFilters;
  onChange: (patch: Partial<ProductFilters>) => void;
  onClearAll: () => void;
}

export function FiltersBar({ filters, onChange, onClearAll }: FiltersBarProps) {
  const { t } = useTranslation('products');
  const { data: disciplines = [] } = useDisciplines();
  const { data: suppliersPage } = useActiveSupplierOptions();
  const suppliers = suppliersPage?.data ?? [];

  const disciplineName =
    filters.disciplineId === NO_DISCIPLINE
      ? t('products:filters.noDiscipline')
      : disciplines.find((d) => d.id === filters.disciplineId)?.nome;
  const supplierName = suppliers.find((s) => s.id === filters.supplierId)?.nomeFantasia;

  const chips: { key: keyof ProductFilters; label: string }[] = [];
  if (filters.disciplineId && disciplineName)
    chips.push({
      key: 'disciplineId',
      label: t('products:filters.chipDiscipline', { value: disciplineName }),
    });
  if (filters.categoria)
    chips.push({
      key: 'categoria',
      label: t('products:filters.chipCategory', {
        value: PRODUCT_CATEGORY_LABELS[filters.categoria],
      }),
    });
  if (filters.marca)
    chips.push({ key: 'marca', label: t('products:filters.chipBrand', { value: filters.marca }) });
  if (filters.supplierId && supplierName)
    chips.push({
      key: 'supplierId',
      label: t('products:filters.chipSupplier', { value: supplierName }),
    });
  if (filters.busca)
    chips.push({ key: 'busca', label: t('products:filters.chipSearch', { value: filters.busca }) });

  return (
    <div className="filter-panel space-y-4">
      <div className="flex items-center gap-2">
        <Filter className="h-4 w-4 text-ink-soft" aria-hidden="true" />
        <span className="text-sm font-semibold text-ink">{t('products:filters.title')}</span>
      </div>

      {/* Disciplina primeiro: é o recorte que a equipe usa no dia a dia (civil, elétrica…). */}
      <div
        className="flex flex-wrap gap-2"
        role="group"
        aria-label={t('products:filters.discipline.label')}
      >
        <Button
          size="sm"
          variant={filters.disciplineId ? 'outline' : 'primary'}
          aria-pressed={!filters.disciplineId}
          onClick={() => onChange({ disciplineId: undefined })}
        >
          {t('products:filters.allDisciplines')}
        </Button>
        {disciplines.map((discipline) => (
          <Button
            key={discipline.id}
            size="sm"
            variant={filters.disciplineId === discipline.id ? 'primary' : 'outline'}
            aria-pressed={filters.disciplineId === discipline.id}
            onClick={() =>
              onChange({
                disciplineId: filters.disciplineId === discipline.id ? undefined : discipline.id,
              })
            }
          >
            {discipline.nome}
          </Button>
        ))}
        <Button
          size="sm"
          variant={filters.disciplineId === NO_DISCIPLINE ? 'primary' : 'ghost'}
          aria-pressed={filters.disciplineId === NO_DISCIPLINE}
          onClick={() =>
            onChange({
              disciplineId: filters.disciplineId === NO_DISCIPLINE ? undefined : NO_DISCIPLINE,
            })
          }
        >
          {t('products:filters.noDiscipline')}
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-[2fr_1fr_1fr_1fr]">
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

        <Input
          label={t('products:filters.brand.label')}
          placeholder={t('products:filters.brand.placeholder')}
          value={filters.marca ?? ''}
          onChange={(e) => onChange({ marca: e.target.value || undefined })}
          name="product-brand"
        />

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="products-filter-supplier">{t('products:filters.supplier.label')}</Label>
          <Select
            value={filters.supplierId ?? ALL_VALUE}
            onValueChange={(v) => onChange({ supplierId: v === ALL_VALUE ? undefined : v })}
          >
            <SelectTrigger id="products-filter-supplier" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_VALUE}>{t('products:filters.allSuppliers')}</SelectItem>
              {suppliers.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.nomeFantasia}
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
