import { Filter, Search, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { Role } from '@falcao-erp/shared-types';

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
import { ALL_ROLES, ROLE_LABELS } from '@/constants/roles';
import type { UserFilters } from '../types';

const ALL_VALUE = '__all';

interface FiltersBarProps {
  filters: UserFilters;
  onChange: (patch: Partial<UserFilters>) => void;
  onClearAll: () => void;
}

export function FiltersBar({ filters, onChange, onClearAll }: FiltersBarProps) {
  const { t } = useTranslation('users');
  const chips: { key: keyof UserFilters; label: string }[] = [];
  if (filters.role)
    chips.push({
      key: 'role',
      label: t('users:filters.chipRole', { value: ROLE_LABELS[filters.role] }),
    });
  if (filters.status)
    chips.push({
      key: 'status',
      label: t('users:filters.chipStatus', { value: t(`common:status.${filters.status}`) }),
    });
  if (filters.busca)
    chips.push({ key: 'busca', label: t('users:filters.chipSearch', { value: filters.busca }) });

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Filter className="h-4 w-4 text-ink-soft" aria-hidden="true" />
        <span className="text-sm font-semibold text-ink">{t('users:filters.title')}</span>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-[2fr_1.2fr_1fr]">
        <Input
          label={t('users:filters.search.label')}
          placeholder={t('users:filters.search.placeholder')}
          leftIcon={<Search className="h-4 w-4" />}
          value={filters.busca ?? ''}
          onChange={(e) => onChange({ busca: e.target.value || undefined })}
          name="user-search"
        />

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="users-filter-role">{t('users:filters.role')}</Label>
          <Select
            value={filters.role ?? ALL_VALUE}
            onValueChange={(v) => onChange({ role: v === ALL_VALUE ? undefined : (v as Role) })}
          >
            <SelectTrigger id="users-filter-role" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_VALUE}>{t('users:filters.allRoles')}</SelectItem>
              {ALL_ROLES.map((role) => (
                <SelectItem key={role} value={role}>
                  {ROLE_LABELS[role]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="users-filter-status">{t('users:filters.status')}</Label>
          <Select
            value={filters.status ?? ALL_VALUE}
            onValueChange={(v) =>
              onChange({ status: v === ALL_VALUE ? undefined : (v as UserFilters['status']) })
            }
          >
            <SelectTrigger id="users-filter-status" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_VALUE}>{t('users:filters.allStatuses')}</SelectItem>
              <SelectItem value="active">{t('common:status.active')}</SelectItem>
              <SelectItem value="inactive">{t('common:status.inactive')}</SelectItem>
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
