import { lazy, Suspense, type ReactNode } from 'react';
import { createBrowserRouter, type RouteObject } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import { ROUTE_PATHS } from '@/constants/routes';
import { LoadingState } from '@/components/feedback/LoadingState';
import { NotFoundPage } from '@/components/error/NotFoundPage';
import { RequireAuth } from '@/features/auth/components/RequireAuth';
import { RequirePermission } from '@/features/auth/components/RequirePermission';
import { PERMISSIONS, type Permission } from '@/constants/permissions';
import { RootBoundary } from './RootBoundary';

const LoginPage = lazy(() =>
  import('@/features/auth/pages/LoginPage').then((m) => ({ default: m.LoginPage })),
);

const DashboardPage = lazy(() =>
  import('@/features/dashboard/pages/DashboardPage').then((m) => ({ default: m.DashboardPage })),
);

const SuppliersPage = lazy(() =>
  import('@/features/suppliers/pages/SuppliersPage').then((m) => ({ default: m.SuppliersPage })),
);
const SupplierDetailPage = lazy(() =>
  import('@/features/suppliers/pages/SupplierDetailPage').then((m) => ({
    default: m.SupplierDetailPage,
  })),
);
const SupplierFormPage = lazy(() =>
  import('@/features/suppliers/pages/SupplierFormPage').then((m) => ({
    default: m.SupplierFormPage,
  })),
);

const ProductsPage = lazy(() =>
  import('@/features/products/pages/ProductsPage').then((m) => ({ default: m.ProductsPage })),
);
const ProductDetailPage = lazy(() =>
  import('@/features/products/pages/ProductDetailPage').then((m) => ({
    default: m.ProductDetailPage,
  })),
);
const ProductFormPage = lazy(() =>
  import('@/features/products/pages/ProductFormPage').then((m) => ({
    default: m.ProductFormPage,
  })),
);

const PurchaseRequestsPage = lazy(() =>
  import('@/features/purchase-requests/pages/PurchaseRequestsPage').then((m) => ({
    default: m.PurchaseRequestsPage,
  })),
);
const PurchaseRequestDetailPage = lazy(() =>
  import('@/features/purchase-requests/pages/PurchaseRequestDetailPage').then((m) => ({
    default: m.PurchaseRequestDetailPage,
  })),
);
const PurchaseRequestCreatePage = lazy(() =>
  import('@/features/purchase-requests/pages/PurchaseRequestCreatePage').then((m) => ({
    default: m.PurchaseRequestCreatePage,
  })),
);
const ApprovalsPage = lazy(() =>
  import('@/features/purchase-requests/pages/ApprovalsPage').then((m) => ({
    default: m.ApprovalsPage,
  })),
);

const QuotationsPage = lazy(() =>
  import('@/features/quotations/pages/QuotationsPage').then((m) => ({ default: m.QuotationsPage })),
);
const QuotationDetailPage = lazy(() =>
  import('@/features/quotations/pages/QuotationDetailPage').then((m) => ({
    default: m.QuotationDetailPage,
  })),
);
const SupplierQuotationPage = lazy(() =>
  import('@/features/quotations/pages/SupplierQuotationPage').then((m) => ({
    default: m.SupplierQuotationPage,
  })),
);
const PlansPage = lazy(() =>
  import('@/features/requisition-plans/pages/PlansPage').then((m) => ({ default: m.PlansPage })),
);
const PlanFormPage = lazy(() =>
  import('@/features/requisition-plans/pages/PlanFormPage').then((m) => ({
    default: m.PlanFormPage,
  })),
);
const PlanDetailPage = lazy(() =>
  import('@/features/requisition-plans/pages/PlanDetailPage').then((m) => ({
    default: m.PlanDetailPage,
  })),
);
const CatalogsPage = lazy(() =>
  import('@/features/supplier-catalogs/pages/CatalogsPage').then((m) => ({
    default: m.CatalogsPage,
  })),
);
const CatalogReviewPage = lazy(() =>
  import('@/features/supplier-catalogs/pages/CatalogReviewPage').then((m) => ({
    default: m.CatalogReviewPage,
  })),
);
const OpenQuotationPage = lazy(() =>
  import('@/features/supplier-portal/pages/OpenQuotationPage').then((m) => ({
    default: m.OpenQuotationPage,
  })),
);
const SupplierSignupPage = lazy(() =>
  import('@/features/supplier-portal/pages/SupplierSignupPage').then((m) => ({
    default: m.SupplierSignupPage,
  })),
);
const CatalogUploadPage = lazy(() =>
  import('@/features/supplier-portal/pages/CatalogUploadPage').then((m) => ({
    default: m.CatalogUploadPage,
  })),
);
const ContractsPage = lazy(() =>
  import('@/features/contracts/pages/ContractsPage').then((m) => ({ default: m.ContractsPage })),
);
const ContractDetailPage = lazy(() =>
  import('@/features/contracts/pages/ContractDetailPage').then((m) => ({
    default: m.ContractDetailPage,
  })),
);
const ContractFormPage = lazy(() =>
  import('@/features/contracts/pages/ContractFormPage').then((m) => ({
    default: m.ContractFormPage,
  })),
);

const FinancePage = lazy(() =>
  import('@/features/finance/pages/FinancePage').then((m) => ({ default: m.FinancePage })),
);
const ReimbursementsPage = lazy(() =>
  import('@/features/reimbursements/pages/ReimbursementsPage').then((m) => ({
    default: m.ReimbursementsPage,
  })),
);
const ReimbursementCreatePage = lazy(() =>
  import('@/features/reimbursements/pages/ReimbursementCreatePage').then((m) => ({
    default: m.ReimbursementCreatePage,
  })),
);
const ReimbursementDetailPage = lazy(() =>
  import('@/features/reimbursements/pages/ReimbursementDetailPage').then((m) => ({
    default: m.ReimbursementDetailPage,
  })),
);
const DocumentsPage = lazy(() =>
  import('@/features/documents/pages/DocumentsPage').then((m) => ({ default: m.DocumentsPage })),
);
const AgendaPage = lazy(() =>
  import('@/features/agenda/pages/AgendaPage').then((m) => ({ default: m.AgendaPage })),
);

const ApproversSettingsPage = lazy(() =>
  import('@/features/purchase-requests/pages/ApproversSettingsPage').then((m) => ({
    default: m.ApproversSettingsPage,
  })),
);
const UsersPage = lazy(() =>
  import('@/features/users/pages/UsersPage').then((m) => ({ default: m.UsersPage })),
);
const AuditPage = lazy(() =>
  import('@/features/audit/pages/AuditPage').then((m) => ({ default: m.AuditPage })),
);
const ProfilePage = lazy(() =>
  import('@/features/profile/pages/ProfilePage').then((m) => ({ default: m.ProfilePage })),
);

const withSuspense = (element: ReactNode) => (
  <Suspense fallback={<LoadingState />}>{element}</Suspense>
);

/**
 * Rotas com link condicional na Sidebar (via `requires: Permission`) também
 * precisam de guarda no roteador — senão um usuário autenticado sem a
 * permissão consegue acessar a página só digitando a URL diretamente.
 */
const withPermission = (permission: Permission, element: ReactNode) => (
  <RequirePermission permission={permission}>{withSuspense(element)}</RequirePermission>
);

const protectedRoutes: RouteObject[] = [
  {
    path: ROUTE_PATHS.FORNECEDORES,
    element: withPermission(PERMISSIONS.SUPPLIER_READ, <SuppliersPage />),
  },
  {
    path: ROUTE_PATHS.FORNECEDOR_NOVO,
    element: withPermission(PERMISSIONS.SUPPLIER_WRITE, <SupplierFormPage />),
  },
  {
    path: `${ROUTE_PATHS.FORNECEDORES}/:id`,
    element: withPermission(PERMISSIONS.SUPPLIER_READ, <SupplierDetailPage />),
  },
  {
    path: `${ROUTE_PATHS.FORNECEDORES}/:id/editar`,
    element: withPermission(PERMISSIONS.SUPPLIER_WRITE, <SupplierFormPage />),
  },
  {
    path: ROUTE_PATHS.PRODUTOS,
    element: withPermission(PERMISSIONS.PRODUCT_READ, <ProductsPage />),
  },
  {
    path: ROUTE_PATHS.PRODUTO_NOVO,
    element: withPermission(PERMISSIONS.PRODUCT_WRITE, <ProductFormPage />),
  },
  {
    path: `${ROUTE_PATHS.PRODUTOS}/:id`,
    element: withPermission(PERMISSIONS.PRODUCT_READ, <ProductDetailPage />),
  },
  {
    path: `${ROUTE_PATHS.PRODUTOS}/:id/editar`,
    element: withPermission(PERMISSIONS.PRODUCT_WRITE, <ProductFormPage />),
  },
  {
    path: ROUTE_PATHS.SOLICITACOES,
    element: withPermission(PERMISSIONS.PURCHASE_REQUEST_READ, <PurchaseRequestsPage />),
  },
  {
    path: ROUTE_PATHS.SOLICITACAO_NOVA,
    element: withPermission(PERMISSIONS.PURCHASE_REQUEST_WRITE, <PurchaseRequestCreatePage />),
  },
  {
    path: `${ROUTE_PATHS.SOLICITACOES}/:id`,
    element: withPermission(PERMISSIONS.PURCHASE_REQUEST_READ, <PurchaseRequestDetailPage />),
  },
  {
    path: ROUTE_PATHS.APROVACOES,
    element: withPermission(PERMISSIONS.APPROVALS_READ, <ApprovalsPage />),
  },
  {
    path: ROUTE_PATHS.COTACOES,
    element: withPermission(PERMISSIONS.QUOTATION_READ, <QuotationsPage />),
  },
  {
    path: `${ROUTE_PATHS.COTACOES}/:id`,
    element: withPermission(PERMISSIONS.QUOTATION_READ, <QuotationDetailPage />),
  },
  {
    path: ROUTE_PATHS.PLANOS,
    element: withPermission(PERMISSIONS.QUOTATION_READ, <PlansPage />),
  },
  {
    path: ROUTE_PATHS.PLANO_NOVO,
    element: withPermission(PERMISSIONS.QUOTATION_WRITE, <PlanFormPage />),
  },
  {
    path: `${ROUTE_PATHS.PLANOS}/:id`,
    element: withPermission(PERMISSIONS.QUOTATION_READ, <PlanDetailPage />),
  },
  {
    path: `${ROUTE_PATHS.PLANOS}/:id/editar`,
    element: withPermission(PERMISSIONS.QUOTATION_WRITE, <PlanFormPage />),
  },
  {
    path: ROUTE_PATHS.CATALOGOS,
    element: withPermission(PERMISSIONS.QUOTATION_READ, <CatalogsPage />),
  },
  {
    path: `${ROUTE_PATHS.CATALOGOS}/:id`,
    element: withPermission(PERMISSIONS.QUOTATION_READ, <CatalogReviewPage />),
  },
  {
    path: ROUTE_PATHS.APROVADORES,
    element: withPermission(PERMISSIONS.USERS_MANAGE, <ApproversSettingsPage />),
  },
  {
    path: ROUTE_PATHS.USUARIOS,
    element: withPermission(PERMISSIONS.USERS_MANAGE, <UsersPage />),
  },
  {
    path: ROUTE_PATHS.AUDITORIA,
    element: withPermission(PERMISSIONS.AUDIT_READ, <AuditPage />),
  },
  { path: ROUTE_PATHS.PERFIL, element: withSuspense(<ProfilePage />) },
  {
    path: ROUTE_PATHS.CONTRATOS,
    element: withPermission(PERMISSIONS.CONTRACT_READ, <ContractsPage />),
  },
  {
    path: ROUTE_PATHS.CONTRATO_NOVO,
    element: withPermission(PERMISSIONS.CONTRACT_WRITE, <ContractFormPage />),
  },
  {
    path: `${ROUTE_PATHS.CONTRATOS}/:id`,
    element: withPermission(PERMISSIONS.CONTRACT_READ, <ContractDetailPage />),
  },
  {
    path: `${ROUTE_PATHS.CONTRATOS}/:id/editar`,
    element: withPermission(PERMISSIONS.CONTRACT_WRITE, <ContractFormPage />),
  },
  {
    path: ROUTE_PATHS.FINANCEIRO,
    element: withPermission(PERMISSIONS.FINANCE_READ, <FinancePage />),
  },
  { path: ROUTE_PATHS.REEMBOLSOS, element: withSuspense(<ReimbursementsPage />) },
  {
    path: ROUTE_PATHS.REEMBOLSO_NOVO,
    element: withPermission(PERMISSIONS.REIMBURSEMENT_REQUEST, <ReimbursementCreatePage />),
  },
  { path: `${ROUTE_PATHS.REEMBOLSOS}/:id`, element: withSuspense(<ReimbursementDetailPage />) },
  { path: ROUTE_PATHS.AGENDA, element: withSuspense(<AgendaPage />) },
  { path: ROUTE_PATHS.DOCUMENTOS, element: withSuspense(<DocumentsPage />) },
  // URLs desconhecidas dentro da área logada mostram a 404 com o shell
  // (Sidebar/Topbar), em vez de mandar silenciosamente para o Dashboard.
  { path: '*', element: <NotFoundPage /> },
];

const routes: RouteObject[] = [
  {
    path: ROUTE_PATHS.LOGIN,
    element: withSuspense(<LoginPage />),
    errorElement: <RootBoundary />,
  },
  // Fornecedor responde à cotação pelo link, sem conta no sistema.
  {
    path: `${ROUTE_PATHS.COTACAO_FORNECEDOR}/:token`,
    element: withSuspense(<SupplierQuotationPage />),
    errorElement: <RootBoundary />,
  },
  // Link aberto da cotação/plano: qualquer fornecedor entra com o CNPJ.
  {
    path: `${ROUTE_PATHS.COTAR}/:token`,
    element: withSuspense(<OpenQuotationPage />),
    errorElement: <RootBoundary />,
  },
  // Link da empresa para o fornecedor enviar o catálogo de produtos.
  {
    path: `${ROUTE_PATHS.ENVIAR_CATALOGO}/:token`,
    element: withSuspense(<CatalogUploadPage />),
    errorElement: <RootBoundary />,
  },
  // Link da empresa para o fornecedor fazer o próprio cadastro.
  {
    path: `${ROUTE_PATHS.CADASTRO_FORNECEDOR}/:token`,
    element: withSuspense(<SupplierSignupPage />),
    errorElement: <RootBoundary />,
  },
  {
    path: '/',
    element: (
      <RequireAuth>
        <AppShell />
      </RequireAuth>
    ),
    errorElement: <RootBoundary />,
    children: [{ index: true, element: withSuspense(<DashboardPage />) }, ...protectedRoutes],
  },
];

export const router = createBrowserRouter(routes);
