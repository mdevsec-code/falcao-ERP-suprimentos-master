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
import { routeTo } from '@/constants/routes';
import { formatCurrencyBRL, formatDateOnly } from '@/utils/format';
import { cn } from '@/utils/cn';
import { ContractStatusBadge, DeadlineBadge } from './ContractBadges';
import type { ContractSummaryDto } from '../types';

interface ContractsTableProps {
  rows: readonly ContractSummaryDto[];
  isFetching?: boolean;
}

export function ContractsTable({ rows, isFetching }: ContractsTableProps) {
  const { t } = useTranslation('contracts');
  const navigate = useNavigate();

  return (
    <Table className={cn('transition-opacity duration-base', isFetching && 'opacity-60')}>
      <TableHeader>
        <TableRow>
          <TableHead>{t('contracts:table.contract')}</TableHead>
          <TableHead>{t('contracts:table.supplier')}</TableHead>
          <TableHead>{t('contracts:table.period')}</TableHead>
          <TableHead className="text-right">{t('contracts:table.value')}</TableHead>
          <TableHead>{t('contracts:table.status')}</TableHead>
          <TableHead className="w-10" aria-hidden="true" />
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((contract) => (
          // Clique na linha é atalho de mouse; teclado usa o link do número.
          // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions
          <TableRow
            key={contract.id}
            className="group cursor-pointer"
            onClick={() => navigate(routeTo.contract(contract.id))}
          >
            <TableCell>
              <Link
                to={routeTo.contract(contract.id)}
                onClick={(e) => e.stopPropagation()}
                className="font-mono text-xs font-semibold text-brand-gold-700 hover:underline"
              >
                {contract.numero}
              </Link>
              <p className="font-medium text-ink group-hover:text-brand-gold-700">
                {contract.objeto}
              </p>
              {contract.costCenter && (
                <p className="text-xs text-ink-soft">{contract.costCenter}</p>
              )}
            </TableCell>
            <TableCell className="text-ink-soft">{contract.supplierName}</TableCell>
            <TableCell className="whitespace-nowrap text-ink-soft">
              <span className="tabular-nums">
                {formatDateOnly(contract.dataInicio)} → {formatDateOnly(contract.dataFim)}
              </span>
              {contract.amendmentCount > 0 && (
                <p className="text-xs">
                  {t('contracts:table.amendments', { count: contract.amendmentCount })}
                </p>
              )}
            </TableCell>
            <TableCell className="whitespace-nowrap text-right font-semibold tabular-nums">
              {formatCurrencyBRL(contract.valorTotal)}
            </TableCell>
            <TableCell>
              <div className="flex flex-wrap items-center gap-1.5">
                <ContractStatusBadge status={contract.status} />
                <DeadlineBadge prazo={contract.prazo} diasRestantes={contract.diasRestantes} />
              </div>
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
