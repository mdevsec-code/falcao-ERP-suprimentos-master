import { ArrowLeft } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/shared/page-header";
import { useProduct } from "../hooks/use-products";
import { useUpdateProduct } from "../hooks/use-product-mutations";
import { ProductForm } from "../components/product-form";
import type { ProductFormValues } from "../schemas/product-schema";

export function ProductEditPage() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const { data: product, isLoading } = useProduct(id);
  const updateProduct = useUpdateProduct(id);

  function handleSubmit(values: ProductFormValues) {
    const { initialPrice, ...rest } = values;
    updateProduct.mutate(
      {
        ...rest,
        marca: values.marca || undefined,
        observacoes: values.observacoes || undefined,
        primarySupplierId: values.primarySupplierId || undefined,
        leadTimeDays: values.leadTimeDays === "" ? undefined : Number(values.leadTimeDays),
      },
      { onSuccess: () => navigate(`/produtos/${id}`) },
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Editar Produto"
        description={product?.nome}
        actions={
          <Button variant="outline" onClick={() => navigate(`/produtos/${id}`)}>
            <ArrowLeft className="h-4 w-4" /> Voltar
          </Button>
        }
      />
      <Card>
        <CardContent className="pt-6">
          {isLoading || !product ? (
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : (
            <ProductForm
              defaultValues={{
                codigo: product.codigo,
                nome: product.nome,
                categoria: product.categoria,
                marca: product.marca ?? "",
                unidade: product.unidade,
                leadTimeDays: product.leadTimeDays ?? undefined,
                observacoes: product.observacoes ?? "",
                primarySupplierId: product.primarySupplier?.id ?? "",
                alternativeSupplierIds: product.alternativeSuppliers.map((supplier) => supplier.id),
              }}
              onSubmit={handleSubmit}
              isSubmitting={updateProduct.isPending}
              submitLabel="Salvar alterações"
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
