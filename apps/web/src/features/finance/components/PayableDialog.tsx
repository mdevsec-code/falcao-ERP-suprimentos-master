import { useEffect, useMemo } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/Dialog';
import { SelectField } from '@/components/common/SelectField';
import { useActiveSupplierOptions } from '@/features/suppliers/hooks/useSuppliers';
import { useActiveContractOptions } from '@/features/contracts/hooks/useContracts';
import { purchaseRequestsApi } from '@/features/purchase-requests/services/purchaseRequests.api';
import { CostCenterInput } from '@/features/agenda/components/CostCenterInput';
import {
  emptyPayableForm,
  payableFormSchema,
  toPayableForm,
  type PayableDto,
  type PayableFormInput,
} from '../types';

interface PayableDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** `null` = lançar nova conta; uma conta = editar. */
  payable: PayableDto | null;
  /** Valores sugeridos numa conta nova (ex.: lidos do XML da NF-e). */
  initialValues?: Partial<PayableFormInput> | null;
  onSubmit: (values: PayableFormInput) => void;
  isSubmitting: boolean;
}

export function PayableDialog({
  open,
  onOpenChange,
  payable,
  initialValues,
  onSubmit,
  isSubmitting,
}: PayableDialogProps) {
  const { t } = useTranslation('finance');
  const isReimbursement = payable?.origem === 'REEMBOLSO';

  const {
    register,
    control,
    handleSubmit,
    reset,
    getValues,
    setValue,
    formState: { errors },
  } = useForm<PayableFormInput>({
    resolver: zodResolver(payableFormSchema),
    mode: 'onTouched',
    defaultValues: emptyPayableForm(),
  });

  useEffect(() => {
    if (open) reset(payable ? toPayableForm(payable) : { ...emptyPayableForm(), ...initialValues });
  }, [open, payable, initialValues, reset]);

  const { data: suppliersPage } = useActiveSupplierOptions();
  const { data: contractsPage } = useActiveContractOptions(open && !isReimbursement);
  const { data: requestsPage } = useQuery({
    queryKey: ['purchase-requests', 'list', { page: 1, pageSize: 100, scope: 'payable-links' }],
    queryFn: () => purchaseRequestsApi.list({ page: 1, pageSize: 100 }),
    enabled: open && !isReimbursement,
  });

  const supplierOptions = useMemo(
    () =>
      (suppliersPage?.data ?? [])
        .map((s) => ({ value: s.id, label: s.nomeFantasia }))
        .sort((a, b) => a.label.localeCompare(b.label)),
    [suppliersPage],
  );
  const contracts = contractsPage?.data ?? [];
  const requests = (requestsPage?.data ?? []).filter((r) => r.status !== 'REJEITADO');

  /** Ao vincular, herda o que estiver em branco — a API faz o mesmo. */
  function handleContractChange(contractId: string, onChange: (value: string) => void) {
    onChange(contractId);
    const contract = contracts.find((c) => c.id === contractId);
    if (!contract) return;
    if (!getValues('supplierId')) setValue('supplierId', contract.supplierId);
    if (!getValues('costCenter') && contract.costCenter)
      setValue('costCenter', contract.costCenter);
    if (!getValues('descricao'))
      setValue('descricao', `${contract.numero} · ${contract.objeto}`, { shouldValidate: true });
  }

  function handleRequestChange(requestId: string, onChange: (value: string) => void) {
    onChange(requestId);
    const request = requests.find((r) => r.id === requestId);
    if (!request) return;
    if (!getValues('costCenter') && request.costCenter) setValue('costCenter', request.costCenter);
    if (!getValues('descricao')) setValue('descricao', request.title, { shouldValidate: true });
    if (!getValues('valor') && request.estimatedTotal)
      setValue('valor', Number(request.estimatedTotal), { shouldValidate: true });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {payable ? t('finance:dialog.editTitle') : t('finance:dialog.createTitle')}
          </DialogTitle>
          <DialogDescription>
            {isReimbursement
              ? t('finance:dialog.reimbursementDescription')
              : t('finance:dialog.description')}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          <Input
            {...register('descricao')}
            label={t('finance:fields.descricao')}
            error={errors.descricao?.message}
            required
          />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              {...register('valor')}
              type="number"
              min={0}
              step="0.01"
              label={t('finance:fields.valor')}
              error={errors.valor?.message}
              readOnly={isReimbursement}
              required
            />
            <Input
              {...register('vencimento')}
              type="date"
              label={t('finance:fields.vencimento')}
              error={errors.vencimento?.message}
              required
            />
          </div>

          {!isReimbursement && (
            <fieldset className="space-y-4 rounded-md border border-dashed border-border p-4">
              <legend className="px-1 font-mono text-2xs uppercase tracking-[0.14em] text-ink-soft">
                {t('finance:dialog.linksLegend')}
              </legend>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Controller
                  control={control}
                  name="contractId"
                  render={({ field }) => (
                    <SelectField
                      id="payable-contract"
                      label={t('finance:fields.contract')}
                      noneLabel={t('finance:placeholders.none')}
                      value={field.value}
                      onChange={(v) => handleContractChange(v, field.onChange)}
                      options={contracts.map((c) => ({
                        value: c.id,
                        label: `${c.numero} · ${c.objeto}`,
                      }))}
                    />
                  )}
                />
                <Controller
                  control={control}
                  name="purchaseRequestId"
                  render={({ field }) => (
                    <SelectField
                      id="payable-request"
                      label={t('finance:fields.purchaseRequest')}
                      noneLabel={t('finance:placeholders.none')}
                      value={field.value}
                      onChange={(v) => handleRequestChange(v, field.onChange)}
                      options={requests.map((r) => ({ value: r.id, label: r.title }))}
                    />
                  )}
                />
                <Controller
                  control={control}
                  name="supplierId"
                  render={({ field }) => (
                    <SelectField
                      id="payable-supplier"
                      label={t('finance:fields.supplier')}
                      noneLabel={t('finance:placeholders.none')}
                      value={field.value}
                      onChange={field.onChange}
                      options={supplierOptions}
                    />
                  )}
                />
                <CostCenterInput
                  {...register('costCenter')}
                  label={t('finance:fields.costCenter')}
                  error={errors.costCenter?.message}
                />
              </div>
            </fieldset>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              {...register('notaFiscal')}
              label={t('finance:fields.notaFiscal')}
              hint={t('finance:hints.notaFiscal')}
              inputClassName="font-mono"
              error={errors.notaFiscal?.message}
            />
            <Input
              {...register('notaFiscalEmissao')}
              type="date"
              label={t('finance:fields.notaFiscalEmissao')}
              error={errors.notaFiscalEmissao?.message}
            />
          </div>
          <Textarea
            {...register('observacoes')}
            label={t('finance:fields.observacoes')}
            hint={t('common:form.optional')}
            error={errors.observacoes?.message}
            rows={2}
          />

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              {t('common:actions.cancel')}
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting}>
              {payable ? t('common:actions.save') : t('finance:dialog.submitCreate')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
