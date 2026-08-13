import { ArrowLeft, Clock, DollarSign, Hash, Package, Pencil, Power, Tag, Timer, Truck } from "lucide-react";
import * as React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { RequireRole } from "@/components/shared/require-role";
import { AddPriceDialog } from "../components/add-price-dialog";
import { formatCurrencyBRL, ProductCategoryBadge, ProductStatusBadge, ProductUnitLabel } from "../components/product-badges";
import { useSetProductActive } from "../hooks/use-product-mutations";
import { useProduct } from "../hooks/use-products";

export function ProductDetailPage() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const { data: product, isLoading } = useProduct(id);
  const setActive = useSetProductActive(id);
  const [confirmToggle, setConfirmToggle] = React.useState(false);

  if (isLoading || !product) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={product.nome}
        description={`${product.codigo}${product.marca ? ` · ${product.marca}` : ""}`}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => navigate("/produtos")}>
              <ArrowLeft className="h-4 w-4" /> Voltar
            </Button>
            <RequireRole roles={["ADMIN", "MANAGER", "BUYER"]}>
              <Button variant="outline" onClick={() => navigate(`/produtos/${id}/editar`)}>
                <Pencil className="h-4 w-4" /> Editar
              </Button>
              <Button
                variant={product.isActive ? "destructive" : "default"}
                onClick={() => setConfirmToggle(true)}
              >
                <Power className="h-4 w-4" /> {product.isActive ? "Desativar" : "Reativar"}
              </Button>
            </RequireRole>
          </div>
        }
      />

      <div className="flex flex-wrap items-center gap-3">
        <ProductStatusBadge isActive={product.isActive} />
        <ProductCategoryBadge categoria={product.categoria} />
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="suppliers">Fornecedores</TabsTrigger>
          <TabsTrigger value="prices">Histórico de Preços</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <InfoRow icon={Hash} label="Código" value={product.codigo} />
            <InfoRow icon={Tag} label="Marca" value={product.marca ?? "—"} />
            <InfoRow icon={Package} label="Unidade" value={<ProductUnitLabel unidade={product.unidade} />} />
            <InfoRow icon={Timer} label="Lead Time" value={product.leadTimeDays ? `${product.leadTimeDays} dias` : "—"} />
            <InfoRow icon={DollarSign} label="Último Preço" value={formatCurrencyBRL(product.lastPrice)} />
            <InfoRow
              icon={Clock}
              label="Cadastrado em"
              value={new Date(product.createdAt).toLocaleDateString("pt-BR")}
            />
            {product.observacoes && (
              <div className="rounded-lg border border-border bg-card p-4 sm:col-span-2">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Observações</p>
                <p className="mt-1 text-sm text-foreground">{product.observacoes}</p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="suppliers" className="space-y-4">
          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Fornecedor Principal
            </p>
            {product.primarySupplier ? (
              <Card>
                <CardContent className="flex items-center gap-3 p-4">
                  <div className="rounded-lg bg-primary/10 p-2 text-primary">
                    <Truck className="h-4 w-4" />
                  </div>
                  <p className="text-sm font-medium text-foreground">{product.primarySupplier.nomeFantasia}</p>
                </CardContent>
              </Card>
            ) : (
              <EmptyState icon={Truck} title="Nenhum fornecedor principal definido" />
            )}
          </div>

          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Fornecedores Alternativos
            </p>
            {product.alternativeSuppliers.length === 0 ? (
              <EmptyState icon={Truck} title="Nenhum fornecedor alternativo cadastrado" />
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {product.alternativeSuppliers.map((supplier) => (
                  <Card key={supplier.id}>
                    <CardContent className="flex items-center gap-3 p-4">
                      <div className="rounded-lg bg-muted p-2 text-muted-foreground">
                        <Truck className="h-4 w-4" />
                      </div>
                      <p className="text-sm font-medium text-foreground">{supplier.nomeFantasia}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="prices" className="space-y-4">
          <div className="flex justify-end">
            <RequireRole roles={["ADMIN", "MANAGER", "BUYER"]}>
              <AddPriceDialog productId={id} />
            </RequireRole>
          </div>
          {product.priceHistory.length === 0 ? (
            <EmptyState icon={DollarSign} title="Nenhum preço registrado" />
          ) : (
            <div className="space-y-2">
              {product.priceHistory.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between rounded-lg border border-border bg-card p-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-primary/10 p-2 text-primary">
                      <DollarSign className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{formatCurrencyBRL(entry.price)}</p>
                      <p className="text-xs text-muted-foreground">
                        {entry.supplierName ?? "Sem fornecedor"} ·{" "}
                        {new Date(entry.recordedAt).toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <ConfirmDialog
        open={confirmToggle}
        onOpenChange={setConfirmToggle}
        title={product.isActive ? "Desativar produto" : "Reativar produto"}
        description={
          product.isActive
            ? "O produto será marcado como inativo e deixará de aparecer em novas solicitações."
            : "O produto voltará a ficar disponível para novas solicitações de compra."
        }
        destructive={product.isActive}
        confirmLabel={product.isActive ? "Desativar" : "Reativar"}
        isLoading={setActive.isPending}
        onConfirm={() => setActive.mutate(!product.isActive, { onSuccess: () => setConfirmToggle(false) })}
      />
    </div>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Hash;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-border bg-card p-4">
      <div className="rounded-lg bg-muted p-2 text-muted-foreground">
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className="text-sm font-medium text-foreground">{value}</p>
      </div>
    </div>
  );
}
