import { QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { RequireAuth } from "@/components/shared/require-auth";
import { AuthProvider } from "@/contexts/auth-context";
import { ThemeProvider } from "@/contexts/theme-context";
import { DashboardPage } from "@/features/dashboard/pages/dashboard-page";
import { LoginPage } from "@/features/auth/pages/login-page";
import { ProductCreatePage } from "@/features/products/pages/product-create-page";
import { ProductDetailPage } from "@/features/products/pages/product-detail-page";
import { ProductEditPage } from "@/features/products/pages/product-edit-page";
import { ProductsListPage } from "@/features/products/pages/products-list-page";
import { ApprovalsPage } from "@/features/purchase-requests/pages/approvals-page";
import { PurchaseRequestCreatePage } from "@/features/purchase-requests/pages/purchase-request-create-page";
import { PurchaseRequestDetailPage } from "@/features/purchase-requests/pages/purchase-request-detail-page";
import { PurchaseRequestsListPage } from "@/features/purchase-requests/pages/purchase-requests-list-page";
import { SupplierCreatePage } from "@/features/suppliers/pages/supplier-create-page";
import { SupplierDetailPage } from "@/features/suppliers/pages/supplier-detail-page";
import { SupplierEditPage } from "@/features/suppliers/pages/supplier-edit-page";
import { SuppliersListPage } from "@/features/suppliers/pages/suppliers-list-page";
import { AppShell } from "@/layouts/app-shell";
import { AuthLayout } from "@/layouts/auth-layout";
import { NotFoundPage } from "@/pages/not-found-page";
import { queryClient } from "./query-client";

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              <Route element={<AuthLayout />}>
                <Route path="/login" element={<LoginPage />} />
              </Route>

              <Route element={<RequireAuth />}>
                <Route element={<AppShell />}>
                  <Route path="/" element={<DashboardPage />} />
                  <Route path="/fornecedores" element={<SuppliersListPage />} />
                  <Route path="/fornecedores/novo" element={<SupplierCreatePage />} />
                  <Route path="/fornecedores/:id" element={<SupplierDetailPage />} />
                  <Route path="/fornecedores/:id/editar" element={<SupplierEditPage />} />
                  <Route path="/produtos" element={<ProductsListPage />} />
                  <Route path="/produtos/novo" element={<ProductCreatePage />} />
                  <Route path="/produtos/:id" element={<ProductDetailPage />} />
                  <Route path="/produtos/:id/editar" element={<ProductEditPage />} />
                  <Route path="/solicitacoes" element={<PurchaseRequestsListPage />} />
                  <Route path="/solicitacoes/novo" element={<PurchaseRequestCreatePage />} />
                  <Route path="/solicitacoes/:id" element={<PurchaseRequestDetailPage />} />
                  <Route path="/aprovacoes" element={<ApprovalsPage />} />
                  <Route path="*" element={<NotFoundPage />} />
                </Route>
              </Route>
            </Routes>
          </BrowserRouter>
          <Toaster position="top-right" richColors />
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
