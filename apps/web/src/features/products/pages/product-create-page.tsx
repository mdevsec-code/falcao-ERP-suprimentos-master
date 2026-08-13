import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";
import { useCreateProduct } from "../hooks/use-product-mutations";
import { ProductForm } from "../components/product-form";
import type { ProductFormValues } from "../schemas/product-schema";

export function ProductCreatePage() {
  const navigate = useNavigate();
  const createProduct = useCreateProduct();

  function handleSubmit(values: ProductFormValues) {
    createProduct.mutate(
      {
        ...values,
        marca: values.marca || undefined,
        observacoes: values.observacoes || undefined,
        primarySupplierId: values.primarySupplierId || undefined,
        leadTimeDays: values.leadTimeDays === "" ? undefined : Number(values.leadTimeDays),
        initialPrice: values.initialPrice === "" ? undefined : Number(values.initialPrice),
      },
      { onSuccess: (product) => navigate(`/produtos/${product.id}`) },
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Novo Produto"
        description="Cadastre um novo produto no banco de produtos da Falcão Engenharia."
        actions={
          <Button variant="outline" onClick={() => navigate("/produtos")}>
            <ArrowLeft className="h-4 w-4" /> Voltar
          </Button>
        }
      />
      <Card>
        <CardContent className="pt-6">
          <ProductForm
            onSubmit={handleSubmit}
            isSubmitting={createProduct.isPending}
            submitLabel="Cadastrar produto"
            showInitialPrice
          />
        </CardContent>
      </Card>
    </div>
  );
}
