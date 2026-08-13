import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";
import { useCreateSupplier } from "../hooks/use-supplier-mutations";
import { SupplierForm } from "../components/supplier-form";
import type { SupplierFormValues } from "../schemas/supplier-schema";

export function SupplierCreatePage() {
  const navigate = useNavigate();
  const createSupplier = useCreateSupplier();

  function handleSubmit(values: SupplierFormValues) {
    createSupplier.mutate(
      { ...values, inscricaoEstadual: values.inscricaoEstadual || undefined },
      { onSuccess: (supplier) => navigate(`/fornecedores/${supplier.id}`) },
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Novo Fornecedor"
        description="Cadastre um novo fornecedor para a Falcão Engenharia."
        actions={
          <Button variant="outline" onClick={() => navigate("/fornecedores")}>
            <ArrowLeft className="h-4 w-4" /> Voltar
          </Button>
        }
      />
      <Card>
        <CardContent className="pt-6">
          <SupplierForm
            onSubmit={handleSubmit}
            isSubmitting={createSupplier.isPending}
            submitLabel="Cadastrar fornecedor"
          />
        </CardContent>
      </Card>
    </div>
  );
}
