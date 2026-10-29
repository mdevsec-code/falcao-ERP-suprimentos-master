import { Filter, Search, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { ContractStatus } from '@falcao-erp/shared-types';

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
import { CONTRACT_STATUS_LABELS, DEADLINE_STATE_LABELS } from '@/constants/enums';
import type { ContractFilters } from '../types';

const ALL_VALUE = '__all';
const DEADLINE_OPTIONS = ['VENCENDO', 'VENCIDO'] as const;

interface FiltersBarProps {
  filters: ContractFilters;
  onChange: (patch: Partial<ContractFilters>) => void;
  onClearAll: () => void;
}

export function FiltersBar({ filters, onChange, onClearAll }: FiltersBarProps) {
  const { t } = useTranslation('contracts');
  const chips: { key: keyof ContractFilters; label: string }[] = [];
  if (filters.status)
    chips.push({
      key: 'status',
      label: t('contracts:filters.chipStatus', { value: CONTRACT_STATUS_LABELS[filters.status] }),
    });
  if (filters.prazo)
    chips.push({
      key: 'prazo',
      label: t('contracts:filters.chipDeadline', { value: DEADLINE_STATE_LABELS[filters.prazo] }),
    });
  if (filters.busca)
    chips.push({
      key: 'busca',
      label: t('contracts:filters.chipSearch', { value: filters.busca }),
    });

  return (
    <div className="filter-panel space-y-4">
      <div className="flex items-center gap-2">
        <Filter className="h-4 w-4 text-ink-soft" aria-hidden="true" />
        <span className="text-sm font-semibold text-ink">{t('contracts:filters.title')}</span>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-[2fr_1fr_1fr]">
        <Input
          label={t('contracts:filters.search.label')}
          placeholder={t('contracts:filters.search.placeholder')}
          leftIcon={<Search className="h-4 w-4" />}
          value={filters.busca ?? ''}
          onChange={(e) => onChange({ busca: e.target.value || undefined })}
          name="contract-search"
        />

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="contracts-filter-status">{t('contracts:filters.status')}</Label>
          <Select
            value={filters.status ?? ALL_VALUE}
            onValueChange={(v) =>
              onChange({ status: v === ALL_VALUE ? undefined : (v as ContractStatus) })
            }
          >
            <SelectTrigger id="contracts-filter-status" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_VALUE}>{t('contracts:filters.allStatuses')}</SelectItem>
              {Object.values(ContractStatus).map((value) => (
                <SelectItem key={value} value={value}>
                  {CONTRACT_STATUS_LABELS[value]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="contracts-filter-deadline">{t('contracts:filters.deadline')}</Label>
          <Select
            value={filters.prazo ?? ALL_VALUE}
            onValueChange={(v) =>
              onChange({
                prazo: v === ALL_VALUE ? undefined : (v as (typeof DEADLINE_OPTIONS)[number]),
              })
            }
          >
            <SelectTrigger id="contracts-filter-deadline" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_VALUE}>{t('contracts:filters.anyDeadline')}</SelectItem>
              {DEADLINE_OPTIONS.map((value) => (
                <SelectItem key={value} value={value}>
                  {DEADLINE_STATE_LABELS[value]}
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
