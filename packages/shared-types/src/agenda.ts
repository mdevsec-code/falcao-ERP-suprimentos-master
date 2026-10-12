import type { AgendaEventType } from "./enums";

/** De onde veio o item: evento criado na agenda ou prazo de outro módulo. */
export type AgendaItemKind = "EVENT" | "PAYABLE_DUE" | "CONTRACT_END" | "DOCUMENT_EXPIRY";

export interface AgendaItemDto {
  /** Único no resultado (prefixado pelo tipo). */
  key: string;
  kind: AgendaItemKind;
  /** Id da entidade de origem (evento, conta, contrato ou documento). */
  sourceId: string;
  titulo: string;
  /** ISO completo para eventos com hora; `YYYY-MM-DD` para itens de dia inteiro. */
  inicio: string;
  fim: string | null;
  diaInteiro: boolean;
  tipo: AgendaEventType | null;
  obra: string | null;
  local: string | null;
  descricao: string | null;
  /** Valor monetário (contas a pagar). */
  valor: string | null;
  supplierId: string | null;
  supplierName: string | null;
  purchaseRequestId: string | null;
  createdById: string | null;
}
