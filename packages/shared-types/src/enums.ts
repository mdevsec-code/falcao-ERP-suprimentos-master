export const Role = {
  ADMIN: "ADMIN",
  MANAGER: "MANAGER",
  BUYER: "BUYER",
  FINANCE: "FINANCE",
  WAREHOUSE: "WAREHOUSE",
  REQUESTER: "REQUESTER",
  AUDITOR: "AUDITOR",
} as const;
export type Role = (typeof Role)[keyof typeof Role];

export const ROLE_LABELS: Record<Role, string> = {
  ADMIN: "Administrador",
  MANAGER: "Gestor",
  BUYER: "Comprador",
  FINANCE: "Financeiro",
  WAREHOUSE: "Almoxarifado",
  REQUESTER: "Solicitante",
  AUDITOR: "Auditor",
};

export const SupplierCategory = {
  MATERIAIS_CONSTRUCAO: "MATERIAIS_CONSTRUCAO",
  EQUIPAMENTOS: "EQUIPAMENTOS",
  SERVICOS_ENGENHARIA: "SERVICOS_ENGENHARIA",
  MAO_DE_OBRA: "MAO_DE_OBRA",
  TRANSPORTE_LOGISTICA: "TRANSPORTE_LOGISTICA",
  TECNOLOGIA: "TECNOLOGIA",
  CONSULTORIA: "CONSULTORIA",
  MANUTENCAO: "MANUTENCAO",
  OUTROS: "OUTROS",
} as const;
export type SupplierCategory = (typeof SupplierCategory)[keyof typeof SupplierCategory];

export const SUPPLIER_CATEGORY_LABELS: Record<SupplierCategory, string> = {
  MATERIAIS_CONSTRUCAO: "Materiais de Construção",
  EQUIPAMENTOS: "Equipamentos",
  SERVICOS_ENGENHARIA: "Serviços de Engenharia",
  MAO_DE_OBRA: "Mão de Obra",
  TRANSPORTE_LOGISTICA: "Transporte e Logística",
  TECNOLOGIA: "Tecnologia",
  CONSULTORIA: "Consultoria",
  MANUTENCAO: "Manutenção",
  OUTROS: "Outros",
};

export const ContactType = {
  PHONE: "PHONE",
  EMAIL: "EMAIL",
} as const;
export type ContactType = (typeof ContactType)[keyof typeof ContactType];

export const SupplierDocumentCategory = {
  CERTIFICADO: "CERTIFICADO",
  CONTRATO: "CONTRATO",
  COTACAO: "COTACAO",
  COMPROVANTE: "COMPROVANTE",
  OUTRO: "OUTRO",
} as const;
export type SupplierDocumentCategory =
  (typeof SupplierDocumentCategory)[keyof typeof SupplierDocumentCategory];

export const AuditAction = {
  CREATE: "CREATE",
  UPDATE: "UPDATE",
  DELETE: "DELETE",
} as const;
export type AuditAction = (typeof AuditAction)[keyof typeof AuditAction];

export const ProductCategory = {
  MATERIAIS_CONSTRUCAO: "MATERIAIS_CONSTRUCAO",
  EQUIPAMENTOS: "EQUIPAMENTOS",
  FERRAMENTAS: "FERRAMENTAS",
  EPI: "EPI",
  ELETRICA: "ELETRICA",
  HIDRAULICA: "HIDRAULICA",
  ACABAMENTO: "ACABAMENTO",
  OUTROS: "OUTROS",
} as const;
export type ProductCategory = (typeof ProductCategory)[keyof typeof ProductCategory];

export const PRODUCT_CATEGORY_LABELS: Record<ProductCategory, string> = {
  MATERIAIS_CONSTRUCAO: "Materiais de Construção",
  EQUIPAMENTOS: "Equipamentos",
  FERRAMENTAS: "Ferramentas",
  EPI: "EPI",
  ELETRICA: "Elétrica",
  HIDRAULICA: "Hidráulica",
  ACABAMENTO: "Acabamento",
  OUTROS: "Outros",
};

export const UnitOfMeasure = {
  UN: "UN",
  KG: "KG",
  M: "M",
  M2: "M2",
  M3: "M3",
  L: "L",
  CX: "CX",
  PC: "PC",
  SC: "SC",
  TON: "TON",
} as const;
export type UnitOfMeasure = (typeof UnitOfMeasure)[keyof typeof UnitOfMeasure];

export const UNIT_OF_MEASURE_LABELS: Record<UnitOfMeasure, string> = {
  UN: "Unidade",
  KG: "Quilograma",
  M: "Metro",
  M2: "Metro²",
  M3: "Metro³",
  L: "Litro",
  CX: "Caixa",
  PC: "Peça",
  SC: "Saco",
  TON: "Tonelada",
};

export const PurchaseRequestStatus = {
  AGUARDANDO_APROVACAO: "AGUARDANDO_APROVACAO",
  EM_COMPRAS: "EM_COMPRAS",
  EM_COTACAO: "EM_COTACAO",
  PEDIDO_REALIZADO: "PEDIDO_REALIZADO",
  AGUARDANDO_RECEBIMENTO: "AGUARDANDO_RECEBIMENTO",
  FINALIZADO: "FINALIZADO",
  REJEITADO: "REJEITADO",
} as const;
export type PurchaseRequestStatus = (typeof PurchaseRequestStatus)[keyof typeof PurchaseRequestStatus];

export const PURCHASE_REQUEST_STATUS_LABELS: Record<PurchaseRequestStatus, string> = {
  AGUARDANDO_APROVACAO: "Aguardando Aprovação",
  EM_COMPRAS: "Em Compras",
  EM_COTACAO: "Em Cotação",
  PEDIDO_REALIZADO: "Pedido Realizado",
  AGUARDANDO_RECEBIMENTO: "Aguardando Recebimento",
  FINALIZADO: "Finalizado",
  REJEITADO: "Rejeitado",
};

export const PURCHASE_REQUEST_PIPELINE: PurchaseRequestStatus[] = [
  "AGUARDANDO_APROVACAO",
  "EM_COMPRAS",
  "EM_COTACAO",
  "PEDIDO_REALIZADO",
  "AGUARDANDO_RECEBIMENTO",
  "FINALIZADO",
];

export const ApprovalAction = {
  APPROVE: "APPROVE",
  REJECT: "REJECT",
  REQUEST_CHANGES: "REQUEST_CHANGES",
} as const;
export type ApprovalAction = (typeof ApprovalAction)[keyof typeof ApprovalAction];

export const APPROVAL_ACTION_LABELS: Record<ApprovalAction, string> = {
  APPROVE: "Aprovado",
  REJECT: "Reprovado",
  REQUEST_CHANGES: "Ajustes Solicitados",
};

export const BRAZILIAN_STATES = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO",
  "MA", "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI",
  "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO",
] as const;
export type BrazilianState = (typeof BRAZILIAN_STATES)[number];
