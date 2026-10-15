import type {
  PurchaseRequestStatus,
  QuotationStatus,
  QuotationSupplierOrigin,
  QuotationSupplierStatus,
} from "./enums";

/** Solicitação que contribuiu para um item consolidado (cotação de plano). */
export interface QuotationItemOriginDto {
  purchaseRequestId: string;
  purchaseRequestTitle: string;
  quantidade: string;
}

export interface QuotationItemDto {
  id: string;
  purchaseRequestItemId: string | null;
  productId: string | null;
  productCodigo: string | null;
  descricao: string;
  quantidade: string;
  unidade: string;
  /** Marca e referência pedidas pelo solicitante (sugestão, não obrigação). */
  marca: string | null;
  referencia: string | null;
  vencedorId: string | null;
  /** Último preço do catálogo antes desta cotação (feedback de preço). */
  ultimoPreco: string | null;
  ultimoPrecoEm: string | null;
  ultimoFornecedor: string | null;
  /** Vazio na cotação de uma solicitação só. */
  origens: QuotationItemOriginDto[];
}

export interface QuotationSupplierDto {
  id: string;
  supplierId: string;
  supplierName: string;
  supplierCnpj: string;
  contatoNome: string | null;
  contatoEmail: string | null;
  contatoTelefone: string | null;
  status: QuotationSupplierStatus;
  /** Convidado por compras ou entrou sozinho pelo link aberto. */
  origem: QuotationSupplierOrigin;
  /** Fornecedor se cadastrou pelo link e compras ainda não aprovou o cadastro. */
  cadastroPendente: boolean;
  respondidoEm: string | null;
  respondidoPor: string | null;
  prazoEntregaDias: number | null;
  condicaoPagamento: string | null;
  validadeProposta: string | null;
  frete: string | null;
  observacoes: string | null;
  /** Token do link de resposta — só vem para quem pode gerenciar a cotação. */
  linkToken: string | null;
}

export interface QuotationPriceDto {
  quotationSupplierId: string;
  quotationItemId: string;
  precoUnitario: string | null;
  marca: string | null;
  referencia: string | null;
  disponivel: boolean;
  observacao: string | null;
}

export interface QuotationItemAnalysisDto {
  itemId: string;
  propostas: number;
  menorPreco: string | null;
  maiorPreco: string | null;
  mediaPreco: string | null;
  /** Fornecedores empatados no menor preço. */
  melhorFornecedorIds: string[];
  /** Menor preço contra o último preço do catálogo, em % (negativo = mais barato). */
  variacaoUltimoPct: number | null;
}

export interface QuotationSupplierAnalysisDto {
  quotationSupplierId: string;
  /** Soma de preço × quantidade dos itens cotados + frete. */
  total: string | null;
  itensCotados: number;
  itensMaisBaratos: number;
  /** 1 = menor total entre quem cotou todos os itens. */
  ranking: number | null;
  cotouTudo: boolean;
}

export interface QuotationAnalysisDto {
  items: QuotationItemAnalysisDto[];
  suppliers: QuotationSupplierAnalysisDto[];
  /** Comprando cada item no menor preço. */
  totalMelhorPreco: string | null;
  /** Comprando cada item no fornecedor escolhido. */
  totalVencedores: string | null;
  itensComVencedor: number;
  /** Diferença contra o último preço pago, nos itens que têm histórico (positivo = economia). */
  economiaVsUltimo: string | null;
}

export interface QuotationSummaryDto {
  id: string;
  numero: number;
  titulo: string;
  status: QuotationStatus;
  prazoResposta: string;
  /** Cotação de uma solicitação; `null` na cotação de um plano. */
  purchaseRequestId: string | null;
  purchaseRequestTitle: string | null;
  /** Plano de requisição que originou a cotação. */
  plan: { id: string; numero: number; titulo: string; obra: string | null } | null;
  itens: number;
  convidados: number;
  respondidos: number;
  createdByName: string;
  createdAt: string;
}

export interface QuotationDetailDto extends QuotationSummaryDto {
  observacoes: string | null;
  encerradaEm: string | null;
  purchaseRequest: {
    id: string;
    title: string;
    status: PurchaseRequestStatus;
    costCenter: string | null;
    requesterName: string;
  } | null;
  /** Token do link aberto (qualquer fornecedor entra com o CNPJ) — só para quem gerencia; `null` = desligado. */
  linkAbertoToken: string | null;
  items: QuotationItemDto[];
  suppliers: QuotationSupplierDto[];
  prices: QuotationPriceDto[];
  analysis: QuotationAnalysisDto;
}

export interface QuotationStatsDto {
  abertas: number;
  aguardandoResposta: number;
  vencendo: number;
  encerradasNoMes: number;
}

/** O que o fornecedor vê ao abrir o link — nada de preços de concorrentes nem dados internos. */
export interface PublicQuotationDto {
  empresa: string;
  numero: number;
  titulo: string;
  prazoResposta: string;
  observacoes: string | null;
  /** Ainda aceita resposta (aberta e dentro do prazo). */
  aberta: boolean;
  motivoFechada: "ENCERRADA" | "CANCELADA" | "PRAZO" | null;
  fornecedor: { nomeFantasia: string; razaoSocial: string };
  itens: Array<{
    id: string;
    descricao: string;
    quantidade: string;
    unidade: string;
    marca: string | null;
    referencia: string | null;
  }>;
  resposta: {
    status: QuotationSupplierStatus;
    respondidoEm: string | null;
    respondidoPor: string | null;
    prazoEntregaDias: number | null;
    condicaoPagamento: string | null;
    validadeProposta: string | null;
    frete: string | null;
    observacoes: string | null;
    precos: Array<{
      itemId: string;
      precoUnitario: string | null;
      marca: string | null;
      referencia: string | null;
      disponivel: boolean;
      observacao: string | null;
    }>;
  };
}

/** Link aberto da cotação (do plano): o que qualquer fornecedor vê antes de se identificar. */
export interface PublicOpenQuotationDto {
  empresa: string;
  numero: number;
  titulo: string;
  prazoResposta: string;
  observacoes: string | null;
  aberta: boolean;
  motivoFechada: PublicQuotationDto["motivoFechada"];
  obra: string | null;
  plano: { numero: number } | null;
  itens: PublicQuotationDto["itens"];
}

/** Fornecedor identificado pelo CNPJ no link aberto: recebe o próprio link de resposta. */
export interface PublicOpenQuotationJoinDto {
  linkToken: string;
  fornecedor: string;
  /** Cadastro feito agora pelo fornecedor, aguardando aprovação de compras. */
  cadastroPendente: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// Análise do mapa de cotação — usada pela API (resposta) e pelo web (exportação).
// Contas em centavos inteiros para não acumular erro de ponto flutuante.
// ─────────────────────────────────────────────────────────────────────────────

const toCents = (value: string | number): number => Math.round(Number(value) * 100);
const fromCents = (cents: number): string => (cents / 100).toFixed(2);
/** preço (centavos) × quantidade (até 2 casas) → centavos. */
const lineCents = (priceCents: number, quantidade: string): number =>
  Math.round((priceCents * Math.round(Number(quantidade) * 100)) / 100);

export interface AnalyzeQuotationInput {
  items: Array<Pick<QuotationItemDto, "id" | "quantidade" | "vencedorId" | "ultimoPreco">>;
  suppliers: Array<Pick<QuotationSupplierDto, "id" | "frete" | "status">>;
  prices: QuotationPriceDto[];
}

export function analyzeQuotation({ items, suppliers, prices }: AnalyzeQuotationInput): QuotationAnalysisDto {
  const validPrice = (p: QuotationPriceDto) => p.disponivel && p.precoUnitario !== null && Number(p.precoUnitario) > 0;
  const declined = new Set(suppliers.filter((s) => s.status === "RECUSOU").map((s) => s.id));
  const usable = prices.filter((p) => validPrice(p) && !declined.has(p.quotationSupplierId));

  let totalMelhor = 0;
  let temMelhor = false;
  let economia = 0;
  let temEconomia = false;
  let totalVenc = 0;
  let itensComVencedor = 0;
  const cheapestCount = new Map<string, number>();

  const itemAnalysis: QuotationItemAnalysisDto[] = items.map((item) => {
    const offers = usable.filter((p) => p.quotationItemId === item.id);
    if (offers.length === 0) {
      if (item.vencedorId) itensComVencedor += 1;
      return {
        itemId: item.id,
        propostas: 0,
        menorPreco: null,
        maiorPreco: null,
        mediaPreco: null,
        melhorFornecedorIds: [],
        variacaoUltimoPct: null,
      };
    }
    const cents = offers.map((p) => toCents(p.precoUnitario as string));
    const min = Math.min(...cents);
    const max = Math.max(...cents);
    const avg = Math.round(cents.reduce((a, b) => a + b, 0) / cents.length);
    const best = offers.filter((p) => toCents(p.precoUnitario as string) === min).map((p) => p.quotationSupplierId);
    best.forEach((id) => cheapestCount.set(id, (cheapestCount.get(id) ?? 0) + 1));

    totalMelhor += lineCents(min, item.quantidade);
    temMelhor = true;

    const chosen = item.vencedorId ? offers.find((p) => p.quotationSupplierId === item.vencedorId) : undefined;
    if (item.vencedorId) {
      itensComVencedor += 1;
      if (chosen) totalVenc += lineCents(toCents(chosen.precoUnitario as string), item.quantidade);
    }

    let variacao: number | null = null;
    if (item.ultimoPreco !== null && Number(item.ultimoPreco) > 0) {
      const last = toCents(item.ultimoPreco);
      const pct = ((min - last) / last) * 1000;
      // Arredonda pelo valor absoluto (−3,75% → −3,8%), como se lê numa planilha.
      variacao = (Math.sign(pct) * Math.round(Math.abs(pct))) / 10;
      const paid = chosen ? toCents(chosen.precoUnitario as string) : min;
      economia += lineCents(last - paid, item.quantidade);
      temEconomia = true;
    }

    return {
      itemId: item.id,
      propostas: offers.length,
      menorPreco: fromCents(min),
      maiorPreco: fromCents(max),
      mediaPreco: fromCents(avg),
      melhorFornecedorIds: best,
      variacaoUltimoPct: variacao,
    };
  });

  const supplierAnalysis: QuotationSupplierAnalysisDto[] = suppliers.map((s) => {
    const own = usable.filter((p) => p.quotationSupplierId === s.id);
    const itemIds = new Set(items.map((i) => i.id));
    let total = 0;
    for (const p of own) {
      const item = items.find((i) => i.id === p.quotationItemId);
      if (item) total += lineCents(toCents(p.precoUnitario as string), item.quantidade);
    }
    if (own.length > 0 && s.frete !== null) total += toCents(s.frete);
    const cotados = own.filter((p) => itemIds.has(p.quotationItemId)).length;
    return {
      quotationSupplierId: s.id,
      total: own.length > 0 ? fromCents(total) : null,
      itensCotados: cotados,
      itensMaisBaratos: cheapestCount.get(s.id) ?? 0,
      ranking: null,
      cotouTudo: cotados === items.length && items.length > 0,
    };
  });

  // Ranking só entre quem cotou todos os itens — comparar totais parciais engana.
  supplierAnalysis
    .filter((s) => s.cotouTudo && s.total !== null)
    .sort((a, b) => Number(a.total) - Number(b.total))
    .forEach((s, index) => {
      s.ranking = index + 1;
    });

  return {
    items: itemAnalysis,
    suppliers: supplierAnalysis,
    totalMelhorPreco: temMelhor ? fromCents(totalMelhor) : null,
    totalVencedores: itensComVencedor > 0 ? fromCents(totalVenc) : null,
    itensComVencedor,
    economiaVsUltimo: temEconomia ? fromCents(economia) : null,
  };
}
