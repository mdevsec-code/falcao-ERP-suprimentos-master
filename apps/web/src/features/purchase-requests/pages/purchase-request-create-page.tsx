import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";
import { useCreatePurchaseRequest } from "../hooks/use-purchase-request-mutations";
import { PurchaseRequestForm } from "../components/purchase-request-form";
import type { PurchaseRequestFormValues } from "../schemas/purchase-request-schema";

export function PurchaseRequestCreatePage() {
  const navigate = useNavigate();
  const createRequest = useCreatePurchaseRequest();

  function handleSubmit(values: PurchaseRequestFormValues) {
    createRequest.mutate(
      {
        title: values.title,
        justification: values.justification || undefined,
        costCenter: values.costCenter || undefined,
        items: values.items.map((item) => ({
          productId: item.productId || undefined,
          description: item.description,
          quantity: Number(item.quantity),
          unit: item.unit,
          estimatedPrice: item.estimatedPrice === "" || item.estimatedPrice === undefined
            ? undefined
            : Number(item.estimatedPrice),
        })),
      },
      { onSuccess: (request) => navigate(`/solicitacoes/${request.id}`) },
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Nova Solicitação de Compra"
        description="Descreva o que você precisa. A solicitação seguirá para aprovação do seu gestor."
        actions={
          <Button variant="outline" onClick={() => navigate("/solicitacoes")}>
            <ArrowLeft className="h-4 w-4" /> Voltar
          </Button>
        }
      />
      <Card>
        <CardContent className="pt-6">
          <PurchaseRequestForm
            onSubmit={handleSubmit}
            isSubmitting={createRequest.isPending}
            submitLabel="Enviar solicitação"
          />
        </CardContent>
      </Card>
    </div>
  );
}
