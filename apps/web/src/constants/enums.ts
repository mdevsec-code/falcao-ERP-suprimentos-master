import type {
  AgendaEventType,
  ApprovalStep,
  AgendaItemKind,
  ApprovalAction,
  AuditAction,
  ContactType,
  ContractStatus,
  DeadlineState,
  DocumentCategory,
  ExpenseCategory,
  PayableSource,
  PayableStatus,
  PaymentMethod,
  ProductCategory,
  PriceEntrySource,
  PurchaseRequestStatus,
  QuotationStatus,
  QuotationSupplierStatus,
  ReimbursementStatus,
  RequisitionPlanStatus,
  SupplierCatalogItemStatus,
  SupplierCatalogStatus,
  SupplierCategory,
  SupplierDocumentCategory,
  UnitOfMeasure,
} from '@falcao-erp/shared-types';
import { createTranslatedLabels } from '@/utils/i18nLabels';

/**
 * Rótulos traduzidos (`enums:<grupo>.<valor>`) dos enums de domínio de
 * `@falcao-erp/shared-types`. Os valores dos enums continuam vindo do pacote
 * compartilhado (fonte única com a API); aqui só resolvemos o texto exibido
 * no idioma ativo — os `*_LABELS` em português do pacote ficam para a API.
 */
export const SUPPLIER_CATEGORY_LABELS =
  createTranslatedLabels<SupplierCategory>('supplierCategory');

export const PRODUCT_CATEGORY_LABELS = createTranslatedLabels<ProductCategory>('productCategory');

export const UNIT_LABELS = createTranslatedLabels<UnitOfMeasure>('unit');

export const PURCHASE_REQUEST_STATUS_LABELS =
  createTranslatedLabels<PurchaseRequestStatus>('purchaseRequestStatus');

export const APPROVAL_ACTION_LABELS = createTranslatedLabels<ApprovalAction>('approvalAction');

export const DOCUMENT_CATEGORY_LABELS =
  createTranslatedLabels<SupplierDocumentCategory>('documentCategory');

export const CONTACT_TYPE_LABELS = createTranslatedLabels<ContactType>('contactType');

export const AUDIT_ACTION_LABELS = createTranslatedLabels<AuditAction>('auditAction');

export const CONTRACT_STATUS_LABELS = createTranslatedLabels<ContractStatus>('contractStatus');

export const DEADLINE_STATE_LABELS = createTranslatedLabels<DeadlineState>('deadlineState');

export const PAYABLE_STATUS_LABELS = createTranslatedLabels<PayableStatus>('payableStatus');

export const PAYABLE_SOURCE_LABELS = createTranslatedLabels<PayableSource>('payableSource');

export const PAYMENT_METHOD_LABELS = createTranslatedLabels<PaymentMethod>('paymentMethod');

export const REIMBURSEMENT_STATUS_LABELS =
  createTranslatedLabels<ReimbursementStatus>('reimbursementStatus');

export const EXPENSE_CATEGORY_LABELS = createTranslatedLabels<ExpenseCategory>('expenseCategory');

/** Categorias do repositório central (as de documento de fornecedor ficam em `documentCategory`). */
export const CENTRAL_DOCUMENT_CATEGORY_LABELS =
  createTranslatedLabels<DocumentCategory>('centralDocumentCategory');

export const AGENDA_EVENT_TYPE_LABELS = createTranslatedLabels<AgendaEventType>('agendaEventType');

export const AGENDA_ITEM_KIND_LABELS = createTranslatedLabels<AgendaItemKind>('agendaItemKind');

export const QUOTATION_STATUS_LABELS = createTranslatedLabels<QuotationStatus>('quotationStatus');

export const QUOTATION_SUPPLIER_STATUS_LABELS =
  createTranslatedLabels<QuotationSupplierStatus>('quotationSupplierStatus');

export const PRICE_ENTRY_SOURCE_LABELS =
  createTranslatedLabels<PriceEntrySource>('priceEntrySource');

export const REQUISITION_PLAN_STATUS_LABELS =
  createTranslatedLabels<RequisitionPlanStatus>('requisitionPlanStatus');

export const SUPPLIER_CATALOG_STATUS_LABELS =
  createTranslatedLabels<SupplierCatalogStatus>('supplierCatalogStatus');

export const SUPPLIER_CATALOG_ITEM_STATUS_LABELS =
  createTranslatedLabels<SupplierCatalogItemStatus>('supplierCatalogItemStatus');

export const APPROVAL_STEP_LABELS = createTranslatedLabels<ApprovalStep>('approvalStep');
