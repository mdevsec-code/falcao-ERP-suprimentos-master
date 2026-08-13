import { ArrowLeft } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/shared/page-header";
import { useSupplier } from "../hooks/use-suppliers";
import { useUpdateSupplier } from "../hooks/use-supplier-mutations";
import { SupplierForm } from "../components/supplier-form";
import type { SupplierFormValues } from "../schemas/supplier-schema";

export function SupplierEditPage() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const { data: supplier, isLoading } = useSupplier(id);
  const updateSupplier = useUpdateSupplier(id);

  function handleSubmit(values: SupplierFormValues) {
    updateSupplier.mutate(
      { ...values, inscricaoEstadual: values.inscricaoEstadual || undefined },
      { onSuccess: () => navigate(`/fornecedores/${id}`) },
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Editar Fornecedor"
        description={supplier?.nomeFantasia}
        actions={
          <Button variant="outline" onClick={() => navigate(`/fornecedores/${id}`)}>
            <ArrowLeft className="h-4 w-4" /> Voltar
          </Button>
        }
      />
      <Card>
        <CardContent className="pt-6">
          {isLoading || !supplier ? (
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : (
            <SupplierForm
              defaultValues={{
                razaoSocial: supplier.razaoSocial,
                nomeFantasia: supplier.nomeFantasia,
                cnpj: supplier.cnpj,
                inscricaoEstadual: supplier.inscricaoEstadual ?? "",
                categoria: supplier.categoria,
                cidade: supplier.cidade,
                estado: supplier.estado,
                responsavel: supplier.responsavel,
                contacts: supplier.contacts.map((contact) => ({
                  type: contact.type,
                  label: contact.label,
                  value: contact.value,
                })),
              }}
              onSubmit={handleSubmit}
              isSubmitting={updateSupplier.isPending}
              submitLabel="Salvar alterações"
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
