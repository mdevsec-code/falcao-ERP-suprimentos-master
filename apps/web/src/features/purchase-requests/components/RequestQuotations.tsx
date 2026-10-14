import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Scale } from 'lucide-react';
import type { PurchaseRequestDetailDto } from '@falcao-erp/shared-types';

import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { CreateQuotationDialog } from '@/features/quotations/components/CreateQuotationDialog';
import { QuotationStatusBadge } from '@/features/quotations/components/QuotationBadges';
import { useQuotations } from '@/features/quotations/hooks/useQuotations';
import { PERMISSIONS } from '@/constants/permissions';
import { routeTo } from '@/constants/routes';
import { formatDateOnly } from '@/utils/format';

const QUOTABLE = ['EM_COMPRAS', 'EM_COTACAO'];

/** Cotações desta solicitação e o atalho para abrir uma nova. */
export function RequestQuotations({ request }: { request: PurchaseRequestDetailDto }) {
  const { t } = useTranslation('purchaseRequests');
  const { can } = useAuth();
  const canRead = can(PERMISSIONS.QUOTATION_READ);
  const canOpen = can(PERMISSIONS.QUOTATION_WRITE) && QUOTABLE.includes(request.status);
  const [open, setOpen] = useState(false);
  const list = useQuotations({ purchaseRequestId: request.id, pageSize: 20 }, { enabled: canRead });

  if (!canRead) return null;
  const rows = list.data?.data ?? [];
  if (!canOpen && rows.length === 0 && !list.isLoading) return null;

  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2 space-y-0">
        <CardTitle className="text-base">{t('purchaseRequests:quotations.title')}</CardTitle>
        {canOpen && (
          <Button
            size="sm"
            variant="primary"
            leftIcon={<Scale className="h-4 w-4" />}
            onClick={() => setOpen(true)}
          >
            {t('purchaseRequests:quotations.open')}
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {list.isLoading && <Skeleton className="h-10 w-full" />}
        {!list.isLoading && rows.length === 0 && (
          <p className="text-sm text-ink-soft">{t('purchaseRequests:quotations.none')}</p>
        )}
        <ul className="divide-y divide-border">
          {rows.map((q) => (
            <li key={q.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
              <Link
                to={routeTo.quotation(q.id)}
                className="font-medium text-ink hover:text-brand-gold-700 hover:underline"
              >
                #{q.numero} · {q.titulo}
              </Link>
              <span className="flex items-center gap-3 text-xs text-ink-soft">
                {t('purchaseRequests:quotations.summary', {
                  answered: q.respondidos,
                  invited: q.convidados,
                  deadline: formatDateOnly(q.prazoResposta),
                })}
                <QuotationStatusBadge status={q.status} />
              </span>
            </li>
          ))}
        </ul>
      </CardContent>
      {canOpen && (
        <CreateQuotationDialog open={open} onOpenChange={setOpen} purchaseRequest={request} />
      )}
    </Card>
  );
}
