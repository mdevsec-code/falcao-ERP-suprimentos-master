import { useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { AlarmClock, FileStack, FileWarning, Filter, Hash, Search, Upload, X } from 'lucide-react';
import { DocumentCategory } from '@falcao-erp/shared-types';

import { PageHeader } from '@/components/layout/PageHeader';
import { StatTile } from '@/components/data-display/StatTile';
import { CountUp } from '@/components/data-display/CountUp';
import { Pagination } from '@/components/data-display/Pagination';
import { EmptyState } from '@/components/feedback/EmptyState';
import { ErrorState } from '@/components/feedback/ErrorState';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { SelectField } from '@/components/common/SelectField';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Separator } from '@/components/ui/Separator';
import { Skeleton } from '@/components/ui/Skeleton';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useDebounce } from '@/hooks/useDebounce';
import { PERMISSIONS } from '@/constants/permissions';
import { CENTRAL_DOCUMENT_CATEGORY_LABELS } from '@/constants/enums';
import { cn } from '@/utils/cn';

import {
  useDocuments,
  useDocumentStats,
  useDocumentTags,
  useRemoveDocument,
  useUpdateDocument,
  useUploadDocument,
} from '../hooks/useDocuments';
import { DocumentsTable } from '../components/DocumentsTable';
import { DocumentDialog } from '../components/DocumentDialog';
import {
  toUpdatePayload,
  toUploadFormData,
  type DocumentDto,
  type DocumentFilters,
  type DocumentValidity,
} from '../types';

const PAGE_SIZE = 10;
const VALIDITY_OPTIONS: DocumentValidity[] = ['VENCIDO', 'VENCENDO', 'OK', 'SEM_VALIDADE'];

export function DocumentsPage() {
  const { t } = useTranslation('documents');
  const { can, user } = useAuth();
  const canWrite = can(PERMISSIONS.DOCUMENT_WRITE);
  const canManageAll = can(PERMISSIONS.DOCUMENT_MANAGE);

  const [filters, setFilters] = useState<DocumentFilters>({});
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebounce(filters.busca, 300);

  const stats = useDocumentStats();
  const tags = useDocumentTags();
  const list = useDocuments({
    page,
    pageSize: PAGE_SIZE,
    search: debouncedSearch || undefined,
    categoria: filters.categoria,
    tag: filters.tag,
    validade: filters.validade,
  });
  const uploadDocument = useUploadDocument();
  const updateDocument = useUpdateDocument();
  const removeDocument = useRemoveDocument();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<DocumentDto | null>(null);
  const [removing, setRemoving] = useState<DocumentDto | null>(null);

  function patch(next: Partial<DocumentFilters>) {
    setFilters((prev) => ({ ...prev, ...next }));
    setPage(1);
  }

  const hasFilters = Object.values(filters).some(Boolean);
  const rows = list.data?.data ?? [];

  const uploadButton = canWrite ? (
    <Button
      variant="primary"
      leftIcon={<Upload className="h-4 w-4" />}
      onClick={() => {
        setEditing(null);
        setDialogOpen(true);
      }}
    >
      {t('documents:actions.upload')}
    </Button>
  ) : null;

  return (
    <>
      <PageHeader
        eyebrow={t('documents:page.eyebrow')}
        title={t('documents:page.title')}
        description={t('documents:page.description')}
        actions={uploadButton}
      />

      <div className="space-y-8 px-6 py-8 sm:px-8">
        <section
          aria-labelledby="documents-kpi-title"
          className="grid grid-cols-1 gap-4 sm:grid-cols-3"
        >
          <h2 id="documents-kpi-title" className="sr-only">
            {t('documents:kpi.title')}
          </h2>
          {stats.isLoading &&
            Array.from({ length: 3 }).map((_, idx) => (
              <Skeleton key={idx} className="h-[112px] w-full" />
            ))}
          {stats.data && (
            <>
              <StatTile
                label={t('documents:kpi.total')}
                value={<CountUp value={stats.data.total} />}
                icon={<FileStack className="h-4 w-4" />}
              />
              <button
                type="button"
                onClick={() => patch({ validade: 'VENCENDO' })}
                className="rounded-lg text-left focus:outline-none focus-visible:shadow-focus"
              >
                <StatTile
                  label={t('documents:kpi.expiring')}
                  value={<CountUp value={stats.data.vencendo} />}
                  icon={<AlarmClock className="h-4 w-4" />}
                />
              </button>
              <button
                type="button"
                onClick={() => patch({ validade: 'VENCIDO' })}
                className="rounded-lg text-left focus:outline-none focus-visible:shadow-focus"
              >
                <StatTile
                  label={t('documents:kpi.expired')}
                  value={<CountUp value={stats.data.vencidos} />}
                  icon={<FileWarning className="h-4 w-4" />}
                />
              </button>
            </>
          )}
        </section>

        <Separator />

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_17rem]">
          <div className="min-w-0 space-y-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-ink-soft" aria-hidden="true" />
                <span className="text-sm font-semibold text-ink">
                  {t('documents:filters.title')}
                </span>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-[2fr_1fr_1fr]">
                <Input
                  label={t('documents:filters.search.label')}
                  placeholder={t('documents:filters.search.placeholder')}
                  hint={t('documents:filters.search.hint')}
                  leftIcon={<Search className="h-4 w-4" />}
                  value={filters.busca ?? ''}
                  onChange={(e) => patch({ busca: e.target.value || undefined })}
                  name="document-search"
                />
                <SelectField
                  id="documents-filter-category"
                  label={t('documents:filters.category')}
                  noneLabel={t('documents:filters.allCategories')}
                  value={filters.categoria}
                  onChange={(v) =>
                    patch({ categoria: (v || undefined) as DocumentCategory | undefined })
                  }
                  options={Object.values(DocumentCategory).map((value) => ({
                    value,
                    label: CENTRAL_DOCUMENT_CATEGORY_LABELS[value],
                  }))}
                />
                <SelectField
                  id="documents-filter-validity"
                  label={t('documents:filters.validity')}
                  noneLabel={t('documents:filters.anyValidity')}
                  value={filters.validade}
                  onChange={(v) =>
                    patch({ validade: (v || undefined) as DocumentValidity | undefined })
                  }
                  options={VALIDITY_OPTIONS.map((value) => ({
                    value,
                    label: t(`documents:validity.${value}` as never),
                  }))}
                />
              </div>
              {hasFilters && (
                <div className="flex animate-fade-in flex-wrap items-center gap-2 border-t border-border pt-3">
                  {filters.tag && (
                    <Badge variant="outline" className="gap-1.5 pr-1.5">
                      #{filters.tag}
                      <button
                        type="button"
                        onClick={() => patch({ tag: undefined })}
                        aria-label={t('common:filters.removeChipAria', { label: filters.tag })}
                        className="rounded-full p-0.5 hover:bg-hover"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      patch({
                        busca: undefined,
                        categoria: undefined,
                        tag: undefined,
                        validade: undefined,
                      })
                    }
                  >
                    {t('common:filters.clearAll')}
                  </Button>
                </div>
              )}
            </div>

            {list.isLoading && (
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, idx) => (
                  <Skeleton key={idx} className="h-16 w-full" />
                ))}
              </div>
            )}

            {list.isError && (
              <ErrorState
                title={t('documents:error.title')}
                description={t('documents:error.description')}
                action={
                  <Button variant="outline" onClick={() => void list.refetch()}>
                    {t('common:actions.retry')}
                  </Button>
                }
              />
            )}

            {list.data && rows.length === 0 && (
              <EmptyState
                icon={<FileStack className="h-6 w-6" />}
                title={hasFilters ? t('documents:empty.filteredTitle') : t('documents:empty.title')}
                description={
                  hasFilters
                    ? t('documents:empty.filteredDescription')
                    : t('documents:empty.description')
                }
                action={hasFilters ? undefined : uploadButton}
              />
            )}

            {list.data && rows.length > 0 && (
              <div className="space-y-4">
                <DocumentsTable
                  rows={rows}
                  isFetching={list.isFetching && !list.isLoading}
                  canManage={(doc) => canWrite && (canManageAll || doc.uploadedById === user?.id)}
                  onEdit={(doc) => {
                    setEditing(doc);
                    setDialogOpen(true);
                  }}
                  onRemove={setRemoving}
                  onTagClick={(tag) => patch({ tag })}
                />
                <Pagination
                  page={list.data.meta.page}
                  pageSize={list.data.meta.pageSize}
                  total={list.data.meta.total}
                  onPageChange={setPage}
                />
              </div>
            )}
          </div>

          <aside className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Hash className="h-4 w-4 text-brand-gold-700" aria-hidden="true" />
                  {t('documents:tags.title')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {tags.data && tags.data.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {tags.data.map(({ tag, count }) => (
                      <button
                        key={tag}
                        type="button"
                        aria-pressed={filters.tag === tag}
                        onClick={() => patch({ tag: filters.tag === tag ? undefined : tag })}
                        className={cn(
                          'rounded-full border px-2.5 py-1 font-mono text-[11px] transition-colors duration-fast focus:outline-none focus-visible:shadow-focus',
                          filters.tag === tag
                            ? 'border-brand-gold-500 bg-brand-gold-50 text-brand-gold-900'
                            : 'border-dashed border-border text-ink-soft hover:border-brand-gold-500 hover:text-brand-gold-700',
                        )}
                      >
                        #{tag} <span className="opacity-60">{count}</span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-ink-soft">{t('documents:tags.empty')}</p>
                )}
              </CardContent>
            </Card>

            {stats.data && stats.data.byCategory.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">{t('documents:byCategory')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-1">
                    {[...stats.data.byCategory]
                      .sort((a, b) => b.count - a.count)
                      .map((row) => (
                        <li key={row.categoria}>
                          <button
                            type="button"
                            onClick={() => patch({ categoria: row.categoria })}
                            className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-sm text-ink transition-colors duration-fast hover:bg-hover"
                          >
                            <span>{CENTRAL_DOCUMENT_CATEGORY_LABELS[row.categoria]}</span>
                            <span className="font-mono text-xs text-ink-soft">{row.count}</span>
                          </button>
                        </li>
                      ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </aside>
        </div>
      </div>

      <DocumentDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        document={editing}
        isSubmitting={uploadDocument.isPending || updateDocument.isPending}
        onUpload={(input, file) =>
          uploadDocument.mutate(toUploadFormData(input, file), {
            onSuccess: () => setDialogOpen(false),
          })
        }
        onUpdate={(input) =>
          editing &&
          updateDocument.mutate(
            { id: editing.id, input: toUpdatePayload(input) },
            { onSuccess: () => setDialogOpen(false) },
          )
        }
      />

      <ConfirmDialog
        open={removing !== null}
        onOpenChange={(open) => !open && setRemoving(null)}
        title={t('documents:confirm.removeTitle')}
        description={
          <Trans
            i18nKey="documents:confirm.removeDescription"
            values={{ name: removing?.titulo ?? '' }}
            components={{ strong: <strong className="text-ink" /> }}
          />
        }
        destructive
        confirmLabel={t('common:actions.remove')}
        isSubmitting={removeDocument.isPending}
        onConfirm={() =>
          removing && removeDocument.mutate(removing.id, { onSuccess: () => setRemoving(null) })
        }
      />
    </>
  );
}

export default DocumentsPage;
