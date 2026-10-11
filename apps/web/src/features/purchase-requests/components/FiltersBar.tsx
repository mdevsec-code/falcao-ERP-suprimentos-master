import { Filter, Search, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { PurchaseRequestStatus } from '@falcao-erp/shared-types';

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
import { PURCHASE_REQUEST_STATUS_LABELS } from '@/constants/enums';
import type { PurchaseRequestFilters } from '../types';

const ALL_VALUE = '__all';

interface FiltersBarProps {
  filters: PurchaseRequestFilters;
  onChange: (patch: Partial<PurchaseRequestFilters>) => void;
  onClearAll: () => void;
  /** Na fila de aprovações o status é definido pelo papel — o filtro some. */
  showStatus?: boolean;
}

export function FiltersBar({ filters, onChange, onClearAll, showStatus = true }: FiltersBarProps) {
  const { t } = useTranslation('purchaseRequests');
  const chips: { key: keyof PurchaseRequestFilters; label: string }[] = [];
  if (filters.status)
    chips.push({
      key: 'status',
      label: t('purchaseRequests:filters.chipStatus', {
        value: PURCHASE_REQUEST_STATUS_LABELS[filters.status],
      }),
    });
  if (filters.busca)
    chips.push({
      key: 'busca',
      label: t('purchaseRequests:filters.chipSearch', { value: filters.busca }),
    });

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Filter className="h-4 w-4 text-ink-soft" aria-hidden="true" />
        <span className="text-sm font-semibold text-ink">
          {t('purchaseRequests:filters.title')}
        </span>
      </div>

      <div className={showStatus ? 'grid grid-cols-1 gap-4 sm:grid-cols-[2fr_1fr]' : 'max-w-xl'}>
        <Input
          label={t('purchaseRequests:filters.search.label')}
          placeholder={t('purchaseRequests:filters.search.placeholder')}
          leftIcon={<Search className="h-4 w-4" />}
          value={filters.busca ?? ''}
          onChange={(e) => onChange({ busca: e.target.value || undefined })}
          name="purchase-request-search"
        />

        {showStatus && (
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="purchase-requests-filter-status">
              {t('purchaseRequests:filters.status.label')}
            </Label>
            <Select
              value={filters.status ?? ALL_VALUE}
              onValueChange={(v) =>
                onChange({ status: v === ALL_VALUE ? undefined : (v as PurchaseRequestStatus) })
              }
            >
              <SelectTrigger id="purchase-requests-filter-status" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_VALUE}>
                  {t('purchaseRequests:filters.allStatuses')}
                </SelectItem>
                {Object.values(PurchaseRequestStatus).map((value) => (
                  <SelectItem key={value} value={value}>
                    {PURCHASE_REQUEST_STATUS_LABELS[value]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
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
