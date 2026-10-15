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
import { UNIT_LABELS } from '@/constants/enums';
import { formatCurrencyBRL, formatDate } from '@/utils/format';
import { cn } from '@/utils/cn';
import { uploadUrl } from '@/utils/image';
import { ProductCategoryBadge, ProductStatusBadge } from './ProductBadges';
import type { ProductSummaryDto } from '../types';

interface ProductsTableProps {
  rows: readonly ProductSummaryDto[];
  isFetching?: boolean;
}

export function ProductsTable({ rows, isFetching }: ProductsTableProps) {
  const { t } = useTranslation('products');
  const navigate = useNavigate();

  return (
    <Table className={cn('transition-opacity duration-base', isFetching && 'opacity-60')}>
      <TableHeader>
        <TableRow>
          <TableHead>{t('products:table.product')}</TableHead>
          <TableHead>{t('products:table.discipline')}</TableHead>
          <TableHead>{t('products:table.category')}</TableHead>
          <TableHead>{t('products:table.unit')}</TableHead>
          <TableHead>{t('products:table.primarySupplier')}</TableHead>
          <TableHead className="text-right">{t('products:table.lastPrice')}</TableHead>
          <TableHead>{t('products:table.status')}</TableHead>
          <TableHead className="w-10" aria-hidden="true" />
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((product) => (
          // Clique na linha é atalho de mouse; teclado usa o link do nome.
          // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions
          <TableRow
            key={product.id}
            className="group cursor-pointer"
            onClick={() => navigate(routeTo.product(product.id))}
          >
            <TableCell>
              <div className="flex items-start gap-3">
                {product.photoUrl ? (
                  <img
                    src={uploadUrl(product.photoUrl) ?? undefined}
                    alt=""
                    className="h-10 w-10 shrink-0 rounded border border-border object-cover"
                  />
                ) : (
                  <span
                    className="h-10 w-10 shrink-0 rounded border border-dashed border-border"
                    aria-hidden="true"
                  />
                )}
                <div className="min-w-0">
                  <Link
                    to={routeTo.product(product.id)}
                    onClick={(e) => e.stopPropagation()}
                    className="font-medium text-ink hover:underline group-hover:text-brand-gold-700"
                  >
                    {product.nome}
                  </Link>
                  <p className="text-xs text-ink-soft">
                    <span className="font-mono">{product.codigo}</span>
                    {product.marca ? ` · ${product.marca}` : ''}
                    {product.referencia ? (
                      <>
                        {' · '}
                        <span className="font-mono">
                          {t('products:table.ref', { value: product.referencia })}
                        </span>
                      </>
                    ) : null}
                  </p>
                </div>
              </div>
            </TableCell>
            <TableCell className="text-ink-soft">{product.discipline?.nome ?? '—'}</TableCell>
            <TableCell>
              <ProductCategoryBadge categoria={product.categoria} />
            </TableCell>
            <TableCell className="text-ink-soft">{UNIT_LABELS[product.unidade]}</TableCell>
            <TableCell className="text-ink-soft">
              {product.primarySupplier?.nomeFantasia ?? '—'}
            </TableCell>
            <TableCell className="whitespace-nowrap text-right tabular-nums">
              <span className="font-semibold">{formatCurrencyBRL(product.lastPrice)}</span>
              {product.lastPriceAt && (
                <p className="text-xs text-ink-soft">
                  {product.lastQuantity
                    ? t('products:table.lastPriceDetail', {
                        quantity: Number(product.lastQuantity).toLocaleString(),
                        unit: product.unidade,
                        date: formatDate(product.lastPriceAt),
                      })
                    : formatDate(product.lastPriceAt)}
                </p>
              )}
            </TableCell>
            <TableCell>
              <ProductStatusBadge isActive={product.isActive} />
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
