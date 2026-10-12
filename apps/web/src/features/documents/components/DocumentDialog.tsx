import { useEffect, useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { Upload } from 'lucide-react';
import { DocumentCategory } from '@falcao-erp/shared-types';

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
import { FileField } from '@/components/common/FileField';
import { SelectField } from '@/components/common/SelectField';
import { CENTRAL_DOCUMENT_CATEGORY_LABELS } from '@/constants/enums';
import { PERMISSIONS } from '@/constants/permissions';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useActiveSupplierOptions } from '@/features/suppliers/hooks/useSuppliers';
import { useActiveContractOptions } from '@/features/contracts/hooks/useContracts';
import {
  documentFormSchema,
  emptyDocumentForm,
  MAX_DOCUMENT_BYTES,
  toDocumentForm,
  type DocumentDto,
  type DocumentFormInput,
} from '../types';

interface DocumentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** `null` = enviar novo; um documento = editar metadados. */
  document: DocumentDto | null;
  /** Valores iniciais no envio (ex.: contrato e categoria vindos do detalhe do contrato). */
  preset?: Partial<DocumentFormInput>;
  /** Esconde fornecedor/contrato quando o vínculo já vem do contexto. */
  lockLinks?: boolean;
  onUpload: (input: DocumentFormInput, file: File) => void;
  onUpdate: (input: DocumentFormInput) => void;
  isSubmitting: boolean;
}

export function DocumentDialog({
  open,
  onOpenChange,
  document,
  preset,
  lockLinks = false,
  onUpload,
  onUpdate,
  isSubmitting,
}: DocumentDialogProps) {
  const { t } = useTranslation('documents');
  const { can } = useAuth();
  const isEdit = document !== null;
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);

  const {
    register,
    control,
    handleSubmit,
    reset,
    setValue,
    getValues,
    formState: { errors },
  } = useForm<DocumentFormInput>({
    resolver: zodResolver(documentFormSchema),
    mode: 'onTouched',
    defaultValues: emptyDocumentForm(preset),
  });

  useEffect(() => {
    if (!open) return;
    reset(document ? toDocumentForm(document) : emptyDocumentForm(preset));
    setFile(null);
    setFileError(null);
    // `preset` costuma ser um objeto literal novo a cada render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, document, reset]);

  const { data: suppliersPage } = useActiveSupplierOptions();
  const canReadContracts = can(PERMISSIONS.CONTRACT_READ);
  const { data: contractsPage } = useActiveContractOptions(open && canReadContracts && !lockLinks);

  const supplierOptions = useMemo(
    () =>
      (suppliersPage?.data ?? [])
        .map((s) => ({ value: s.id, label: s.nomeFantasia }))
        .sort((a, b) => a.label.localeCompare(b.label)),
    [suppliersPage],
  );
  const contractOptions = useMemo(() => {
    const options = (contractsPage?.data ?? []).map((c) => ({
      value: c.id,
      label: `${c.numero} · ${c.objeto}`,
    }));
    if (document?.contractId && !options.some((o) => o.value === document.contractId)) {
      options.push({ value: document.contractId, label: document.contractNumero ?? '' });
    }
    return options;
  }, [contractsPage, document]);

  const categoryOptions = Object.values(DocumentCategory).map((value) => ({
    value,
    label: CENTRAL_DOCUMENT_CATEGORY_LABELS[value],
  }));

  function handleFileChange(next: File | null) {
    setFile(next);
    // Título sugerido a partir do nome do arquivo, se ainda estiver vazio.
    if (next && !getValues('titulo')) {
      setValue('titulo', next.name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' '), {
        shouldValidate: true,
      });
    }
  }

  function submit(values: DocumentFormInput) {
    if (isEdit) return onUpdate(values);
    if (!file) {
      setFileError(t('documents:dialog.fileRequired'));
      return;
    }
    onUpload(values, file);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? t('documents:dialog.editTitle') : t('documents:dialog.uploadTitle')}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? t('documents:dialog.editDescription', { name: document?.fileName ?? '' })
              : t('documents:dialog.uploadDescription')}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(submit)} noValidate className="space-y-4">
          {!isEdit && (
            <FileField
              label={t('documents:dialog.file')}
              file={file}
              onFileChange={handleFileChange}
              maxSize={MAX_DOCUMENT_BYTES}
              error={fileError}
              onError={setFileError}
              disabled={isSubmitting}
            />
          )}

          <Input
            {...register('titulo')}
            label={t('documents:fields.titulo')}
            error={errors.titulo?.message}
            required
          />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Controller
              control={control}
              name="categoria"
              render={({ field }) => (
                <SelectField
                  id="document-category"
                  label={t('documents:fields.categoria')}
                  placeholder={t('documents:placeholders.categoria')}
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  options={categoryOptions}
                  error={errors.categoria?.message}
                  required
                />
              )}
            />
            <Input
              {...register('validoAte')}
              type="date"
              label={t('documents:fields.validoAte')}
              hint={t('documents:hints.validoAte')}
              error={errors.validoAte?.message}
            />
          </div>
          <Input
            {...register('tags')}
            label={t('documents:fields.tags')}
            placeholder={t('documents:placeholders.tags')}
            hint={t('documents:hints.tags')}
            error={errors.tags?.message}
          />

          {!lockLinks && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Controller
                control={control}
                name="supplierId"
                render={({ field }) => (
                  <SelectField
                    id="document-supplier"
                    label={t('documents:fields.supplier')}
                    noneLabel={t('documents:placeholders.noSupplier')}
                    value={field.value}
                    onChange={field.onChange}
                    options={supplierOptions}
                  />
                )}
              />
              {canReadContracts && (
                <Controller
                  control={control}
                  name="contractId"
                  render={({ field }) => (
                    <SelectField
                      id="document-contract"
                      label={t('documents:fields.contract')}
                      noneLabel={t('documents:placeholders.noContract')}
                      value={field.value}
                      onChange={field.onChange}
                      options={contractOptions}
                    />
                  )}
                />
              )}
            </div>
          )}

          <Textarea
            {...register('descricao')}
            label={t('documents:fields.descricao')}
            hint={t('common:form.optional')}
            error={errors.descricao?.message}
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
            <Button
              type="submit"
              variant="primary"
              isLoading={isSubmitting}
              leftIcon={isEdit ? undefined : <Upload className="h-4 w-4" />}
            >
              {isEdit ? t('common:actions.save') : t('documents:dialog.submitUpload')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
