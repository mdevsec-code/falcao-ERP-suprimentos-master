import { useEffect, useMemo } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { Trash2 } from 'lucide-react';
import { AgendaEventType } from '@falcao-erp/shared-types';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Switch } from '@/components/ui/Switch';
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
import { AGENDA_EVENT_TYPE_LABELS } from '@/constants/enums';
import { useActiveSupplierOptions } from '@/features/suppliers/hooks/useSuppliers';
import { CostCenterInput } from './CostCenterInput';
import {
  agendaEventFormSchema,
  emptyEventForm,
  toEventForm,
  type AgendaEventFormInput,
  type AgendaItemDto,
} from '../types';

interface EventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** `null` = novo evento; um item `EVENT` = editar. */
  event: AgendaItemDto | null;
  /** Dia pré-selecionado ao criar (o dia clicado no calendário). */
  defaultDate: string;
  onSubmit: (values: AgendaEventFormInput) => void;
  onDelete?: () => void;
  isSubmitting: boolean;
}

export function EventDialog({
  open,
  onOpenChange,
  event,
  defaultDate,
  onSubmit,
  onDelete,
  isSubmitting,
}: EventDialogProps) {
  const { t } = useTranslation('agenda');
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AgendaEventFormInput>({
    resolver: zodResolver(agendaEventFormSchema),
    mode: 'onTouched',
    defaultValues: emptyEventForm(defaultDate),
  });

  useEffect(() => {
    if (open) reset(event ? toEventForm(event) : emptyEventForm(defaultDate));
  }, [open, event, defaultDate, reset]);

  const diaInteiro = useWatch({ control, name: 'diaInteiro' });
  const { data: suppliersPage } = useActiveSupplierOptions();
  const supplierOptions = useMemo(
    () =>
      (suppliersPage?.data ?? [])
        .map((s) => ({ value: s.id, label: s.nomeFantasia }))
        .sort((a, b) => a.label.localeCompare(b.label)),
    [suppliersPage],
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>
            {event ? t('agenda:dialog.editTitle') : t('agenda:dialog.createTitle')}
          </DialogTitle>
          <DialogDescription>{t('agenda:dialog.description')}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-[2fr_1fr]">
            <Input
              {...register('titulo')}
              label={t('agenda:fields.titulo')}
              placeholder={t('agenda:placeholders.titulo')}
              error={errors.titulo?.message}
              required
            />
            <Controller
              control={control}
              name="tipo"
              render={({ field }) => (
                <SelectField
                  id="event-type"
                  label={t('agenda:fields.tipo')}
                  placeholder={t('agenda:placeholders.tipo')}
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  options={Object.values(AgendaEventType).map((value) => ({
                    value,
                    label: AGENDA_EVENT_TYPE_LABELS[value],
                  }))}
                  error={errors.tipo?.message}
                  required
                />
              )}
            />
          </div>

          <div className="grid grid-cols-1 items-end gap-4 sm:grid-cols-[1fr_auto]">
            <Input
              {...register('data')}
              type="date"
              label={t('agenda:fields.data')}
              error={errors.data?.message}
              required
            />
            <Controller
              control={control}
              name="diaInteiro"
              render={({ field }) => (
                <div className="flex h-10 items-center gap-2">
                  <Switch
                    id="event-all-day"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                  <Label htmlFor="event-all-day">{t('agenda:fields.diaInteiro')}</Label>
                </div>
              )}
            />
          </div>

          {!diaInteiro && (
            <div className="grid animate-fade-in grid-cols-2 gap-4">
              <Input
                {...register('horaInicio')}
                type="time"
                label={t('agenda:fields.horaInicio')}
                error={errors.horaInicio?.message}
                required
              />
              <Input
                {...register('horaFim')}
                type="time"
                label={t('agenda:fields.horaFim')}
                error={errors.horaFim?.message}
              />
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <CostCenterInput
              {...register('obra')}
              label={t('agenda:fields.obra')}
              error={errors.obra?.message}
            />
            <Input
              {...register('local')}
              label={t('agenda:fields.local')}
              placeholder={t('agenda:placeholders.local')}
              error={errors.local?.message}
            />
          </div>

          <Controller
            control={control}
            name="supplierId"
            render={({ field }) => (
              <SelectField
                id="event-supplier"
                label={t('agenda:fields.supplier')}
                noneLabel={t('agenda:placeholders.noSupplier')}
                value={field.value}
                onChange={field.onChange}
                options={supplierOptions}
              />
            )}
          />

          <Textarea
            {...register('descricao')}
            label={t('agenda:fields.descricao')}
            hint={t('common:form.optional')}
            error={errors.descricao?.message}
            rows={2}
          />

          <DialogFooter className="sm:justify-between">
            {event && onDelete ? (
              <Button
                type="button"
                variant="ghost"
                className="text-danger"
                leftIcon={<Trash2 className="h-4 w-4" />}
                onClick={onDelete}
                disabled={isSubmitting}
              >
                {t('agenda:dialog.delete')}
              </Button>
            ) : (
              <span />
            )}
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                {t('common:actions.cancel')}
              </Button>
              <Button type="submit" variant="primary" isLoading={isSubmitting}>
                {event ? t('common:actions.save') : t('agenda:dialog.submitCreate')}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
