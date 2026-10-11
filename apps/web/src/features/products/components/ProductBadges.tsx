import { useTranslation } from 'react-i18next';
import type { ProductCategory } from '@falcao-erp/shared-types';

import { Badge } from '@/components/ui/Badge';
import { PRODUCT_CATEGORY_LABELS } from '@/constants/enums';

export function ProductStatusBadge({ isActive }: { isActive: boolean }) {
  const { t } = useTranslation('common');
  return (
    <Badge variant={isActive ? 'success' : 'neutral'} size="sm">
      {isActive ? t('status.active') : t('status.inactive')}
    </Badge>
  );
}

export function ProductCategoryBadge({ categoria }: { categoria: ProductCategory }) {
  return (
    <Badge variant="outline" size="sm">
      {PRODUCT_CATEGORY_LABELS[categoria]}
    </Badge>
  );
}
