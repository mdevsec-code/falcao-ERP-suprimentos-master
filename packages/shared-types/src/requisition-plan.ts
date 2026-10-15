import type { PurchaseRequestStatus, QuotationStatus, RequisitionPlanStatus } from "./enums";

export interface RequisitionPlanQuotationRefDto {
  id: string;
  numero: number;
  status: QuotationStatus;
  convidados: number;
  respondidos: number;
}

export interface RequisitionPlanSummaryDto {
  id: string;
  numero: number;
  titulo: string;
  obra: string | null;
  status: RequisitionPlanStatus;
  prazoResposta: string;
  solicitacoes: number;
  createdByName: string;
  createdAt: string;
  lancadoEm: string | null;
  /** Cotação criada ao lançar o plano. */
  quotation: RequisitionPlanQuotationRefDto | null;
}

export interface RequisitionPlanRequestDto {
  id: string;
  title: string;
  status: PurchaseRequestStatus;
  costCenter: string | null;
  requesterName: string;
  itemCount: number;
  createdAt: string;
}

export interface PlanItemOriginDto {
  purchaseRequestId: string;
  purchaseRequestTitle: string;
  purchaseRequestItemId: string;
  quantidade: string;
}

/** Item do plano: itens iguais de várias solicitações somados numa linha só. */
export interface PlanItemDto {
  chave: string;
  productId: string | null;
  productCodigo: string | null;
  descricao: string;
  quantidade: string;
  unidade: string;
  marca: string | null;
  referencia: string | null;
  origens: PlanItemOriginDto[];
}

export interface RequisitionPlanDetailDto extends RequisitionPlanSummaryDto {
  observacoes: string | null;
  requests: RequisitionPlanRequestDto[];
  items: PlanItemDto[];
  /** Token do link aberto da cotação — só para quem gerencia e enquanto a cotação está aberta. */
  linkAbertoToken: string | null;
}

/** Solicitação aprovada que ainda não está em outro plano ativo. */
export interface PlanCandidateRequestDto extends RequisitionPlanRequestDto {
  items: Array<{
    id: string;
    productId: string | null;
    productCodigo: string | null;
    description: string;
    quantity: string;
    unit: string;
    marca: string | null;
    referencia: string | null;
  }>;
}

export interface RequisitionPlanStatsDto {
  rascunhos: number;
  lancados: number;
  /** Solicitações aprovadas fora de qualquer plano ou cotação. */
  solicitacoesDisponiveis: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Consolidação — a mesma regra na prévia da tela e no lançamento pela API.
// ─────────────────────────────────────────────────────────────────────────────

export interface ConsolidationInput {
  purchaseRequestId: string;
  purchaseRequestTitle: string;
  items: PlanCandidateRequestDto["items"];
}

/** Minúsculas, sem acento e com espaços simples: "Cimento  CP-II " ≡ "cimento cp-ii". */
function normalize(text: string | null | undefined): string {
  return (text ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Soma os itens iguais das solicitações. Mesmo produto do catálogo (ou mesma
 * descrição, quando digitado à mão) com a mesma unidade, marca e referência
 * vira uma linha; especificação diferente fica em linha separada.
 * A ordem segue a primeira aparição de cada item.
 */
export function consolidatePlanItems(requests: readonly ConsolidationInput[]): PlanItemDto[] {
  const byKey = new Map<string, PlanItemDto & { cents: number }>();
  for (const request of requests) {
    for (const item of request.items) {
      const spec = `${normalize(item.unit)}|${normalize(item.marca)}|${normalize(item.referencia)}`;
      const chave = item.productId ? `p:${item.productId}|${spec}` : `d:${normalize(item.description)}|${spec}`;
      const cents = Math.round(Number(item.quantity) * 100);
      const origin: PlanItemOriginDto = {
        purchaseRequestId: request.purchaseRequestId,
        purchaseRequestTitle: request.purchaseRequestTitle,
        purchaseRequestItemId: item.id,
        quantidade: item.quantity,
      };
      const current = byKey.get(chave);
      if (current) {
        current.cents += cents;
        current.origens.push(origin);
      } else {
        byKey.set(chave, {
          chave,
          productId: item.productId,
          productCodigo: item.productCodigo,
          descricao: item.description.trim(),
          quantidade: "",
          unidade: item.unit,
          marca: item.marca,
          referencia: item.referencia,
          origens: [origin],
          cents,
        });
      }
    }
  }
  return [...byKey.values()].map(({ cents, ...item }) => ({ ...item, quantidade: (cents / 100).toFixed(2) }));
}
