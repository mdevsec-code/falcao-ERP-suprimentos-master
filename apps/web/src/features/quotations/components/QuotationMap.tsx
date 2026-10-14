import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Crown, TrendingDown, TrendingUp, Trophy } from 'lucide-react';
import type { QuotationDetailDto, QuotationPriceDto } from '@falcao-erp/shared-types';

import { Button } from '@/components/ui/Button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/Tooltip';
import { routeTo } from '@/constants/routes';
import { formatCurrencyBRL, formatDate } from '@/utils/format';
import { cn } from '@/utils/cn';
import { SupplierResponseBadge } from './QuotationBadges';

interface QuotationMapProps {
  quotation: QuotationDetailDto;
  canChooseWinner: boolean;
  onChooseWinner: (itemId: string, quotationSupplierId: string | null) => void;
  pendingItemId: string | null;
}

function pct(value: number) {
  return `${value > 0 ? '+' : ''}${value.toLocaleString(undefined, { maximumFractionDigits: 1 })}%`;
}

/**
 * Mapa de cotação: itens nas linhas, fornecedores lado a lado. O menor preço de
 * cada item fica em destaque; a coroa marca o fornecedor escolhido.
 */
export function QuotationMap({
  quotation,
  canChooseWinner,
  onChooseWinner,
  pendingItemId,
}: QuotationMapProps) {
  const { t } = useTranslation('quotations');
  const { items, suppliers, prices, analysis } = quotation;

  const priceOf = (supplierId: string, itemId: string): QuotationPriceDto | undefined =>
    prices.find((p) => p.quotationSupplierId === supplierId && p.quotationItemId === itemId);

  return (
    <div className="scrollbar-thin overflow-x-auto rounded-lg border border-border bg-surface shadow-sm">
      <table className="w-full min-w-[56rem] border-collapse text-sm">
        <caption className="sr-only">
          {t('quotations:map.caption', { numero: quotation.numero })}
        </caption>
        <thead>
          <tr className="border-b border-border bg-bg/60 align-bottom">
            <th
              scope="col"
              className="sticky left-0 z-10 min-w-[16rem] bg-bg px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-ink-soft"
            >
              {t('quotations:map.item')}
            </th>
            <th
              scope="col"
              className="min-w-[9rem] px-3 py-3 text-right text-xs font-semibold uppercase tracking-wide text-ink-soft"
            >
              {t('quotations:map.reference')}
            </th>
            {suppliers.map((supplier) => {
              const summary = analysis.suppliers.find((s) => s.quotationSupplierId === supplier.id);
              return (
                <th
                  key={supplier.id}
                  scope="col"
                  className="min-w-[11rem] border-l border-border px-3 py-3 text-left font-normal"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-semibold text-ink">{supplier.supplierName}</span>
                    {summary?.ranking === 1 && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Trophy
                            className="h-4 w-4 shrink-0 text-brand-gold-700"
                            aria-label={t('quotations:map.bestTotal')}
                          />
                        </TooltipTrigger>
                        <TooltipContent>{t('quotations:map.bestTotal')}</TooltipContent>
                      </Tooltip>
                    )}
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-1.5">
                    <SupplierResponseBadge status={supplier.status} />
                    {supplier.prazoEntregaDias !== null && (
                      <span className="text-2xs text-ink-soft">
                        {t('quotations:map.deliveryDays', { count: supplier.prazoEntregaDias })}
                      </span>
                    )}
                  </div>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {items.map((item, index) => {
            const itemAnalysis = analysis.items.find((a) => a.itemId === item.id);
            const variation = itemAnalysis?.variacaoUltimoPct ?? null;
            return (
              <tr key={item.id} className="border-b border-border last:border-b-0">
                <th
                  scope="row"
                  className="sticky left-0 z-10 bg-surface px-4 py-3 text-left align-top font-normal"
                >
                  <p className="font-mono text-2xs text-ink-soft">#{index + 1}</p>
                  <p className="font-medium text-ink">{item.descricao}</p>
                  <p className="text-xs text-ink-soft">
                    <strong className="tabular-nums text-ink">
                      {Number(item.quantidade).toLocaleString()} {item.unidade}
                    </strong>
                    {item.marca ? ` · ${item.marca}` : ''}
                    {item.referencia ? ` · ${item.referencia}` : ''}
                  </p>
                  {item.productId && (
                    <Link
                      to={routeTo.product(item.productId)}
                      className="text-2xs text-brand-gold-700 hover:underline"
                    >
                      {t('quotations:map.inCatalog', { codigo: item.productCodigo })}
                    </Link>
                  )}
                </th>
                <td className="px-3 py-3 text-right align-top">
                  {item.ultimoPreco ? (
                    <>
                      <p className="tabular-nums text-ink">{formatCurrencyBRL(item.ultimoPreco)}</p>
                      <p className="text-2xs text-ink-soft">
                        {[item.ultimoFornecedor, formatDate(item.ultimoPrecoEm)]
                          .filter(Boolean)
                          .join(' · ')}
                      </p>
                    </>
                  ) : (
                    <span className="text-xs text-ink-soft">{t('quotations:map.noHistory')}</span>
                  )}
                  {variation !== null && (
                    <span
                      className={cn(
                        'mt-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-2xs font-semibold tabular-nums',
                        variation > 0
                          ? 'bg-danger/10 text-danger'
                          : variation < 0
                            ? 'bg-success/10 text-success'
                            : 'bg-hover text-ink-soft',
                      )}
                      title={t('quotations:map.variationHint')}
                    >
                      {variation > 0 ? (
                        <TrendingUp className="h-3 w-3" aria-hidden="true" />
                      ) : (
                        <TrendingDown className="h-3 w-3" aria-hidden="true" />
                      )}
                      {pct(variation)}
                    </span>
                  )}
                </td>
                {suppliers.map((supplier) => {
                  const price = priceOf(supplier.id, item.id);
                  const isBest = itemAnalysis?.melhorFornecedorIds.includes(supplier.id) ?? false;
                  const isWinner = item.vencedorId === supplier.id;
                  const usable = price?.disponivel && price.precoUnitario !== null;
                  const brandChanged =
                    usable &&
                    ((price.marca && price.marca !== item.marca) ||
                      (price.referencia && price.referencia !== item.referencia));
                  return (
                    <td
                      key={supplier.id}
                      className={cn(
                        'border-l border-border px-3 py-3 align-top transition-colors',
                        isBest && 'bg-success/5',
                        isWinner && 'bg-brand-gold-50 ring-1 ring-inset ring-brand-gold-300',
                      )}
                    >
                      {!price && (
                        <span className="text-xs text-ink-soft">
                          {t('quotations:map.noAnswer')}
                        </span>
                      )}
                      {price && !price.disponivel && (
                        <span className="text-xs text-ink-soft">
                          {t('quotations:map.unavailable')}
                        </span>
                      )}
                      {usable && (
                        <>
                          <p
                            className={cn(
                              'tabular-nums',
                              isBest ? 'font-semibold text-success' : 'text-ink',
                            )}
                          >
                            {formatCurrencyBRL(price.precoUnitario)}
                            {isBest && (
                              <span className="sr-only"> {t('quotations:map.bestPrice')}</span>
                            )}
                          </p>
                          <p className="text-2xs tabular-nums text-ink-soft">
                            {t('quotations:map.lineTotal', {
                              value: formatCurrencyBRL(
                                Number(price.precoUnitario) * Number(item.quantidade),
                              ),
                            })}
                          </p>
                          {(price.marca || price.referencia) && (
                            <p
                              className={cn(
                                'mt-0.5 text-2xs',
                                brandChanged ? 'text-brand-gold-700' : 'text-ink-soft',
                              )}
                            >
                              {[price.marca, price.referencia].filter(Boolean).join(' · ')}
                            </p>
                          )}
                        </>
                      )}
                      {price?.observacao && (
                        <p className="mt-0.5 text-2xs italic text-ink-soft">{price.observacao}</p>
                      )}
                      {usable && (canChooseWinner || isWinner) && (
                        <Button
                          size="sm"
                          variant={isWinner ? 'primary' : 'ghost'}
                          className="mt-2 h-7 px-2 text-xs"
                          disabled={!canChooseWinner || pendingItemId === item.id}
                          aria-pressed={isWinner}
                          leftIcon={<Crown className="h-3.5 w-3.5" />}
                          onClick={() => onChooseWinner(item.id, isWinner ? null : supplier.id)}
                        >
                          {isWinner ? t('quotations:map.chosen') : t('quotations:map.choose')}
                        </Button>
                      )}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr className="border-t-2 border-border bg-bg/60">
            <th
              scope="row"
              className="sticky left-0 z-10 bg-bg px-4 py-3 text-left text-sm font-semibold text-ink"
            >
              {t('quotations:map.supplierTotal')}
            </th>
            <td className="px-3 py-3 text-right text-xs text-ink-soft">
              {t('quotations:map.withFreight')}
            </td>
            {suppliers.map((supplier) => {
              const summary = analysis.suppliers.find((s) => s.quotationSupplierId === supplier.id);
              return (
                <td key={supplier.id} className="border-l border-border px-3 py-3 align-top">
                  {summary?.total ? (
                    <>
                      <p className="font-display text-lg font-semibold tabular-nums text-ink">
                        {formatCurrencyBRL(summary.total)}
                      </p>
                      <p className="text-2xs text-ink-soft">
                        {summary.cotouTudo
                          ? t('quotations:map.ranking', { position: summary.ranking })
                          : t('quotations:map.partial', {
                              count: summary.itensCotados,
                              total: items.length,
                            })}
                      </p>
                      {supplier.frete && Number(supplier.frete) > 0 && (
                        <p className="text-2xs text-ink-soft">
                          {t('quotations:map.freight', {
                            value: formatCurrencyBRL(supplier.frete),
                          })}
                        </p>
                      )}
                      {summary.itensMaisBaratos > 0 && (
                        <p className="text-2xs text-success">
                          {t('quotations:map.cheapestItems', { count: summary.itensMaisBaratos })}
                        </p>
                      )}
                    </>
                  ) : (
                    <span className="text-xs text-ink-soft">—</span>
                  )}
                </td>
              );
            })}
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
