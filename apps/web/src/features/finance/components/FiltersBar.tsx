import { type ReactNode } from 'react';
import { AlertTriangle, FileX2, Filter, Search, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { PayableSource, PayableStatus } from '@falcao-erp/shared-types';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { SelectField } from '@/components/common/SelectField';
import { PAYABLE_SOURCE_LABELS, PAYABLE_STATUS_LABELS } from '@/constants/enums';
import { formatDateOnly } from '@/utils/format';
import { cn } from '@/utils/cn';
import type { PayableFilters } from '../types';

interface FiltersBarProps {
  filters: PayableFilters;
  costCenters: readonly string[];
  onChange: (patch: Partial<PayableFilters>) => void;
  onClearAll: () => void;
}

export function FiltersBar({ filters, costCenters, onChange, onClearAll }: FiltersBarProps) {
  const { t } = useTranslation('finance');

  const chips: { key: keyof PayableFilters; label: string }[] = [];
  if (filters.status) chips.push({ key: 'status', label: PAYABLE_STATUS_LABELS[filters.status] });
  if (filters.origem) chips.push({ key: 'origem', label: PAYABLE_SOURCE_LABELS[filters.origem] });
  if (filters.costCenter) chips.push({ key: 'costCenter', label: filters.costCenter });
  if (filters.vencidas) chips.push({ key: 'vencidas', label: t('finance:filters.overdueOnly') });
  if (filters.semNota) chips.push({ key: 'semNota', label: t('finance:filters.noInvoiceOnly') });
  if (filters.from)
    chips.push({
      key: 'from',
      label: t('finance:filters.chipFrom', { date: formatDateOnly(filters.from) }),
    });
  if (filters.to)
    chips.push({
      key: 'to',
      label: t('finance:filters.chipTo', { date: formatDateOnly(filters.to) }),
    });
  if (filters.busca)
    chips.push({ key: 'busca', label: t('finance:filters.chipSearch', { value: filters.busca }) });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-ink-soft" aria-hidden="true" />
          <span className="text-sm font-semibold text-ink">{t('finance:filters.title')}</span>
        </div>
        <div className="flex flex-wrap gap-2">
          <ToggleChip
            pressed={!!filters.vencidas}
            onClick={() => onChange({ vencidas: !filters.vencidas || undefined })}
            icon={<AlertTriangle className="h-3.5 w-3.5" />}
          >
            {t('finance:filters.overdueOnly')}
          </ToggleChip>
          <ToggleChip
            pressed={!!filters.semNota}
            onClick={() => onChange({ semNota: !filters.semNota || undefined })}
            icon={<FileX2 className="h-3.5 w-3.5" />}
          >
            {t('finance:filters.noInvoiceOnly')}
          </ToggleChip>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-[2fr_1fr_1fr_1fr]">
        <Input
          label={t('finance:filters.search.label')}
          placeholder={t('finance:filters.search.placeholder')}
          leftIcon={<Search className="h-4 w-4" />}
          value={filters.busca ?? ''}
          onChange={(e) => onChange({ busca: e.target.value || undefined })}
          name="payable-search"
        />
        <SelectField
          id="payables-filter-status"
          label={t('finance:filters.status')}
          noneLabel={t('finance:filters.allStatuses')}
          value={filters.status}
          onChange={(v) => onChange({ status: (v || undefined) as PayableStatus | undefined })}
          options={Object.values(PayableStatus).map((value) => ({
            value,
            label: PAYABLE_STATUS_LABELS[value],
          }))}
        />
        <SelectField
          id="payables-filter-source"
          label={t('finance:filters.source')}
          noneLabel={t('finance:filters.allSources')}
          value={filters.origem}
          onChange={(v) => onChange({ origem: (v || undefined) as PayableSource | undefined })}
          options={Object.values(PayableSource).map((value) => ({
            value,
            label: PAYABLE_SOURCE_LABELS[value],
          }))}
        />
        <SelectField
          id="payables-filter-cost-center"
          label={t('finance:filters.costCenter')}
          noneLabel={t('finance:filters.allCostCenters')}
          value={filters.costCenter}
          onChange={(v) => onChange({ costCenter: v || undefined })}
          options={costCenters.map((value) => ({ value, label: value }))}
        />
      </div>

      <div className="grid max-w-md grid-cols-2 gap-4">
        <Input
          type="date"
          label={t('finance:filters.from')}
          value={filters.from ?? ''}
          onChange={(e) => onChange({ from: e.target.value || undefined })}
        />
        <Input
          type="date"
          label={t('finance:filters.to')}
          value={filters.to ?? ''}
          onChange={(e) => onChange({ to: e.target.value || undefined })}
        />
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

function ToggleChip({
  pressed,
  onClick,
  icon,
  children,
}: {
  pressed: boolean;
  onClick: () => void;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium',
        'transition-colors duration-fast focus:outline-none focus-visible:shadow-focus',
        pressed
          ? 'border-brand-gold-500 bg-brand-gold-50 text-brand-gold-900'
          : 'border-border text-ink-soft hover:bg-hover hover:text-ink',
      )}
    >
      {icon}
      {children}
    </button>
  );
}
