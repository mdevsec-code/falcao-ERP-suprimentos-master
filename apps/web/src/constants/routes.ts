/**
 * Caminhos de rota centralizados — o roteador, a Sidebar, a Topbar
 * (breadcrumb) e os atalhos do Dashboard consomem o mesmo lugar.
 */
export const ROUTE_PATHS = {
  ROOT: '/',
  LOGIN: '/login',
  DASHBOARD: '/',
  FORNECEDORES: '/fornecedores',
  FORNECEDOR_NOVO: '/fornecedores/novo',
  PRODUTOS: '/produtos',
  PRODUTO_NOVO: '/produtos/novo',
  SOLICITACOES: '/solicitacoes',
  SOLICITACAO_NOVA: '/solicitacoes/novo',
  APROVACOES: '/aprovacoes',
  COTACOES: '/cotacoes',
  PLANOS: '/planos',
  PLANO_NOVO: '/planos/novo',
  CATALOGOS: '/catalogos',
  /** Página pública do fornecedor (sem login), aberta pelo link da cotação. */
  COTACAO_FORNECEDOR: '/cotacao',
  /** Link aberto da cotação/plano (sem login): qualquer fornecedor entra com o CNPJ. */
  COTAR: '/cotar',
  /** Link público para o fornecedor enviar o catálogo de produtos (sem login). */
  ENVIAR_CATALOGO: '/enviar-catalogo',
  CONTRATOS: '/contratos',
  CONTRATO_NOVO: '/contratos/novo',
  FINANCEIRO: '/financeiro',
  REEMBOLSOS: '/reembolsos',
  REEMBOLSO_NOVO: '/reembolsos/novo',
  AGENDA: '/agenda',
  DOCUMENTOS: '/documentos',
  USUARIOS: '/usuarios',
  AUDITORIA: '/auditoria',
  /** Quem assina cada etapa do plano de aquisição. */
  APROVADORES: '/aprovadores',
  PERFIL: '/perfil',
  NOT_FOUND: '/404',
} as const;

export type RoutePath = (typeof ROUTE_PATHS)[keyof typeof ROUTE_PATHS];

/** Construtores de rotas com parâmetro — evita montar strings à mão nas telas. */
export const routeTo = {
  supplier: (id: string) => `${ROUTE_PATHS.FORNECEDORES}/${id}`,
  supplierEdit: (id: string) => `${ROUTE_PATHS.FORNECEDORES}/${id}/editar`,
  product: (id: string) => `${ROUTE_PATHS.PRODUTOS}/${id}`,
  productEdit: (id: string) => `${ROUTE_PATHS.PRODUTOS}/${id}/editar`,
  purchaseRequest: (id: string) => `${ROUTE_PATHS.SOLICITACOES}/${id}`,
  quotation: (id: string) => `${ROUTE_PATHS.COTACOES}/${id}`,
  supplierQuotation: (token: string) => `${ROUTE_PATHS.COTACAO_FORNECEDOR}/${token}`,
  openQuotation: (token: string) => `${ROUTE_PATHS.COTAR}/${token}`,
  supplierCatalogUpload: (token: string) => `${ROUTE_PATHS.ENVIAR_CATALOGO}/${token}`,
  plan: (id: string) => `${ROUTE_PATHS.PLANOS}/${id}`,
  planEdit: (id: string) => `${ROUTE_PATHS.PLANOS}/${id}/editar`,
  catalog: (id: string) => `${ROUTE_PATHS.CATALOGOS}/${id}`,
  contract: (id: string) => `${ROUTE_PATHS.CONTRATOS}/${id}`,
  contractEdit: (id: string) => `${ROUTE_PATHS.CONTRATOS}/${id}/editar`,
  reimbursement: (id: string) => `${ROUTE_PATHS.REEMBOLSOS}/${id}`,
} as const;

/**
 * Mapa do primeiro segmento da rota → chave de tradução (`common:nav.<chave>`).
 * As URLs usam slugs em português (`/fornecedores`) enquanto as chaves do
 * i18n usam nomes semânticos em inglês (`nav.suppliers`) — sem este mapa, a
 * trilha de navegação (breadcrumb) da Topbar cairia no fallback da URL crua.
 */
export const ROUTE_NAV_KEYS: Record<string, string> = {
  [ROUTE_PATHS.FORNECEDORES]: 'suppliers',
  [ROUTE_PATHS.PRODUTOS]: 'products',
  [ROUTE_PATHS.SOLICITACOES]: 'purchaseRequests',
  [ROUTE_PATHS.APROVACOES]: 'approvals',
  [ROUTE_PATHS.COTACOES]: 'quotations',
  [ROUTE_PATHS.PLANOS]: 'plans',
  [ROUTE_PATHS.CATALOGOS]: 'catalogs',
  [ROUTE_PATHS.CONTRATOS]: 'contracts',
  [ROUTE_PATHS.FINANCEIRO]: 'finance',
  [ROUTE_PATHS.REEMBOLSOS]: 'reimbursements',
  [ROUTE_PATHS.AGENDA]: 'agenda',
  [ROUTE_PATHS.DOCUMENTOS]: 'documents',
  [ROUTE_PATHS.USUARIOS]: 'users',
  [ROUTE_PATHS.AUDITORIA]: 'audit',
  [ROUTE_PATHS.APROVADORES]: 'approvers',
  [ROUTE_PATHS.PERFIL]: 'profile',
};
