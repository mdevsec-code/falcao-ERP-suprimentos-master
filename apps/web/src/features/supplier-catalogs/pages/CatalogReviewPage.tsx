import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeft,
  Ban,
  CheckCheck,
  ExternalLink,
  FileText,
  PackagePlus,
  Search,
  UserCheck,
} from 'lucide-react';
import type { SupplierCatalogItemDto } from '@falcao-erp/shared-types';

import { PageHeader } from '@/components/layout/PageHeader';
import { ErrorState } from '@/components/feedback/ErrorState';
import { PageSkeleton } from '@/components/feedback/PageSkeleton';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/Dialog';
import { API_ORIGIN } from '@/config/env';
import {
  SUPPLIER_CATALOG_ITEM_STATUS_LABELS,
  SUPPLIER_CATALOG_STATUS_LABELS,
} from '@/constants/enums';
import { PERMISSIONS } from '@/constants/permissions';
import { ROUTE_PATHS, routeTo } from '@/constants/routes';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { CatalogPickerDialog } from '@/features/purchase-requests/components/CatalogPickerDialog';
import { useDecideSupplierRegistration } from '@/features/suppliers/hooks/useSupplierMutations';
import { cn } from '@/utils/cn';
import { formatCNPJ, formatCurrencyBRL, formatDateTime } from '@/utils/format';
import {
  useCatalog,
  useCreateProductFromItem,
  useRejectCatalog,
  useReviewCatalog,
} from '../hooks/useCatalogs';
import { CreateProductDialog } from '../components/CreateProductDialog';
import { CATALOG_ITEM_STATUS_VARIANT, CATALOG_STATUS_VARIANT } from '../lib/status';

interface Decision {
  acao: 'IMPORTAR' | 'IGNORAR';
  productId?: string;
  label?: string;
}

/**
 * Revisão do catálogo recebido: cada linha vira preço de um produto do
 * catálogo vivo (o sugerido, outro escolhido ou um produto novo) ou é ignorada.
 */
export function CatalogReviewPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation('catalogs');
  const { can } = useAuth();
  const canWrite = can(PERMISSIONS.QUOTATION_WRITE);
  const { data: catalog, isLoading, isError, refetch } = useCatalog(id);
  const review = useReviewCatalog(id);
  const createProduct = useCreateProductFromItem(id);
  const reject = useRejectCatalog(id);
  const decideRegistration = useDecideSupplierRegistration(catalog?.supplierId ?? '');

  const [decisions, setDecisions] = useState<Map<string, Decision>>(new Map());
  const [pickingFor, setPickingFor] = useState<string | null>(null);
  const [creatingFor, setCreatingFor] = useState<SupplierCatalogItemDto | null>(null);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [motivo, setMotivo] = useState('');

  // As sugestões entram já marcadas como "importar"; o resto fica sem decisão.
  useEffect(() => {
    if (!catalog) return;
    setDecisions((current) => {
      const next = new Map<string, Decision>();
      for (const item of catalog.items) {
        if (item.status !== 'PENDENTE') continue;
        const kept = current.get(item.id);
        if (kept) next.set(item.id, kept);
        else if (item.sugestao) {
          next.set(item.id, {
            acao: 'IMPORTAR',
            productId: item.sugestao.productId,
            label: `${item.sugestao.codigo} · ${item.sugestao.nome}`,
          });
        }
      }
      return next;
    });
  }, [catalog]);

  const pending = useMemo(
    () => catalog?.items.filter((item) => item.status === 'PENDENTE') ?? [],
    [catalog],
  );

  if (isLoading) return <PageSkeleton tiles={2} />;
  if (isError || !catalog) {
    return (
      <div className="px-6 py-10 sm:px-8">
        <ErrorState
          title={t('catalogs:review.notFoundTitle')}
          description={t('catalogs:review.notFoundDescription')}
          action={
            <Button variant="outline" onClick={() => void refetch()}>
              {t('common:actions.retry')}
            </Button>
          }
        />
      </div>
    );
  }

  const isPending = catalog.status === 'PENDENTE';
  const editable = canWrite && isPending && !catalog.cadastroPendente;
  const decided = [...decisions.entries()].filter(
    ([, decision]) => decision.acao === 'IGNORAR' || decision.productId,
  );

  function setDecision(itemId: string, decision: Decision | null) {
    setDecisions((current) => {
      const next = new Map(current);
      if (decision) next.set(itemId, decision);
      else next.delete(itemId);
      return next;
    });
  }

  function apply() {
    review.mutate(
      decided.map(([itemId, decision]) => ({
        itemId,
        acao: decision.acao,
        productId: decision.acao === 'IMPORTAR' ? decision.productId : undefined,
      })),
    );
  }

  return (
    <>
      <PageHeader
        eyebrow={t('catalogs:review.eyebrow')}
        title={catalog.supplierName}
        description={t('catalogs:review.sentBy', {
          name: catalog.enviadoPor,
          date: formatDateTime(catalog.createdAt),
        })}
        actions={
          <>
            <Button
              variant="ghost"
              leftIcon={<ArrowLeft className="h-4 w-4" />}
              onClick={() => navigate(ROUTE_PATHS.CATALOGOS)}
            >
              {t('catalogs:review.back')}
            </Button>
            {catalog.fileUrl && (
              <Button variant="outline" asChild>
                <a href={`${API_ORIGIN}${catalog.fileUrl}`} target="_blank" rel="noreferrer">
                  <FileText className="h-4 w-4" aria-hidden="true" />
                  {t('catalogs:review.openFile')}
                </a>
              </Button>
            )}
            {canWrite && isPending && (
              <>
                <Button
                  variant="ghost"
                  leftIcon={<Ban className="h-4 w-4" />}
                  onClick={() => setRejectOpen(true)}
                >
                  {t('catalogs:review.reject')}
                </Button>
                {pending.length > 0 && (
                  <Button
                    variant="primary"
                    leftIcon={<CheckCheck className="h-4 w-4" />}
                    disabled={!editable || decided.length === 0}
                    isLoading={review.isPending}
                    onClick={apply}
                  >
                    {t('catalogs:review.apply', { count: decided.length })}
                  </Button>
                )}
              </>
            )}
          </>
        }
      />

      <div className="space-y-6 px-6 py-8 sm:px-8">
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <Badge variant={CATALOG_STATUS_VARIANT[catalog.status]} size="md">
            {SUPPLIER_CATALOG_STATUS_LABELS[catalog.status]}
          </Badge>
          <Link
            to={routeTo.supplier(catalog.supplierId)}
            className="text-ink-soft hover:text-brand-gold-700 hover:underline"
          >
            {formatCNPJ(catalog.supplierCnpj)}
          </Link>
          {catalog.fileName && <span className="text-ink-soft">{catalog.fileName}</span>}
          {catalog.revisadoEm && (
            <span className="text-ink-soft">
              {t('catalogs:review.reviewedBy', {
                name: catalog.revisadoPorName ?? '—',
                date: formatDateTime(catalog.revisadoEm),
              })}
            </span>
          )}
        </div>

        {catalog.cadastroPendente && (
          <div className="flex flex-col gap-3 rounded-lg border border-brand-gold-300 bg-brand-gold-50/70 p-4 text-sm text-ink sm:flex-row sm:items-center">
            <UserCheck className="h-5 w-5 shrink-0 text-brand-gold-700" aria-hidden="true" />
            <p className="flex-1">{t('catalogs:review.pendingSupplier')}</p>
            {canWrite && (
              <div className="flex gap-2">
                <Button size="sm" variant="outline" asChild>
                  <Link to={routeTo.supplier(catalog.supplierId)}>
                    {t('catalogs:review.seeSupplier')}
                  </Link>
                </Button>
                <Button
                  size="sm"
                  variant="primary"
                  isLoading={decideRegistration.isPending}
                  onClick={() =>
                    decideRegistration.mutate(true, { onSuccess: () => void refetch() })
                  }
                >
                  {t('suppliers:registration.approve')}
                </Button>
              </div>
            )}
          </div>
        )}

        {catalog.observacoes && (
          <p className="whitespace-pre-line rounded-md border border-border bg-surface px-4 py-3 text-sm text-ink-soft">
            <strong className="text-ink">{t('catalogs:review.notes')}</strong> {catalog.observacoes}
          </p>
        )}
        {catalog.motivoRecusa && (
          <p className="rounded-md border border-border bg-surface px-4 py-3 text-sm text-ink-soft">
            <strong className="text-ink">{t('catalogs:review.rejectReason')}</strong>{' '}
            {catalog.motivoRecusa}
          </p>
        )}

        {catalog.items.length === 0 ? (
          <p className="rounded-md border border-dashed border-border px-4 py-6 text-center text-sm text-ink-soft">
            {t('catalogs:review.fileOnly')}
          </p>
        ) : (
          <section aria-labelledby="catalog-items" className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 id="catalog-items" className="text-base font-semibold text-ink">
                {t('catalogs:review.itemsTitle', { count: catalog.items.length })}
              </h2>
              {isPending && pending.length > 0 && (
                <p className="text-xs text-ink-soft">{t('catalogs:review.hint')}</p>
              )}
            </div>
            <div className="overflow-x-auto rounded-md border border-border bg-surface">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-border bg-bg text-xs text-ink-soft">
                  <tr>
                    <th className="px-3 py-2">{t('catalogs:review.col.item')}</th>
                    <th className="px-3 py-2 text-right">{t('catalogs:review.col.price')}</th>
                    <th className="px-3 py-2">{t('catalogs:review.col.product')}</th>
                    <th className="px-3 py-2">{t('catalogs:review.col.action')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {catalog.items.map((item) => {
                    const decision = decisions.get(item.id);
                    const extra = [item.codigoFornecedor, item.marca, item.referencia]
                      .filter(Boolean)
                      .join(' · ');
                    return (
                      <tr
                        key={item.id}
                        className={cn(
                          'align-top',
                          decision?.acao === 'IGNORAR' && 'opacity-60',
                          decision?.acao === 'IMPORTAR' && 'bg-success/5',
                        )}
                      >
                        <td className="px-3 py-2">
                          <span className="text-ink">{item.descricao}</span>
                          <span className="block text-xs text-ink-soft">
                            {[item.unidade, extra].filter(Boolean).join(' · ')}
                          </span>
                          {item.observacao && (
                            <span className="block text-xs italic text-ink-soft">
                              {item.observacao}
                            </span>
                          )}
                        </td>
                        <td className="whitespace-nowrap px-3 py-2 text-right tabular-nums text-ink">
                          {item.preco ? formatCurrencyBRL(item.preco) : '—'}
                        </td>
                        <td className="px-3 py-2">
                          {item.status === 'PENDENTE' ? (
                            decision?.acao === 'IMPORTAR' && decision.productId ? (
                              <span className="text-ink">
                                {decision.label}
                                {item.sugestao?.productId === decision.productId && (
                                  <Badge size="sm" variant="info" className="ml-2">
                                    {t('catalogs:review.suggested')}
                                  </Badge>
                                )}
                              </span>
                            ) : (
                              <span className="text-ink-soft">—</span>
                            )
                          ) : item.productId ? (
                            <Link
                              to={routeTo.product(item.productId)}
                              className="inline-flex items-center gap-1 text-ink hover:text-brand-gold-700 hover:underline"
                            >
                              {item.productCodigo} · {item.productNome}
                              <ExternalLink className="h-3 w-3" aria-hidden="true" />
                            </Link>
                          ) : (
                            <span className="text-ink-soft">—</span>
                          )}
                        </td>
                        <td className="px-3 py-2">
                          {item.status !== 'PENDENTE' ? (
                            <Badge size="sm" variant={CATALOG_ITEM_STATUS_VARIANT[item.status]}>
                              {SUPPLIER_CATALOG_ITEM_STATUS_LABELS[item.status]}
                            </Badge>
                          ) : editable ? (
                            <div className="flex flex-wrap gap-1.5">
                              <Button
                                size="sm"
                                variant="outline"
                                leftIcon={<Search className="h-3.5 w-3.5" />}
                                onClick={() => setPickingFor(item.id)}
                              >
                                {t('catalogs:review.link')}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                leftIcon={<PackagePlus className="h-3.5 w-3.5" />}
                                onClick={() => setCreatingFor(item)}
                              >
                                {t('catalogs:review.createProduct')}
                              </Button>
                              <Button
                                size="sm"
                                variant={decision?.acao === 'IGNORAR' ? 'primary' : 'ghost'}
                                aria-pressed={decision?.acao === 'IGNORAR'}
                                onClick={() =>
                                  setDecision(
                                    item.id,
                                    decision?.acao === 'IGNORAR' ? null : { acao: 'IGNORAR' },
                                  )
                                }
                              >
                                {t('catalogs:review.ignore')}
                              </Button>
                            </div>
                          ) : (
                            <Badge size="sm" variant="warning">
                              {SUPPLIER_CATALOG_ITEM_STATUS_LABELS.PENDENTE}
                            </Badge>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </div>

      <CatalogPickerDialog
        open={pickingFor !== null}
        onOpenChange={(open) => !open && setPickingFor(null)}
        onPick={(product) => {
          if (pickingFor) {
            setDecision(pickingFor, {
              acao: 'IMPORTAR',
              productId: product.id,
              label: `${product.codigo} · ${product.nome}`,
            });
          }
          setPickingFor(null);
        }}
      />
      <CreateProductDialog
        item={creatingFor}
        onOpenChange={(open) => !open && setCreatingFor(null)}
        isSubmitting={createProduct.isPending}
        onSubmit={(payload) => {
          if (!creatingFor) return;
          createProduct.mutate(
            { itemId: creatingFor.id, payload },
            {
              onSuccess: () => {
                setDecision(creatingFor.id, null);
                setCreatingFor(null);
              },
            },
          );
        }}
      />
      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t('catalogs:review.rejectTitle')}</DialogTitle>
            <DialogDescription>{t('catalogs:review.rejectDescription')}</DialogDescription>
          </DialogHeader>
          <Textarea
            label={t('catalogs:review.rejectReason')}
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            rows={3}
            maxLength={1000}
            name="catalog-reject-reason"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectOpen(false)}>
              {t('common:actions.cancel')}
            </Button>
            <Button
              variant="danger"
              isLoading={reject.isPending}
              onClick={() =>
                reject.mutate(motivo.trim() || undefined, {
                  onSuccess: () => setRejectOpen(false),
                })
              }
            >
              {t('catalogs:review.reject')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default CatalogReviewPage;
