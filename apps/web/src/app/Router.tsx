import { lazy, Suspense, type ReactNode } from 'react';
import { createBrowserRouter, type RouteObject } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import { ROUTE_PATHS } from '@/constants/routes';
import { LoadingState } from '@/components/feedback/LoadingState';
import { ComingSoonPage } from '@/components/common/ComingSoonPage';
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
  { path: ROUTE_PATHS.CONTRATOS, element: <ComingSoonPage navKey="contracts" /> },
  { path: ROUTE_PATHS.FINANCEIRO, element: <ComingSoonPage navKey="finance" /> },
  { path: ROUTE_PATHS.REEMBOLSOS, element: <ComingSoonPage navKey="reimbursements" /> },
  { path: ROUTE_PATHS.AGENDA, element: <ComingSoonPage navKey="agenda" /> },
  { path: ROUTE_PATHS.DOCUMENTOS, element: <ComingSoonPage navKey="documents" /> },
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
