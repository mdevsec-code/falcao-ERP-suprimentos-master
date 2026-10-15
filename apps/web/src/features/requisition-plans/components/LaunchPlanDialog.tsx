import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Rocket, Search } from 'lucide-react';
import type { RequisitionPlanDetailDto } from '@falcao-erp/shared-types';

import { Button } from '@/components/ui/Button';
import { Checkbox } from '@/components/ui/Checkbox';
import { Input } from '@/components/ui/Input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/Dialog';
import { SUPPLIER_CATEGORY_LABELS } from '@/constants/enums';
import { useActiveSupplierOptions } from '@/features/suppliers/hooks/useSuppliers';
import { cn } from '@/utils/cn';
import { formatDateOnly } from '@/utils/format';
import { useLaunchPlan } from '../hooks/usePlans';

const MAX_SUPPLIERS = 20;

interface LaunchPlanDialogProps {
  plan: RequisitionPlanDetailDto;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Lançar o plano abre a cotação com os itens consolidados e o link aberto
 * ligado. Convidar fornecedores aqui é opcional — os habituais já recebem o
 * link próprio; os demais entram pelo link aberto.
 */
export function LaunchPlanDialog({ plan, open, onOpenChange }: LaunchPlanDialogProps) {
  const { t } = useTranslation('plans');
  const launch = useLaunchPlan(plan.id);
  const { data: suppliersPage } = useActiveSupplierOptions();
  const suppliers = useMemo(() => suppliersPage?.data ?? [], [suppliersPage]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (open) {
      setSelected(new Set());
      setSearch('');
    }
  }, [open]);

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return suppliers;
    return suppliers.filter(
      (s) =>
        s.nomeFantasia.toLowerCase().includes(term) ||
        s.razaoSocial.toLowerCase().includes(term) ||
        SUPPLIER_CATEGORY_LABELS[s.categoria].toLowerCase().includes(term),
    );
  }, [suppliers, search]);

  function toggle(id: string) {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t('plans:launch.title', { numero: plan.numero })}</DialogTitle>
          <DialogDescription>
            {t('plans:launch.description', {
              items: plan.items.length,
              requests: plan.requests.length,
              prazo: formatDateOnly(plan.prazoResposta),
            })}
          </DialogDescription>
        </DialogHeader>

        <fieldset className="space-y-2">
          <legend className="text-xs font-semibold text-ink-soft">
            {t('plans:launch.invite', { count: selected.size, max: MAX_SUPPLIERS })}
          </legend>
          <p className="text-xs text-ink-soft">{t('plans:launch.inviteHint')}</p>
          <Input
            aria-label={t('plans:launch.search')}
            placeholder={t('plans:launch.search')}
            leftIcon={<Search className="h-4 w-4" />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            name="launch-supplier-search"
          />
          <ul className="max-h-[40vh] divide-y divide-border overflow-y-auto rounded-md border border-border">
            {visible.map((supplier) => {
              const checked = selected.has(supplier.id);
              return (
                <li
                  key={supplier.id}
                  className={cn(
                    'flex items-start gap-3 px-3 py-2 hover:bg-hover',
                    checked && 'bg-brand-gold-50/60',
                  )}
                >
                  <Checkbox
                    id={`launch-supplier-${supplier.id}`}
                    checked={checked}
                    onCheckedChange={() => toggle(supplier.id)}
                    className="mt-0.5"
                  />
                  <label
                    htmlFor={`launch-supplier-${supplier.id}`}
                    className="min-w-0 flex-1 cursor-pointer text-sm"
                  >
                    <span className="block font-medium text-ink">{supplier.nomeFantasia}</span>
                    <span className="text-xs text-ink-soft">
                      {SUPPLIER_CATEGORY_LABELS[supplier.categoria]} · {supplier.cidade}/
                      {supplier.estado}
                    </span>
                  </label>
                </li>
              );
            })}
            {visible.length === 0 && (
              <li className="px-3 py-6 text-center text-sm text-ink-soft">
                {t('plans:launch.noSuppliers')}
              </li>
            )}
          </ul>
          {selected.size > MAX_SUPPLIERS && (
            <p className="text-xs text-danger">
              {t('plans:launch.tooMany', { max: MAX_SUPPLIERS })}
            </p>
          )}
        </fieldset>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={launch.isPending}>
            {t('common:actions.cancel')}
          </Button>
          <Button
            variant="primary"
            leftIcon={<Rocket className="h-4 w-4" />}
            disabled={selected.size > MAX_SUPPLIERS}
            isLoading={launch.isPending}
            onClick={() => launch.mutate([...selected], { onSuccess: () => onOpenChange(false) })}
          >
            {t('plans:launch.submit')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
