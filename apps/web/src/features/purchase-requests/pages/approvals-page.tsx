import { PurchaseRequestStatus } from "@falcao-erp/shared-types";
import { useAuth } from "@/hooks/use-auth";
import { PurchaseRequestsListPage } from "./purchase-requests-list-page";

const QUEUE_BY_ROLE: Partial<Record<string, PurchaseRequestStatus[]>> = {
  MANAGER: ["AGUARDANDO_APROVACAO"],
  BUYER: ["EM_COMPRAS", "EM_COTACAO"],
  WAREHOUSE: ["PEDIDO_REALIZADO", "AGUARDANDO_RECEBIMENTO"],
  ADMIN: [
    "AGUARDANDO_APROVACAO",
    "EM_COMPRAS",
    "EM_COTACAO",
    "PEDIDO_REALIZADO",
    "AGUARDANDO_RECEBIMENTO",
  ],
};

export function ApprovalsPage() {
  const { user } = useAuth();
  const queueStatuses = (user && QUEUE_BY_ROLE[user.role]) ?? [];

  return (
    <PurchaseRequestsListPage
      title="Aprovações"
      description="Solicitações de compra aguardando uma ação sua."
      queueStatuses={queueStatuses}
      showCreateAction={false}
    />
  );
}
