import { Filter, Search, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { AuditAction } from '@falcao-erp/shared-types';

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
import { AUDIT_ACTION_LABELS } from '@/constants/enums';
import { formatDate } from '@/utils/format';
import { entityLabel, type AuditFilters } from '../types';

const ALL_VALUE = '__all';

interface FiltersBarProps {
  filters: AuditFilters;
  entityTypes: readonly string[];
  onChange: (patch: Partial<AuditFilters>) => void;
  onClearAll: () => void;
}

export function FiltersBar({ filters, entityTypes, onChange, onClearAll }: FiltersBarProps) {
  const { t } = useTranslation('audit');
  const chips: { key: keyof AuditFilters; label: string }[] = [];
  if (filters.action)
    chips.push({
      key: 'action',
      label: t('audit:filters.chipAction', { value: AUDIT_ACTION_LABELS[filters.action] }),
    });
  if (filters.entityType)
    chips.push({
      key: 'entityType',
      label: t('audit:filters.chipEntity', { value: entityLabel(filters.entityType) }),
    });
  if (filters.from)
    chips.push({
      key: 'from',
      label: t('audit:filters.chipFrom', { value: formatDate(`${filters.from}T00:00:00`) }),
    });
  if (filters.to)
    chips.push({
      key: 'to',
      label: t('audit:filters.chipTo', { value: formatDate(`${filters.to}T00:00:00`) }),
    });
  if (filters.busca)
    chips.push({ key: 'busca', label: t('audit:filters.chipSearch', { value: filters.busca }) });

  return (
    <div className="filter-panel space-y-4">
      <div className="flex items-center gap-2">
        <Filter className="h-4 w-4 text-ink-soft" aria-hidden="true" />
        <span className="text-sm font-semibold text-ink">{t('audit:filters.title')}</span>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-[2fr_1fr_1fr_1fr_1fr]">
        <Input
          label={t('audit:filters.search.label')}
          placeholder={t('audit:filters.search.placeholder')}
          leftIcon={<Search className="h-4 w-4" />}
          value={filters.busca ?? ''}
          onChange={(e) => onChange({ busca: e.target.value || undefined })}
          name="audit-search"
        />

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="audit-filter-action">{t('audit:filters.action')}</Label>
          <Select
            value={filters.action ?? ALL_VALUE}
            onValueChange={(v) =>
              onChange({ action: v === ALL_VALUE ? undefined : (v as AuditAction) })
            }
          >
            <SelectTrigger id="audit-filter-action" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_VALUE}>{t('audit:filters.allActions')}</SelectItem>
              {Object.values(AuditAction).map((action) => (
                <SelectItem key={action} value={action}>
                  {AUDIT_ACTION_LABELS[action]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="audit-filter-entity">{t('audit:filters.entity')}</Label>
          <Select
            value={filters.entityType ?? ALL_VALUE}
            onValueChange={(v) => onChange({ entityType: v === ALL_VALUE ? undefined : v })}
          >
            <SelectTrigger id="audit-filter-entity" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_VALUE}>{t('audit:filters.allEntities')}</SelectItem>
              {entityTypes.map((type) => (
                <SelectItem key={type} value={type}>
                  {entityLabel(type)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Input
          type="date"
          label={t('audit:filters.from')}
          value={filters.from ?? ''}
          max={filters.to}
          onChange={(e) => onChange({ from: e.target.value || undefined })}
          name="audit-from"
        />
        <Input
          type="date"
          label={t('audit:filters.to')}
          value={filters.to ?? ''}
          min={filters.from}
          onChange={(e) => onChange({ to: e.target.value || undefined })}
          name="audit-to"
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
