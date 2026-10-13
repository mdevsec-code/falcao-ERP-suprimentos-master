import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Boxes,
  CalendarDays,
  ClipboardCheck,
  FileStack,
  FileText,
  Hourglass,
  ReceiptText,
  ShoppingCart,
  Truck,
  Wallet,
  type LucideIcon,
} from 'lucide-react';
import { PURCHASE_REQUEST_PIPELINE } from '@falcao-erp/shared-types';

import { PageHeader } from '@/components/layout/PageHeader';
import { StatTile } from '@/components/data-display/StatTile';
import { CountUp } from '@/components/data-display/CountUp';
import { RankingBarChart } from '@/components/charts/RankingBarChart';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Separator } from '@/components/ui/Separator';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/feedback/EmptyState';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { OperationsOverview } from '../components/OperationsOverview';
import { useSupplierStats } from '@/features/suppliers/hooks/useSuppliers';
import { useProductStats } from '@/features/products/hooks/useProducts';
import { usePurchaseRequestStats } from '@/features/purchase-requests/hooks/usePurchaseRequests';
import { countByStatus, summarizeStats } from '@/features/purchase-requests/lib/stats';
import { PERMISSIONS, type Permission } from '@/constants/permissions';
import { ROUTE_PATHS } from '@/constants/routes';
import { PURCHASE_REQUEST_STATUS_LABELS, SUPPLIER_CATEGORY_LABELS } from '@/constants/enums';
import { getIntlLocale } from '@/utils/locale';

interface QuickLink {
  id: string;
  to: string;
  icon: LucideIcon;
  requires?: Permission;
}

const QUICK_LINKS: QuickLink[] = [
  {
    id: 'newRequest',
    to: ROUTE_PATHS.SOLICITACAO_NOVA,
    icon: ShoppingCart,
    requires: PERMISSIONS.PURCHASE_REQUEST_WRITE,
  },
  {
    id: 'approvals',
    to: ROUTE_PATHS.APROVACOES,
    icon: ClipboardCheck,
    requires: PERMISSIONS.APPROVALS_READ,
  },
  {
    id: 'requests',
    to: ROUTE_PATHS.SOLICITACOES,
    icon: FileText,
    requires: PERMISSIONS.PURCHASE_REQUEST_READ,
  },
  {
    id: 'suppliers',
    to: ROUTE_PATHS.FORNECEDORES,
    icon: Truck,
    requires: PERMISSIONS.SUPPLIER_READ,
  },
  { id: 'products', to: ROUTE_PATHS.PRODUTOS, icon: Boxes, requires: PERMISSIONS.PRODUCT_READ },
  {
    id: 'contracts',
    to: ROUTE_PATHS.CONTRATOS,
    icon: FileText,
    requires: PERMISSIONS.CONTRACT_READ,
  },
  { id: 'finance', to: ROUTE_PATHS.FINANCEIRO, icon: Wallet, requires: PERMISSIONS.FINANCE_READ },
  { id: 'reimbursements', to: ROUTE_PATHS.REEMBOLSOS, icon: ReceiptText },
  { id: 'agenda', to: ROUTE_PATHS.AGENDA, icon: CalendarDays },
  { id: 'documents', to: ROUTE_PATHS.DOCUMENTOS, icon: FileStack },
];

function formatCount(value: number): string {
  return new Intl.NumberFormat(getIntlLocale()).format(value);
}

export function DashboardPage() {
  const { t } = useTranslation('dashboard');
  const { user, can } = useAuth();
  const supplierStats = useSupplierStats();
  const productStats = useProductStats();
  const requestStats = usePurchaseRequestStats();

  const summary = summarizeStats(requestStats.data);
  const firstName = user?.name.split(' ')[0] ?? '';
  const visibleLinks = QUICK_LINKS.filter((link) => !link.requires || can(link.requires));
  const kpisLoading = supplierStats.isLoading || productStats.isLoading || requestStats.isLoading;

  const categoryData = [...(supplierStats.data?.byCategory ?? [])]
    .sort((a, b) => b.count - a.count)
    .map((row) => ({ label: SUPPLIER_CATEGORY_LABELS[row.categoria], value: row.count }));

  // Ordem do fluxo (não por tamanho): o gráfico mostra onde as solicitações se acumulam.
  const pipelineData = [...PURCHASE_REQUEST_PIPELINE, 'REJEITADO' as const].map((status) => ({
    label: PURCHASE_REQUEST_STATUS_LABELS[status],
    value: countByStatus(requestStats.data, [status]),
  }));

  return (
    <>
      <PageHeader
        eyebrow={t('dashboard:welcome.eyebrow')}
        title={t('dashboard:welcome.title', { name: firstName })}
        description={t('dashboard:welcome.description')}
        actions={
          can(PERMISSIONS.APPROVALS_READ) ? (
            <Button asChild variant="outline" rightIcon={<ArrowRight className="h-4 w-4" />}>
              <Link to={ROUTE_PATHS.APROVACOES}>{t('dashboard:welcome.openApprovals')}</Link>
            </Button>
          ) : undefined
        }
      />

      <div className="space-y-8 px-6 py-8 sm:px-8">
        <section
          aria-labelledby="kpi-title"
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
        >
          <h2 id="kpi-title" className="sr-only">
            {t('dashboard:kpiSection.title')}
          </h2>

          {kpisLoading ? (
            Array.from({ length: 4 }).map((_, idx) => (
              <Skeleton key={idx} className="h-[112px] w-full" />
            ))
          ) : (
            <>
              <StatTile
                label={t('dashboard:kpis.activeSuppliers')}
                value={<CountUp value={supplierStats.data?.active ?? 0} />}
                icon={<Truck className="h-4 w-4" />}
              />
              <StatTile
                label={t('dashboard:kpis.activeProducts')}
                value={<CountUp value={productStats.data?.active ?? 0} />}
                icon={<Boxes className="h-4 w-4" />}
              />
              <StatTile
                label={t('dashboard:kpis.requestsInProgress')}
                value={<CountUp value={summary.inProgress + summary.awaitingApproval} />}
                icon={<ShoppingCart className="h-4 w-4" />}
              />
              <StatTile
                label={t('dashboard:kpis.pendingMyApproval')}
                value={<CountUp value={summary.pendingMyApproval} />}
                icon={<Hourglass className="h-4 w-4" />}
                delta={
                  summary.pendingMyApproval > 0
                    ? { value: t('dashboard:kpis.actionNeeded'), direction: 'flat' }
                    : undefined
                }
              />
            </>
          )}
        </section>

        <Separator />

        {visibleLinks.length > 0 && (
          <>
            <section aria-labelledby="quick-links-title">
              <h2 id="quick-links-title" className="mb-4 text-sm font-semibold text-ink">
                {t('dashboard:quickLinks.title')}
              </h2>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                {visibleLinks.map((link, idx) => (
                  <Link
                    key={link.id}
                    to={link.to}
                    className="group flex animate-slide-up items-start gap-3 rounded-lg border border-border bg-surface p-4 transition-[box-shadow,transform] duration-base ease-out hover:-translate-y-0.5 hover:shadow-md"
                    style={{ animationDelay: `${idx * 50}ms`, animationFillMode: 'backwards' }}
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-brand-gold-50 text-brand-gold-700 transition-transform duration-base group-hover:scale-110">
                      <link.icon className="h-4 w-4" />
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold text-ink group-hover:text-brand-gold-700">
                        {t(`dashboard:quickLinks.${link.id}.label` as never)}
                      </span>
                      <span className="block text-xs text-ink-soft">
                        {t(`dashboard:quickLinks.${link.id}.description` as never)}
                      </span>
                    </span>
                  </Link>
                ))}
              </div>
            </section>

            <Separator />
          </>
        )}

        <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>{t('dashboard:charts.pipeline.title')}</CardTitle>
              <CardDescription>{t('dashboard:charts.pipeline.description')}</CardDescription>
            </CardHeader>
            <CardContent>
              {requestStats.isLoading ? (
                <Skeleton className="h-64 w-full" />
              ) : summary.total === 0 ? (
                <EmptyState
                  title={t('dashboard:charts.pipeline.emptyTitle')}
                  description={t('dashboard:charts.pipeline.emptyDescription')}
                  className="border-none bg-transparent py-8"
                />
              ) : (
                <RankingBarChart
                  data={pipelineData}
                  formatValue={(v) =>
                    t('dashboard:charts.pipeline.tooltip', { count: v, value: formatCount(v) })
                  }
                  labelWidth={170}
                />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('dashboard:charts.suppliersByCategory.title')}</CardTitle>
              <CardDescription>
                {t('dashboard:charts.suppliersByCategory.description', {
                  count: supplierStats.data?.total ?? 0,
                })}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {supplierStats.isLoading ? (
                <Skeleton className="h-64 w-full" />
              ) : categoryData.length === 0 ? (
                <EmptyState
                  title={t('dashboard:charts.suppliersByCategory.emptyTitle')}
                  description={t('dashboard:charts.suppliersByCategory.emptyDescription')}
                  className="border-none bg-transparent py-8"
                />
              ) : (
                <RankingBarChart
                  data={categoryData}
                  formatValue={(v) =>
                    t('dashboard:charts.suppliersByCategory.tooltip', {
                      count: v,
                      value: formatCount(v),
                    })
                  }
                  labelWidth={170}
                />
              )}
            </CardContent>
          </Card>
        </section>

        <OperationsOverview />
      </div>
    </>
  );
}

export default DashboardPage;
