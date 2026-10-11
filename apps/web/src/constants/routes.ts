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
  CONTRATOS: '/contratos',
  FINANCEIRO: '/financeiro',
  REEMBOLSOS: '/reembolsos',
  AGENDA: '/agenda',
  DOCUMENTOS: '/documentos',
  USUARIOS: '/usuarios',
  AUDITORIA: '/auditoria',
  PERFIL: '/perfil',
  PLACEHOLDER: '/em-construcao',
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
  [ROUTE_PATHS.CONTRATOS]: 'contracts',
  [ROUTE_PATHS.FINANCEIRO]: 'finance',
  [ROUTE_PATHS.REEMBOLSOS]: 'reimbursements',
  [ROUTE_PATHS.AGENDA]: 'agenda',
  [ROUTE_PATHS.DOCUMENTOS]: 'documents',
  [ROUTE_PATHS.USUARIOS]: 'users',
  [ROUTE_PATHS.AUDITORIA]: 'audit',
  [ROUTE_PATHS.PERFIL]: 'profile',
};
