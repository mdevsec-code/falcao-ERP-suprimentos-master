import type {
  ApprovalAction,
  AuditAction,
  ContactType,
  ProductCategory,
  PurchaseRequestStatus,
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
