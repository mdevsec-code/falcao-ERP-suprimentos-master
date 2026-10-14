import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Trans, useTranslation } from 'react-i18next';
import {
  ArrowLeft,
  Barcode,
  Clock,
  DollarSign,
  Hash,
  Layers,
  NotebookText,
  Package,
  Pencil,
  Power,
  Star,
  Tag,
  Timer,
  Truck,
} from 'lucide-react';

import { PageHeader } from '@/components/layout/PageHeader';
import { InfoTile } from '@/components/data-display/InfoTile';
import { EmptyState } from '@/components/feedback/EmptyState';
import { ErrorState } from '@/components/feedback/ErrorState';
import { PageSkeleton } from '@/components/feedback/PageSkeleton';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { Button } from '@/components/ui/Button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { Can } from '@/features/auth/components/Can';
import { PERMISSIONS } from '@/constants/permissions';
import { ROUTE_PATHS, routeTo } from '@/constants/routes';
import { PRODUCT_CATEGORY_LABELS, UNIT_LABELS } from '@/constants/enums';
import { formatCurrencyBRL, formatDate } from '@/utils/format';

import { useProduct } from '../hooks/useProducts';
import { useAddPriceEntry, useSetProductActive } from '../hooks/useProductMutations';
import { ProductCategoryBadge, ProductStatusBadge } from '../components/ProductBadges';
import { PriceEntryDialog } from '../components/PriceEntryDialog';
import { PriceHistory } from '../components/PriceHistory';

export function ProductDetailPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation('products');
  const { data: product, isLoading, isError, refetch } = useProduct(id);
  const setActive = useSetProductActive(id);
  const addPriceEntry = useAddPriceEntry(id);
  const [confirmToggle, setConfirmToggle] = useState(false);
  const [priceOpen, setPriceOpen] = useState(false);

  if (isLoading) return <PageSkeleton />;

  if (isError || !product) {
    return (
      <div className="px-6 py-10 sm:px-8">
        <ErrorState
          title={t('products:detail.notFoundTitle')}
          description={t('products:detail.notFoundDescription')}
          action={
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => void refetch()}>
                {t('common:actions.retry')}
              </Button>
              <Button asChild variant="primary">
                <Link to={ROUTE_PATHS.PRODUTOS}>{t('products:actions.backToList')}</Link>
              </Button>
            </div>
          }
        />
      </div>
    );
  }

  return (
    <>
      <PageHeader
        eyebrow={PRODUCT_CATEGORY_LABELS[product.categoria]}
        title={product.nome}
        description={`${product.codigo}${product.marca ? ` · ${product.marca}` : ''}`}
        actions={
          <>
            <Button
              variant="outline"
              leftIcon={<ArrowLeft className="h-4 w-4" />}
              onClick={() => navigate(ROUTE_PATHS.PRODUTOS)}
            >
              {t('common:actions.back')}
            </Button>
            <Can permission={PERMISSIONS.PRODUCT_WRITE}>
              <Button
                variant="outline"
                leftIcon={<Pencil className="h-4 w-4" />}
                onClick={() => navigate(routeTo.productEdit(id))}
              >
                {t('common:actions.edit')}
              </Button>
              <Button
                variant={product.isActive ? 'danger' : 'primary'}
                leftIcon={<Power className="h-4 w-4" />}
                onClick={() => setConfirmToggle(true)}
              >
                {product.isActive
                  ? t('products:actions.deactivate')
                  : t('products:actions.reactivate')}
              </Button>
            </Can>
          </>
        }
      />

      <div className="space-y-6 px-6 py-8 sm:px-8">
        <div className="flex animate-fade-in flex-wrap items-center gap-3">
          <ProductStatusBadge isActive={product.isActive} />
          <ProductCategoryBadge categoria={product.categoria} />
        </div>

        <Tabs defaultValue="overview">
          <TabsList className="h-auto flex-wrap justify-start">
            <TabsTrigger value="overview">{t('products:detail.tabs.overview')}</TabsTrigger>
            <TabsTrigger value="suppliers">
              {t('products:detail.tabs.suppliers', {
                count: product.alternativeSuppliers.length + (product.primarySupplier ? 1 : 0),
              })}
            </TabsTrigger>
            <TabsTrigger value="prices">
              {t('products:detail.tabs.prices', { count: product.priceHistory.length })}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              <InfoTile
                icon={Hash}
                label={t('products:form.fields.codigo')}
                value={<span className="font-mono">{product.codigo}</span>}
              />
              <InfoTile
                icon={Tag}
                label={t('products:form.fields.marca')}
                value={product.marca ?? '—'}
              />
              <InfoTile
                icon={Barcode}
                label={t('products:form.fields.referencia')}
                value={
                  product.referencia ? <span className="font-mono">{product.referencia}</span> : '—'
                }
              />
              <InfoTile
                icon={Layers}
                label={t('products:form.fields.disciplina')}
                value={product.discipline?.nome ?? '—'}
              />
              <InfoTile
                icon={Package}
                label={t('products:form.fields.unidade')}
                value={`${UNIT_LABELS[product.unidade]} (${product.unidade})`}
              />
              <InfoTile
                icon={Timer}
                label={t('products:form.fields.leadTimeDays')}
                value={
                  product.leadTimeDays !== null
                    ? t('products:detail.leadTimeValue', { count: product.leadTimeDays })
                    : '—'
                }
              />
              <InfoTile
                icon={DollarSign}
                label={t('products:detail.lastPrice')}
                value={formatCurrencyBRL(product.lastPrice)}
              />
              <InfoTile
                icon={Clock}
                label={t('products:detail.createdAt')}
                value={formatDate(product.createdAt) ?? '—'}
              />
              {product.observacoes && (
                <InfoTile
                  icon={NotebookText}
                  label={t('products:form.fields.observacoes')}
                  value={
                    <span className="whitespace-pre-line font-normal">{product.observacoes}</span>
                  }
                  className="sm:col-span-2 xl:col-span-3"
                />
              )}
            </div>
          </TabsContent>

          <TabsContent value="suppliers" className="space-y-6">
            <section className="space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-ink-soft">
                {t('products:form.fields.primarySupplier')}
              </h3>
              {product.primarySupplier ? (
                <Link to={routeTo.supplier(product.primarySupplier.id)} className="block max-w-md">
                  <InfoTile
                    icon={Star}
                    label={t('products:detail.primaryBadge')}
                    value={product.primarySupplier.nomeFantasia}
                    className="hover:border-brand-gold-300"
                  />
                </Link>
              ) : (
                <EmptyState
                  icon={<Truck className="h-6 w-6" />}
                  title={t('products:detail.noPrimarySupplier')}
                  className="py-8"
                />
              )}
            </section>

            <section className="space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-ink-soft">
                {t('products:form.fields.alternativeSuppliers')}
              </h3>
              {product.alternativeSuppliers.length === 0 ? (
                <EmptyState
                  icon={<Truck className="h-6 w-6" />}
                  title={t('products:detail.noAlternativeSuppliers')}
                  className="py-8"
                />
              ) : (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {product.alternativeSuppliers.map((supplier) => (
                    <Link key={supplier.id} to={routeTo.supplier(supplier.id)}>
                      <InfoTile
                        icon={Truck}
                        label={t('products:detail.alternativeBadge')}
                        value={supplier.nomeFantasia}
                        className="hover:border-brand-gold-300"
                      />
                    </Link>
                  ))}
                </div>
              )}
            </section>
          </TabsContent>

          <TabsContent value="prices" className="space-y-4">
            <Can permission={PERMISSIONS.PRODUCT_WRITE}>
              <div className="flex justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={<DollarSign className="h-3.5 w-3.5" />}
                  onClick={() => setPriceOpen(true)}
                >
                  {t('products:actions.addPrice')}
                </Button>
              </div>
            </Can>
            {product.priceHistory.length === 0 ? (
              <EmptyState
                icon={<DollarSign className="h-6 w-6" />}
                title={t('products:prices.emptyTitle')}
                description={t('products:prices.emptyDescription')}
              />
            ) : (
              <PriceHistory entries={product.priceHistory} />
            )}
          </TabsContent>
        </Tabs>
      </div>

      <ConfirmDialog
        open={confirmToggle}
        onOpenChange={setConfirmToggle}
        title={
          product.isActive
            ? t('products:confirm.deactivateTitle')
            : t('products:confirm.reactivateTitle')
        }
        description={
          <Trans
            i18nKey={
              product.isActive
                ? 'products:confirm.deactivateDescription'
                : 'products:confirm.reactivateDescription'
            }
            values={{ name: product.nome }}
            components={{ strong: <strong className="text-ink" /> }}
          />
        }
        destructive={product.isActive}
        confirmLabel={
          product.isActive ? t('products:actions.deactivate') : t('products:actions.reactivate')
        }
        isSubmitting={setActive.isPending}
        onConfirm={() =>
          setActive.mutate(!product.isActive, { onSuccess: () => setConfirmToggle(false) })
        }
      />

      <PriceEntryDialog
        open={priceOpen}
        onOpenChange={setPriceOpen}
        defaultSupplierId={product.primarySupplier?.id}
        defaultMarca={product.marca}
        defaultReferencia={product.referencia}
        isSubmitting={addPriceEntry.isPending}
        onSubmit={(input) => addPriceEntry.mutate(input, { onSuccess: () => setPriceOpen(false) })}
      />
    </>
  );
}

export default ProductDetailPage;
