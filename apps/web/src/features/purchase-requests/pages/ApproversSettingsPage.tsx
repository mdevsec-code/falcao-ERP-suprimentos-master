import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Save, Search, ShieldCheck } from 'lucide-react';
import { APPROVAL_STEPS, type ApprovalStep } from '@falcao-erp/shared-types';

import { PageHeader } from '@/components/layout/PageHeader';
import { ErrorState } from '@/components/feedback/ErrorState';
import { Button } from '@/components/ui/Button';
import { Checkbox } from '@/components/ui/Checkbox';
import { Input } from '@/components/ui/Input';
import { Skeleton } from '@/components/ui/Skeleton';
import { APPROVAL_STEP_LABELS } from '@/constants/enums';
import { ROLE_LABELS } from '@/constants/roles';
import { useUsers } from '@/features/users/hooks/useUsers';
import { cn } from '@/utils/cn';
import { useApprovalSteps, useSetApprovalStep } from '../hooks/usePurchaseRequestMutations';

/**
 * Quem assina cada etapa do plano de aquisição. Qualquer um dos marcados pode
 * assinar a etapa; todos recebem o e-mail quando o pedido chega nela.
 */
export function ApproversSettingsPage() {
  const { t } = useTranslation('purchaseRequests');
  const steps = useApprovalSteps();
  const users = useUsers({ page: 1, pageSize: 100, isActive: true });
  const save = useSetApprovalStep();
  const [selected, setSelected] = useState<Record<ApprovalStep, Set<string>> | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!steps.data || selected) return;
    setSelected(
      Object.fromEntries(
        APPROVAL_STEPS.map((step) => [
          step,
          new Set(steps.data.find((row) => row.step === step)?.approvers.map((u) => u.id) ?? []),
        ]),
      ) as Record<ApprovalStep, Set<string>>,
    );
  }, [steps.data, selected]);

  const visibleUsers = useMemo(() => {
    const term = search.trim().toLowerCase();
    const all = users.data?.data ?? [];
    return term
      ? all.filter(
          (u) => u.name.toLowerCase().includes(term) || u.email.toLowerCase().includes(term),
        )
      : all;
  }, [users.data, search]);

  function toggle(step: ApprovalStep, userId: string) {
    setSelected((current) => {
      if (!current) return current;
      const next = new Set(current[step]);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return { ...current, [step]: next };
    });
  }

  const savedIds = (step: ApprovalStep) =>
    new Set(steps.data?.find((row) => row.step === step)?.approvers.map((u) => u.id) ?? []);
  const isDirty = (step: ApprovalStep) => {
    const a = savedIds(step);
    const b = selected?.[step] ?? new Set<string>();
    return a.size !== b.size || [...a].some((id) => !b.has(id));
  };

  return (
    <>
      <PageHeader
        eyebrow={t('purchaseRequests:approvers.eyebrow')}
        title={t('purchaseRequests:approvers.title')}
        description={t('purchaseRequests:approvers.description')}
      />
      <div className="space-y-6 px-6 py-8 sm:px-8">
        {(steps.isError || users.isError) && (
          <ErrorState
            title={t('purchaseRequests:approvers.errorTitle')}
            description={t('purchaseRequests:error.description')}
          />
        )}
        <Input
          aria-label={t('purchaseRequests:approvers.search')}
          placeholder={t('purchaseRequests:approvers.search')}
          leftIcon={<Search className="h-4 w-4" />}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          name="approvers-search"
          className="max-w-md"
        />
        {!selected || users.isLoading ? (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {APPROVAL_STEPS.map((step) => (
              <Skeleton key={step} className="h-64 w-full" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {APPROVAL_STEPS.map((step, index) => (
              <section
                key={step}
                aria-labelledby={`step-${step}`}
                className="flex flex-col rounded-lg border border-border bg-surface p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-mono text-2xs uppercase tracking-[0.12em] text-brand-gold-700">
                      {t('purchaseRequests:approvers.stepNumber', { number: index + 1 })}
                    </p>
                    <h2 id={`step-${step}`} className="text-base font-semibold text-ink">
                      {APPROVAL_STEP_LABELS[step]}
                    </h2>
                    <p className="text-xs text-ink-soft">
                      {t(`purchaseRequests:approvers.hint.${step}`)}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="primary"
                    leftIcon={<Save className="h-3.5 w-3.5" />}
                    disabled={!isDirty(step)}
                    isLoading={save.isPending && save.variables?.step === step}
                    onClick={() => save.mutate({ step, userIds: [...selected[step]] })}
                  >
                    {t('common:actions.save')}
                  </Button>
                </div>
                {selected[step].size === 0 && (
                  <p className="mt-3 flex items-center gap-2 rounded-md bg-brand-gold-50 px-3 py-2 text-xs text-ink">
                    <ShieldCheck className="h-4 w-4 text-brand-gold-700" aria-hidden="true" />
                    {t('purchaseRequests:approvers.noneHint')}
                  </p>
                )}
                <ul className="mt-3 max-h-72 divide-y divide-border overflow-y-auto rounded-md border border-border">
                  {visibleUsers.map((user) => {
                    const checked = selected[step].has(user.id);
                    const id = `approver-${step}-${user.id}`;
                    return (
                      <li
                        key={user.id}
                        className={cn(
                          'flex items-center gap-3 px-3 py-2 hover:bg-hover',
                          checked && 'bg-brand-gold-50/60',
                        )}
                      >
                        <Checkbox
                          id={id}
                          checked={checked}
                          onCheckedChange={() => toggle(step, user.id)}
                        />
                        <label htmlFor={id} className="min-w-0 flex-1 cursor-pointer text-sm">
                          <span className="block truncate font-medium text-ink">{user.name}</span>
                          <span className="block truncate text-xs text-ink-soft">
                            {user.email} · {ROLE_LABELS[user.role]}
                          </span>
                        </label>
                      </li>
                    );
                  })}
                </ul>
              </section>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

export default ApproversSettingsPage;
