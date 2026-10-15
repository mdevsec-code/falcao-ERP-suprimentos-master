import type { SupplierCatalogItemStatus, SupplierCatalogStatus } from '@falcao-erp/shared-types';

import type { BadgeVariant } from '@/components/ui/Badge';

export const CATALOG_STATUS_VARIANT: Record<SupplierCatalogStatus, BadgeVariant> = {
  PENDENTE: 'warning',
  REVISADO: 'success',
  REJEITADO: 'neutral',
};

export const CATALOG_ITEM_STATUS_VARIANT: Record<SupplierCatalogItemStatus, BadgeVariant> = {
  PENDENTE: 'warning',
  IMPORTADO: 'success',
  IGNORADO: 'neutral',
};
