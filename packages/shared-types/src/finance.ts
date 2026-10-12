import type { PayableSource, PayableStatus, PaymentMethod } from "./enums";

export interface PayableDto {
  id: string;
  descricao: string;
  origem: PayableSource;
  supplierId: string | null;
  supplierName: string | null;
  contractId: string | null;
  contractNumero: string | null;
  purchaseRequestId: string | null;
  purchaseRequestTitle: string | null;
  reimbursementId: string | null;
  costCenter: string | null;
  valor: string;
  vencimento: string;
  status: PayableStatus;
  /** Aberta e com vencimento antes de hoje. */
  vencida: boolean;
  notaFiscal: string | null;
  notaFiscalEmissao: string | null;
  pagoEm: string | null;
  valorPago: string | null;
  formaPagamento: PaymentMethod | null;
  observacoes: string | null;
  createdByName: string;
  createdAt: string;
}

export interface PayableStatsDto {
  aPagar: string;
  aPagarCount: number;
  vencido: string;
  vencidoCount: number;
  proximos7Dias: string;
  proximos7DiasCount: number;
  pagoNoMes: string;
  pagoNoMesCount: number;
  /** Não canceladas sem nota fiscal informada — pendentes de conciliação. */
  semNotaCount: number;
}

export interface CashFlowPointDto {
  /** `YYYY-MM` */
  month: string;
  previsto: string;
  pago: string;
}

export interface CostCenterTotalDto {
  costCenter: string;
  aberto: string;
  pago: string;
}
