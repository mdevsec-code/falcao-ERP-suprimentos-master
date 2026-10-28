import { useState, type ChangeEvent } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useMutation, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { AlertTriangle, CheckCircle2, Download, FileSpreadsheet, PackageOpen } from 'lucide-react';
import type { PublicCatalogSubmitResultDto } from '@falcao-erp/shared-types';

import { FileField } from '@/components/common/FileField';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';
import { MAX_UPLOAD_BYTES } from '@/constants/uploads';
import { publicCatalogsApi } from '@/features/supplier-catalogs/services/catalogs.api';
import type { PublicIdentityPayload } from '@/features/quotations/types';
import { ApiError, getErrorMessage } from '@/services/http/errors';
import { loadExportLanguages, withExportLanguages } from '@/utils/export/language';
import { formatCurrencyBRL } from '@/utils/format';
import { PublicInvalidLink, PublicLoading, PublicShell } from '../components/PublicShell';
import { SupplierIdentityForm } from '../components/SupplierIdentityForm';
import {
  downloadCatalogTemplate,
  readCatalogSheet,
  type CatalogRow,
} from '../lib/catalog-template';

const PREVIEW_ROWS = 50;

/**
 * Link público para o fornecedor enviar o catálogo: o arquivo (PDF, planilha
 * própria…) e/ou os itens na planilha modelo, que viram linhas para compras
 * revisar e ligar ao catálogo vivo.
 */
export function CatalogUploadPage() {
  const { token = '' } = useParams();
  const { t } = useTranslation('supplierPortal');
  const [needsRegistration, setNeedsRegistration] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [rows, setRows] = useState<CatalogRow[] | null>(null);
  const [sheetName, setSheetName] = useState<string | null>(null);
  const [reading, setReading] = useState(false);
  const [observacoes, setObservacoes] = useState('');
  const [result, setResult] = useState<PublicCatalogSubmitResultDto | null>(null);

  const query = useQuery({
    queryKey: ['public-catalog-link', token],
    queryFn: () => publicCatalogsApi.view(token),
    retry: (count, error) => !(error instanceof ApiError && error.status === 404) && count < 2,
  });

  const valid = rows?.filter((row) => !row.erro) ?? [];
  const invalid = rows?.filter((row) => row.erro) ?? [];

  const submit = useMutation({
    mutationFn: (identidade: PublicIdentityPayload) =>
      publicCatalogsApi.submit(
        token,
        {
          identidade,
          observacoes: observacoes.trim() || undefined,
          itens: valid.map(({ linha: _linha, erro: _erro, ...item }) => item),
        },
        file,
      ),
    onSuccess: (data) => {
      setResult(data);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    onError: (error: Error) => {
      if (error instanceof ApiError && error.status === 422) {
        setNeedsRegistration(true);
        toast.info(t('supplierPortal:identity.registrationNeeded'));
        return;
      }
      toast.error(getErrorMessage(error, t('supplierPortal:errors.generic')));
    },
  });

  async function handleSheet(event: ChangeEvent<HTMLInputElement>) {
    const chosen = event.target.files?.[0];
    event.target.value = '';
    if (!chosen) return;
    setReading(true);
    try {
      const parsed = await readCatalogSheet(chosen);
      setRows(parsed);
      setSheetName(chosen.name);
      if (parsed.length === 0) toast.warning(t('supplierPortal:catalog.emptySheet'));
    } catch (error) {
      setRows(null);
      setSheetName(null);
      toast.error(error instanceof Error ? error.message : t('supplierPortal:catalog.readError'));
    } finally {
      setReading(false);
    }
  }

  function reset() {
    setResult(null);
    setFile(null);
    setRows(null);
    setSheetName(null);
    setObservacoes('');
  }

  const nothingToSend = !file && valid.length === 0;

  return (
    <PublicShell portal={t('supplierPortal:catalog.portal')}>
      {query.isLoading && <PublicLoading />}
      {query.isError && (
        <PublicInvalidLink
          title={t('supplierPortal:catalog.invalidTitle')}
          description={t('supplierPortal:catalog.invalidDescription')}
        />
      )}

      {query.data && result && (
        <section className="mx-auto max-w-xl rounded-lg border border-success/30 bg-surface p-8 text-center shadow-sm">
          <CheckCircle2 className="mx-auto h-10 w-10 text-success" aria-hidden="true" />
          <h1 className="mt-3 font-display text-xl font-semibold text-ink">
            {t('supplierPortal:catalog.sentTitle')}
          </h1>
          <p className="mt-2 text-sm text-ink-soft">
            {t('supplierPortal:catalog.sentDescription', {
              fornecedor: result.fornecedor,
              count: result.itens,
              empresa: query.data.empresa,
            })}
            {result.cadastroPendente && ` ${t('supplierPortal:catalog.sentPending')}`}
          </p>
          <Button className="mt-6" variant="outline" onClick={reset}>
            {t('supplierPortal:catalog.sendAnother')}
          </Button>
        </section>
      )}

      {query.data && !result && (
        <>
          <section className="rounded-lg border border-border bg-surface p-5 shadow-sm sm:p-6">
            <p className="font-mono text-2xs uppercase tracking-[0.14em] text-brand-gold-700">
              {query.data.empresa}
            </p>
            <h1 className="mt-1 font-display text-2xl font-semibold text-ink">
              {t('supplierPortal:catalog.title')}
            </h1>
            <p className="mt-1 text-sm text-ink-soft">{t('supplierPortal:catalog.intro')}</p>
          </section>

          <SupplierIdentityForm
            needsRegistration={needsRegistration}
            isSubmitting={submit.isPending}
            submitLabel={t('supplierPortal:catalog.submit')}
            disabled={nothingToSend || reading}
            onSubmit={(identidade) => submit.mutate(identidade)}
          >
            <div className="space-y-5 border-t border-border pt-5">
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-ink">
                  {t('supplierPortal:catalog.fileStep')}
                </h3>
                <p className="text-sm text-ink-soft">{t('supplierPortal:catalog.fileHint')}</p>
                <FileField
                  label={t('supplierPortal:catalog.fileLabel')}
                  file={file}
                  onFileChange={setFile}
                  maxSize={MAX_UPLOAD_BYTES}
                  error={fileError}
                  onError={setFileError}
                />
              </div>

              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-ink">
                  {t('supplierPortal:catalog.sheetStep')}
                </h3>
                <p className="text-sm text-ink-soft">{t('supplierPortal:catalog.sheetHint')}</p>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    leftIcon={<Download className="h-4 w-4" />}
                    onClick={() =>
                      void withExportLanguages(loadExportLanguages(), () =>
                        downloadCatalogTemplate(query.data.empresa),
                      )
                    }
                  >
                    {t('supplierPortal:catalog.downloadTemplate')}
                  </Button>
                  <Button type="button" variant="outline" asChild>
                    <label className="cursor-pointer">
                      <FileSpreadsheet className="h-4 w-4" aria-hidden="true" />
                      {reading
                        ? t('supplierPortal:catalog.readingSheet')
                        : t('supplierPortal:catalog.chooseSheet')}
                      <input
                        type="file"
                        accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                        className="sr-only"
                        onChange={(e) => void handleSheet(e)}
                      />
                    </label>
                  </Button>
                </div>

                {rows && rows.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm text-ink">
                      {t('supplierPortal:catalog.sheetSummary', {
                        file: sheetName,
                        count: valid.length,
                      })}
                      {invalid.length > 0 &&
                        ` ${t('supplierPortal:catalog.sheetInvalid', { count: invalid.length })}`}
                    </p>
                    <div className="max-h-80 overflow-auto rounded-md border border-border">
                      <table className="w-full text-left text-xs">
                        <thead className="sticky top-0 bg-ink text-white">
                          <tr>
                            <th className="px-2 py-1.5">{t('supplierPortal:catalog.col.line')}</th>
                            <th className="px-2 py-1.5">{t('supplierPortal:catalog.col.code')}</th>
                            <th className="px-2 py-1.5">
                              {t('supplierPortal:catalog.col.description')}
                            </th>
                            <th className="px-2 py-1.5">{t('supplierPortal:catalog.col.unit')}</th>
                            <th className="px-2 py-1.5">{t('supplierPortal:catalog.col.brand')}</th>
                            <th className="px-2 py-1.5 text-right">
                              {t('supplierPortal:catalog.col.price')}
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {rows.slice(0, PREVIEW_ROWS).map((row) => (
                            <tr key={row.linha} className={row.erro ? 'bg-danger/10' : undefined}>
                              <td className="px-2 py-1.5 font-mono text-ink-soft">{row.linha}</td>
                              <td className="px-2 py-1.5">{row.codigoFornecedor}</td>
                              <td className="px-2 py-1.5 text-ink">
                                {row.descricao}
                                {row.erro && (
                                  <span className="mt-0.5 flex items-center gap-1 text-danger">
                                    <AlertTriangle className="h-3 w-3" aria-hidden="true" />
                                    {row.erro}
                                  </span>
                                )}
                              </td>
                              <td className="px-2 py-1.5">{row.unidade}</td>
                              <td className="px-2 py-1.5">{row.marca}</td>
                              <td className="px-2 py-1.5 text-right tabular-nums">
                                {row.preco !== undefined ? formatCurrencyBRL(row.preco) : '—'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {rows.length > PREVIEW_ROWS && (
                      <p className="text-xs text-ink-soft">
                        {t('supplierPortal:catalog.previewLimit', {
                          shown: PREVIEW_ROWS,
                          total: rows.length,
                        })}
                      </p>
                    )}
                  </div>
                )}
              </div>

              <Textarea
                label={t('supplierPortal:catalog.notes')}
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                rows={3}
                maxLength={2000}
                name="catalog-notes"
              />
              {nothingToSend && (
                <p className="flex items-center gap-2 text-sm text-ink-soft">
                  <PackageOpen className="h-4 w-4" aria-hidden="true" />
                  {t('supplierPortal:catalog.nothingToSend')}
                </p>
              )}
            </div>
          </SupplierIdentityForm>

          <p className="text-center text-2xs text-ink-soft">
            {t('supplierPortal:catalog.privacy', { empresa: query.data.empresa })}
          </p>
        </>
      )}
    </PublicShell>
  );
}

export default CatalogUploadPage;
