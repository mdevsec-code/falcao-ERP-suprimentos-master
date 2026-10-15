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
import { formatCNPJ } from '@/utils/format';
import { cn } from '@/utils/cn';
import { SupplierCategoryBadge, SupplierScore, SupplierStatusBadge } from './SupplierBadges';
import type { SupplierSummaryDto } from '../types';

interface SuppliersTableProps {
  rows: readonly SupplierSummaryDto[];
  /** Esmaece a tabela enquanto a próxima página/filtro carrega. */
  isFetching?: boolean;
}

export function SuppliersTable({ rows, isFetching }: SuppliersTableProps) {
  const { t } = useTranslation('suppliers');
  const navigate = useNavigate();

  return (
    <Table className={cn('transition-opacity duration-base', isFetching && 'opacity-60')}>
      <TableHeader>
        <TableRow>
          <TableHead>{t('suppliers:table.supplier')}</TableHead>
          <TableHead>{t('suppliers:table.cnpj')}</TableHead>
          <TableHead>{t('suppliers:table.category')}</TableHead>
          <TableHead>{t('suppliers:table.location')}</TableHead>
          <TableHead>{t('suppliers:table.score')}</TableHead>
          <TableHead>{t('suppliers:table.status')}</TableHead>
          <TableHead className="w-10" aria-hidden="true" />
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((supplier) => (
          // Clique na linha é atalho de mouse; teclado e leitores de tela
          // usam o link do nome (primeira coluna).
          // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions
          <TableRow
            key={supplier.id}
            className="group cursor-pointer"
            onClick={() => navigate(routeTo.supplier(supplier.id))}
          >
            <TableCell>
              <Link
                to={routeTo.supplier(supplier.id)}
                onClick={(e) => e.stopPropagation()}
                className="font-medium text-ink hover:underline group-hover:text-brand-gold-700"
              >
                {supplier.nomeFantasia}
              </Link>
              <p className="text-xs text-ink-soft">{supplier.razaoSocial}</p>
            </TableCell>
            <TableCell className="whitespace-nowrap font-mono text-xs text-ink-soft">
              {formatCNPJ(supplier.cnpj)}
            </TableCell>
            <TableCell>
              <SupplierCategoryBadge categoria={supplier.categoria} />
            </TableCell>
            <TableCell className="whitespace-nowrap text-ink-soft">
              {supplier.cidade}/{supplier.estado}
            </TableCell>
            <TableCell>
              <SupplierScore score={supplier.averageScore} />
            </TableCell>
            <TableCell>
              <SupplierStatusBadge
                isActive={supplier.isActive}
                pending={supplier.cadastroPendente}
              />
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
