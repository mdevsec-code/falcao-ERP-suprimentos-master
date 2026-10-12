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
import { Badge } from '@/components/ui/Badge';
import { REIMBURSEMENT_STATUS_LABELS } from '@/constants/enums';
import { routeTo } from '@/constants/routes';
import { formatCurrencyBRL, formatDate, relativeTime } from '@/utils/format';
import { cn } from '@/utils/cn';
import { REIMBURSEMENT_STATUS_BADGE } from '../lib/status';
import type { ReimbursementSummaryDto } from '../types';

interface ReimbursementsTableProps {
  rows: readonly ReimbursementSummaryDto[];
  isFetching?: boolean;
  /** Quem vê só os próprios não precisa da coluna "colaborador". */
  showRequester: boolean;
}

export function ReimbursementsTable({ rows, isFetching, showRequester }: ReimbursementsTableProps) {
  const { t } = useTranslation('reimbursements');
  const navigate = useNavigate();

  return (
    <Table className={cn('transition-opacity duration-base', isFetching && 'opacity-60')}>
      <TableHeader>
        <TableRow>
          <TableHead>{t('reimbursements:table.title')}</TableHead>
          {showRequester && <TableHead>{t('reimbursements:table.requester')}</TableHead>}
          <TableHead>{t('reimbursements:table.createdAt')}</TableHead>
          <TableHead className="text-right">{t('reimbursements:table.total')}</TableHead>
          <TableHead>{t('reimbursements:table.status')}</TableHead>
          <TableHead className="w-10" aria-hidden="true" />
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => (
          // Clique na linha é atalho de mouse; teclado usa o link do título.
          // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions
          <TableRow
            key={row.id}
            className="group cursor-pointer"
            onClick={() => navigate(routeTo.reimbursement(row.id))}
          >
            <TableCell>
              <Link
                to={routeTo.reimbursement(row.id)}
                onClick={(e) => e.stopPropagation()}
                className="font-medium text-ink hover:underline group-hover:text-brand-gold-700"
              >
                {row.titulo}
              </Link>
              <p className="text-xs text-ink-soft">
                {t('reimbursements:table.expenses', { count: row.itemCount })}
                {row.costCenter ? ` · ${row.costCenter}` : ''}
              </p>
            </TableCell>
            {showRequester && <TableCell className="text-ink-soft">{row.requesterName}</TableCell>}
            <TableCell
              className="whitespace-nowrap text-ink-soft"
              title={formatDate(row.createdAt) ?? ''}
            >
              {relativeTime(row.createdAt)}
            </TableCell>
            <TableCell className="whitespace-nowrap text-right font-semibold tabular-nums">
              {formatCurrencyBRL(row.total)}
            </TableCell>
            <TableCell>
              <Badge variant={REIMBURSEMENT_STATUS_BADGE[row.status]} size="sm">
                {REIMBURSEMENT_STATUS_LABELS[row.status]}
              </Badge>
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
