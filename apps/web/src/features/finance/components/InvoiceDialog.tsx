import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { AlertTriangle, FileCode2, FileText, Trash2, Upload } from 'lucide-react';
import type { InvoiceXmlCheckDto } from '@falcao-erp/shared-types';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/Dialog';
import { API_ORIGIN } from '@/config/env';
import { MAX_UPLOAD_BYTES } from '@/constants/uploads';
import { formatFileSize } from '@/utils/format';
import { useRemoveInvoiceFile, useUploadInvoiceFile } from '../hooks/useFinance';
import { invoiceFormSchema, type InvoiceFormInput, type PayableDto } from '../types';

interface InvoiceDialogProps {
  payable: PayableDto | null;
  onOpenChange: (open: boolean) => void;
  onSubmit: (input: InvoiceFormInput) => void;
  isSubmitting: boolean;
  /** Pode anexar/remover arquivos (perfil com escrita no financeiro). */
  canAttach: boolean;
}

/** Conciliação: vincula a nota fiscal (número, emissão e os arquivos PDF/XML) à conta. */
export function InvoiceDialog({
  payable,
  onOpenChange,
  onSubmit,
  isSubmitting,
  canAttach,
}: InvoiceDialogProps) {
  const { t } = useTranslation('finance');
  const upload = useUploadInvoiceFile();
  const removeFile = useRemoveInvoiceFile();
  const fileInput = useRef<HTMLInputElement>(null);
  const [current, setCurrent] = useState<PayableDto | null>(payable);
  const [check, setCheck] = useState<InvoiceXmlCheckDto | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<InvoiceFormInput>({
    resolver: zodResolver(invoiceFormSchema),
    mode: 'onTouched',
  });

  useEffect(() => {
    setCurrent(payable);
    setCheck(null);
    if (payable) {
      reset({
        notaFiscal: payable.notaFiscal ?? '',
        notaFiscalEmissao: payable.notaFiscalEmissao ?? '',
      });
    }
  }, [payable, reset]);

  function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file || !current) return;
    if (file.size > MAX_UPLOAD_BYTES) {
      toast.error(t('common:file.tooLarge', { max: formatFileSize(MAX_UPLOAD_BYTES) }));
      return;
    }
    upload.mutate(
      { id: current.id, file },
      {
        onSuccess: (result) => {
          setCurrent(result.payable);
          setCheck(result.xml);
          // O XML já gravou número e emissão; o formulário mostra o que ficou salvo.
          reset({
            notaFiscal: result.payable.notaFiscal ?? '',
            notaFiscalEmissao: result.payable.notaFiscalEmissao ?? '',
          });
        },
      },
    );
  }

  const files = current
    ? [
        current.notaFiscalPdfUrl && {
          kind: 'pdf' as const,
          url: current.notaFiscalPdfUrl,
          name: current.notaFiscalPdfName,
          icon: FileText,
        },
        current.notaFiscalXmlUrl && {
          kind: 'xml' as const,
          url: current.notaFiscalXmlUrl,
          name: current.notaFiscalXmlName,
          icon: FileCode2,
        },
      ].filter((f): f is Exclude<typeof f, '' | null | false> => Boolean(f))
    : [];

  return (
    <Dialog open={payable !== null} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{t('finance:invoiceDialog.title')}</DialogTitle>
          <DialogDescription>
            {t('finance:invoiceDialog.description', { name: payable?.descricao ?? '' })}
          </DialogDescription>
        </DialogHeader>

        <section
          aria-labelledby="invoice-files"
          className="space-y-3 rounded-md border border-border bg-bg/40 p-3"
        >
          <div className="flex items-center justify-between gap-2">
            <h3 id="invoice-files" className="text-sm font-semibold text-ink">
              {t('finance:invoiceDialog.files')}
            </h3>
            {canAttach && current?.status !== 'CANCELADO' && (
              <>
                <input
                  ref={fileInput}
                  type="file"
                  accept=".pdf,.xml,application/pdf,text/xml,application/xml"
                  className="sr-only"
                  onChange={handleFile}
                  aria-label={t('finance:invoiceDialog.attach')}
                />
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  leftIcon={<Upload className="h-3.5 w-3.5" />}
                  isLoading={upload.isPending}
                  onClick={() => fileInput.current?.click()}
                >
                  {t('finance:invoiceDialog.attach')}
                </Button>
              </>
            )}
          </div>
          <p className="text-xs text-ink-soft">
            {t('finance:invoiceDialog.filesHint', { max: formatFileSize(MAX_UPLOAD_BYTES) })}
          </p>
          {files.length === 0 && (
            <p className="text-xs text-ink-soft">{t('finance:invoiceDialog.noFiles')}</p>
          )}
          <ul className="space-y-1.5">
            {files.map((file) => (
              <li key={file.kind} className="flex items-center gap-2 text-sm">
                <file.icon className="h-4 w-4 shrink-0 text-ink-soft" aria-hidden="true" />
                <a
                  href={`${API_ORIGIN}${file.url}`}
                  target="_blank"
                  rel="noreferrer"
                  className="min-w-0 flex-1 truncate text-ink hover:text-brand-gold-700 hover:underline"
                >
                  {file.name ?? file.kind.toUpperCase()}
                </a>
                {canAttach && (
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    aria-label={t('finance:invoiceDialog.removeFile', {
                      name: file.name ?? file.kind,
                    })}
                    isLoading={removeFile.isPending && removeFile.variables?.kind === file.kind}
                    onClick={() =>
                      current &&
                      removeFile.mutate(
                        { id: current.id, kind: file.kind },
                        {
                          onSuccess: (updated) => setCurrent(updated as PayableDto),
                        },
                      )
                    }
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                )}
              </li>
            ))}
          </ul>
          {current?.notaFiscalChave && (
            <p className="break-all font-mono text-2xs text-ink-soft">
              {t('finance:invoiceDialog.key', { key: current.notaFiscalChave })}
            </p>
          )}
          {check && check.avisos.length > 0 && (
            <ul
              role="alert"
              className="space-y-1 rounded-md border border-warning/40 bg-warning/10 p-2.5 text-xs text-ink"
            >
              {check.avisos.map((aviso) => (
                <li key={aviso} className="flex gap-1.5">
                  <AlertTriangle
                    className="mt-0.5 h-3.5 w-3.5 shrink-0 text-warning"
                    aria-hidden="true"
                  />
                  {aviso}
                </li>
              ))}
            </ul>
          )}
        </section>

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              {...register('notaFiscal')}
              label={t('finance:fields.notaFiscal')}
              inputClassName="font-mono"
              error={errors.notaFiscal?.message}
              required
            />
            <Input
              {...register('notaFiscalEmissao')}
              type="date"
              label={t('finance:fields.notaFiscalEmissao')}
              error={errors.notaFiscalEmissao?.message}
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              {t('common:actions.close')}
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting}>
              {t('common:actions.save')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
