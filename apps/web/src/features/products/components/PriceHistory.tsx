import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { TrendingDown, TrendingUp } from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/Table';
import { TrendAreaChart } from '@/components/charts/TrendAreaChart';
import { formatCurrencyBRL, formatDate, formatDateTime } from '@/utils/format';
import { getIntlLocale } from '@/utils/locale';
import { cn } from '@/utils/cn';
import type { ProductPriceEntryDto } from '../types';

function formatPercentChange(pct: number): string {
  return new Intl.NumberFormat(getIntlLocale(), {
    style: 'percent',
    maximumFractionDigits: 1,
    minimumFractionDigits: 1,
    signDisplay: 'exceptZero',
  }).format(pct / 100);
}

function compactBRL(value: number): string {
  return new Intl.NumberFormat(getIntlLocale(), {
    style: 'currency',
    currency: 'BRL',
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value);
}

/** Gráfico de evolução + tabela (a tabela é a visão acessível do mesmo dado). */
export function PriceHistory({ entries }: { entries: readonly ProductPriceEntryDto[] }) {
  const { t } = useTranslation('products');

  const chronological = useMemo(
    () =>
      [...entries].sort(
        (a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime(),
      ),
    [entries],
  );

  const chartData = chronological.map((entry) => ({
    label: formatDate(entry.recordedAt) ?? '',
    value: Number(entry.price),
  }));

  return (
    <div className="space-y-4">
      {chartData.length >= 2 && (
        <Card className="animate-slide-up">
          <CardHeader>
            <CardTitle className="text-base">{t('products:prices.chartTitle')}</CardTitle>
            <CardDescription>{t('products:prices.chartDescription')}</CardDescription>
          </CardHeader>
          <CardContent>
            <TrendAreaChart
              data={chartData}
              formatValue={(v) => formatCurrencyBRL(v)}
              formatTick={compactBRL}
            />
          </CardContent>
        </Card>
      )}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t('products:prices.table.date')}</TableHead>
            <TableHead>{t('products:prices.table.supplier')}</TableHead>
            <TableHead className="text-right">{t('products:prices.table.price')}</TableHead>
            <TableHead className="text-right">{t('products:prices.table.variation')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {[...chronological].reverse().map((entry, idx, list) => {
            const previous = list[idx + 1];
            const current = Number(entry.price);
            const delta = previous ? current - Number(previous.price) : null;
            const pct =
              delta !== null && previous && Number(previous.price) > 0
                ? (delta / Number(previous.price)) * 100
                : null;
            return (
              <TableRow key={entry.id}>
                <TableCell className="whitespace-nowrap text-ink-soft">
                  {formatDateTime(entry.recordedAt)}
                </TableCell>
                <TableCell>{entry.supplierName ?? t('products:prices.noSupplier')}</TableCell>
                <TableCell className="whitespace-nowrap text-right font-semibold tabular-nums">
                  {formatCurrencyBRL(entry.price)}
                </TableCell>
                <TableCell className="text-right">
                  {pct === null || pct === 0 ? (
                    <span className="text-xs text-ink-soft">—</span>
                  ) : (
                    <span
                      className={cn(
                        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-2xs font-semibold tabular-nums',
                        pct > 0 ? 'bg-danger/10 text-danger' : 'bg-success/10 text-success',
                      )}
                    >
                      {pct > 0 ? (
                        <TrendingUp className="h-3 w-3" aria-hidden="true" />
                      ) : (
                        <TrendingDown className="h-3 w-3" aria-hidden="true" />
                      )}
                      {formatPercentChange(pct)}
                    </span>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
