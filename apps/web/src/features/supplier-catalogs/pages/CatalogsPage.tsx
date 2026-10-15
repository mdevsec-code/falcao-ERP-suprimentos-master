import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import {
  BookOpen,
  ChevronRight,
  Copy,
  Link2Off,
  Mail,
  MessageCircle,
  RefreshCw,
} from 'lucide-react';
import { SupplierCatalogStatus } from '@falcao-erp/shared-types';

import { PageHeader } from '@/components/layout/PageHeader';
import { Pagination } from '@/components/data-display/Pagination';
import { EmptyState } from '@/components/feedback/EmptyState';
import { ErrorState } from '@/components/feedback/ErrorState';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/Table';
import { SUPPLIER_CATALOG_STATUS_LABELS } from '@/constants/enums';
import { PERMISSIONS } from '@/constants/permissions';
import { routeTo } from '@/constants/routes';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { mailtoUrl, whatsappUrl } from '@/features/quotations/lib/share';
import { cn } from '@/utils/cn';
import { formatCNPJ, formatDateTime } from '@/utils/format';
import { useCatalogLink, useCatalogLinkMutation, useCatalogs } from '../hooks/useCatalogs';
import { CATALOG_STATUS_VARIANT } from '../lib/status';

const PAGE_SIZE = 15;

async function copy(text: string, success: string, failure: string) {
  try {
    await navigator.clipboard.writeText(text);
    toast.success(success);
  } catch {
    toast.error(failure);
  }
}

/** Catálogos enviados pelos fornecedores e o link para eles enviarem. */
export function CatalogsPage() {
  const { t } = useTranslation('catalogs');
  const navigate = useNavigate();
  const { can } = useAuth();
  const canWrite = can(PERMISSIONS.QUOTATION_WRITE);
  const [status, setStatus] = useState<SupplierCatalogStatus | undefined>('PENDENTE');
  const [page, setPage] = useState(1);
  const [confirm, setConfirm] = useState<'regenerate' | 'disable' | null>(null);
  const list = useCatalogs({ page, pageSize: PAGE_SIZE, status });
  const link = useCatalogLink();
  const linkMutation = useCatalogLinkMutation();
  const rows = list.data?.data ?? [];

  const url = link.data?.token
    ? `${window.location.origin}${routeTo.supplierCatalogUpload(link.data.token)}`
    : null;
  const message = url ? t('catalogs:link.message', { link: url }) : '';

  return (
    <>
      <PageHeader
        eyebrow={t('catalogs:page.eyebrow')}
        title={t('catalogs:page.title')}
        description={t('catalogs:page.description')}
      />

      <div className="space-y-8 px-6 py-8 sm:px-8">
        {canWrite && (
          <section
            aria-labelledby="catalog-link-title"
            className="rounded-lg border border-brand-gold-300 bg-brand-gold-50/60 p-4 shadow-sm sm:p-5"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 id="catalog-link-title" className="text-base font-semibold text-ink">
                  {t('catalogs:link.title')}
                </h2>
                <p className="text-sm text-ink-soft">
                  {url ? t('catalogs:link.description') : t('catalogs:link.off')}
                </p>
              </div>
              {!url && !link.isLoading && (
                <Button
                  size="sm"
                  variant="primary"
                  isLoading={linkMutation.isPending}
                  onClick={() => linkMutation.mutate('regenerate')}
                >
                  {t('catalogs:link.enable')}
                </Button>
              )}
            </div>
            {url && (
              <div className="mt-4 space-y-3">
                <div className="flex flex-col gap-2 sm:flex-row">
                  <input
                    readOnly
                    value={url}
                    aria-label={t('catalogs:link.title')}
                    onFocus={(e) => e.target.select()}
                    className="h-10 min-w-0 flex-1 rounded-md border border-border bg-surface px-3 font-mono text-xs text-ink"
                  />
                  <Button
                    variant="primary"
                    leftIcon={<Copy className="h-4 w-4" />}
                    onClick={() =>
                      void copy(url, t('catalogs:toast.copied'), t('catalogs:toast.copyFailed'))
                    }
                  >
                    {t('catalogs:link.copy')}
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" asChild>
                    <a href={whatsappUrl(null, message)} target="_blank" rel="noreferrer">
                      <MessageCircle className="h-3.5 w-3.5" aria-hidden="true" />
                      {t('catalogs:link.whatsapp')}
                    </a>
                  </Button>
                  <Button size="sm" variant="outline" asChild>
                    <a href={mailtoUrl(null, t('catalogs:link.subject'), message)}>
                      <Mail className="h-3.5 w-3.5" aria-hidden="true" />
                      {t('catalogs:link.email')}
                    </a>
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    leftIcon={<RefreshCw className="h-3.5 w-3.5" />}
                    onClick={() => setConfirm('regenerate')}
                  >
                    {t('catalogs:link.regenerate')}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    leftIcon={<Link2Off className="h-3.5 w-3.5" />}
                    onClick={() => setConfirm('disable')}
                  >
                    {t('catalogs:link.disable')}
                  </Button>
                </div>
              </div>
            )}
          </section>
        )}

        <div
          className="flex flex-wrap gap-2"
          role="group"
          aria-label={t('catalogs:filters.status')}
        >
          {[undefined, ...Object.values(SupplierCatalogStatus)].map((value) => (
            <Button
              key={value ?? 'all'}
              size="sm"
              variant={status === value ? 'primary' : 'outline'}
              aria-pressed={status === value}
              onClick={() => {
                setStatus(value);
                setPage(1);
              }}
            >
              {value ? SUPPLIER_CATALOG_STATUS_LABELS[value] : t('catalogs:filters.all')}
            </Button>
          ))}
        </div>

        {list.isLoading && (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, idx) => (
              <Skeleton key={idx} className="h-14 w-full" />
            ))}
          </div>
        )}
        {list.isError && (
          <ErrorState
            title={t('catalogs:error.title')}
            description={t('catalogs:error.description')}
            action={
              <Button variant="outline" onClick={() => void list.refetch()}>
                {t('common:actions.retry')}
              </Button>
            }
          />
        )}
        {list.data && rows.length === 0 && (
          <EmptyState
            icon={<BookOpen className="h-6 w-6" />}
            title={t('catalogs:empty.title')}
            description={t('catalogs:empty.description')}
          />
        )}
        {list.data && rows.length > 0 && (
          <div className="space-y-4">
            <Table className={cn(list.isFetching && !list.isLoading && 'opacity-60')}>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('catalogs:table.supplier')}</TableHead>
                  <TableHead>{t('catalogs:table.status')}</TableHead>
                  <TableHead className="text-right">{t('catalogs:table.items')}</TableHead>
                  <TableHead>{t('catalogs:table.file')}</TableHead>
                  <TableHead>{t('catalogs:table.sentAt')}</TableHead>
                  <TableHead className="w-10" aria-hidden="true" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions
                  <TableRow
                    key={row.id}
                    className="group cursor-pointer"
                    onClick={() => navigate(routeTo.catalog(row.id))}
                  >
                    <TableCell>
                      <Link
                        to={routeTo.catalog(row.id)}
                        onClick={(e) => e.stopPropagation()}
                        className="font-medium text-ink hover:underline group-hover:text-brand-gold-700"
                      >
                        {row.supplierName}
                      </Link>
                      <p className="text-xs text-ink-soft">
                        {formatCNPJ(row.supplierCnpj)} ·{' '}
                        {t('catalogs:table.sentBy', { name: row.enviadoPor })}
                      </p>
                      {row.cadastroPendente && (
                        <Badge size="sm" variant="warning" className="mt-1">
                          {t('suppliers:registration.pendingBadge')}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge size="sm" variant={CATALOG_STATUS_VARIANT[row.status]}>
                        {SUPPLIER_CATALOG_STATUS_LABELS[row.status]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{row.itens}</TableCell>
                    <TableCell className="max-w-[14rem] truncate text-ink-soft">
                      {row.fileName ?? '—'}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-ink-soft">
                      {formatDateTime(row.createdAt)}
                    </TableCell>
                    <TableCell aria-hidden="true">
                      <ChevronRight className="h-4 w-4 text-ink-soft group-hover:text-brand-gold-700" />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <Pagination
              page={list.data.meta.page}
              pageSize={list.data.meta.pageSize}
              total={list.data.meta.total}
              onPageChange={setPage}
            />
          </div>
        )}
      </div>

      <ConfirmDialog
        open={confirm !== null}
        onOpenChange={(open) => !open && setConfirm(null)}
        title={
          confirm === 'disable'
            ? t('catalogs:link.disableTitle')
            : t('catalogs:link.regenerateTitle')
        }
        description={t('catalogs:link.confirmDescription')}
        confirmLabel={
          confirm === 'disable' ? t('catalogs:link.disable') : t('catalogs:link.regenerate')
        }
        destructive={confirm === 'disable'}
        isSubmitting={linkMutation.isPending}
        onConfirm={() => {
          if (confirm) linkMutation.mutate(confirm, { onSuccess: () => setConfirm(null) });
        }}
      />
    </>
  );
}

export default CatalogsPage;
