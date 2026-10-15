import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ChevronRight } from 'lucide-react';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/Table';
import { APPROVAL_STEP_LABELS } from '@/constants/enums';
import { routeTo } from '@/constants/routes';
import { formatCurrencyBRL, formatDate, relativeTime } from '@/utils/format';
import { cn } from '@/utils/cn';
import { PurchaseRequestStatusBadge } from './PurchaseRequestBadges';
import type { PurchaseRequestSummaryDto } from '../types';

interface PurchaseRequestsTableProps {
  rows: readonly PurchaseRequestSummaryDto[];
  isFetching?: boolean;
}

export function PurchaseRequestsTable({ rows, isFetching }: PurchaseRequestsTableProps) {
  const { t } = useTranslation('purchaseRequests');
  const navigate = useNavigate();

  return (
    <Table className={cn('transition-opacity duration-base', isFetching && 'opacity-60')}>
      <TableHeader>
        <TableRow>
          <TableHead className="w-16">{t('purchaseRequests:table.number')}</TableHead>
          <TableHead>{t('purchaseRequests:table.title')}</TableHead>
          <TableHead>{t('purchaseRequests:table.requester')}</TableHead>
          <TableHead>{t('purchaseRequests:table.createdAt')}</TableHead>
          <TableHead className="text-right">{t('purchaseRequests:table.items')}</TableHead>
          <TableHead className="text-right">{t('purchaseRequests:table.estimatedTotal')}</TableHead>
          <TableHead>{t('purchaseRequests:table.status')}</TableHead>
          <TableHead className="w-10" aria-hidden="true" />
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((request) => (
          // Clique na linha é atalho de mouse; teclado usa o link do título.
          // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions
          <TableRow
            key={request.id}
            className="group cursor-pointer"
            onClick={() => navigate(routeTo.purchaseRequest(request.id))}
          >
            <TableCell className="font-mono text-ink-soft">#{request.numero}</TableCell>
            <TableCell>
              <Link
                to={routeTo.purchaseRequest(request.id)}
                onClick={(e) => e.stopPropagation()}
                className="font-medium text-ink hover:underline group-hover:text-brand-gold-700"
              >
                {request.title}
              </Link>
              {request.costCenter && (
                <p className="text-xs text-ink-soft">
                  {t('purchaseRequests:costCenterShort', { value: request.costCenter })}
                </p>
              )}
            </TableCell>
            <TableCell className="text-ink-soft">{request.requesterName}</TableCell>
            <TableCell
              className="whitespace-nowrap text-ink-soft"
              title={formatDate(request.createdAt) ?? ''}
            >
              {relativeTime(request.createdAt)}
            </TableCell>
            <TableCell className="text-right tabular-nums text-ink-soft">
              {request.itemCount}
            </TableCell>
            <TableCell className="whitespace-nowrap text-right font-semibold tabular-nums">
              {formatCurrencyBRL(request.estimatedTotal)}
            </TableCell>
            <TableCell>
              <PurchaseRequestStatusBadge status={request.status} />
              {request.currentStep && (
                <p className="mt-1 text-2xs text-ink-soft">
                  {t('purchaseRequests:table.signatureStep', {
                    step: APPROVAL_STEP_LABELS[request.currentStep],
                  })}
                </p>
              )}
            </TableCell>
            <TableCell aria-hidden="true">
              <ChevronRight className="h-4 w-4 text-ink-soft transition-transform duration-fast group-hover:translate-x-0.5 group-hover:text-brand-gold-700" />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
