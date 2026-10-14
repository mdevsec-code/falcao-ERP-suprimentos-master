import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Ban, CircleCheck, FileCheck2, FileCode2, FileText, Pencil } from 'lucide-react';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { RowAction } from '@/components/common/RowAction';
import {
  PAYABLE_SOURCE_LABELS,
  PAYABLE_STATUS_LABELS,
  PAYMENT_METHOD_LABELS,
} from '@/constants/enums';
import { routeTo } from '@/constants/routes';
import { formatCurrencyBRL, formatDateOnly } from '@/utils/format';
import { cn } from '@/utils/cn';
import { PAYABLE_SOURCE_BADGE, PAYABLE_STATUS_BADGE } from '../lib/status';
import type { PayableDto } from '../types';

interface PayablesTableProps {
  rows: readonly PayableDto[];
  isFetching?: boolean;
  /** Sem permissão de escrita, as ações somem. */
  canWrite: boolean;
  onPay: (payable: PayableDto) => void;
  onInvoice: (payable: PayableDto) => void;
  onEdit: (payable: PayableDto) => void;
  onCancel: (payable: PayableDto) => void;
}

export function PayablesTable({
  rows,
  isFetching,
  canWrite,
  onPay,
  onInvoice,
  onEdit,
  onCancel,
}: PayablesTableProps) {
  const { t } = useTranslation('finance');

  return (
    <Table className={cn('transition-opacity duration-base', isFetching && 'opacity-60')}>
      <TableHeader>
        <TableRow>
          <TableHead>{t('finance:table.due')}</TableHead>
          <TableHead>{t('finance:table.description')}</TableHead>
          <TableHead>{t('finance:table.supplier')}</TableHead>
          <TableHead>{t('finance:table.invoice')}</TableHead>
          <TableHead className="text-right">{t('finance:table.amount')}</TableHead>
          <TableHead>{t('finance:table.status')}</TableHead>
          {canWrite && <TableHead className="text-right">{t('finance:table.actions')}</TableHead>}
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((payable) => {
          const isOpen = payable.status === 'ABERTO';
          return (
            <TableRow
              key={payable.id}
              className={cn(payable.status === 'CANCELADO' && 'opacity-60')}
            >
              <TableCell className="whitespace-nowrap tabular-nums">
                <span className={cn(payable.vencida ? 'font-semibold text-danger' : 'text-ink')}>
                  {formatDateOnly(payable.vencimento)}
                </span>
                {payable.pagoEm && (
                  <p className="text-xs text-ink-soft">
                    {t('finance:table.paidOn', { date: formatDateOnly(payable.pagoEm) })}
                  </p>
                )}
              </TableCell>
              <TableCell>
                <p className="font-medium text-ink">{payable.descricao}</p>
                <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-ink-soft">
                  <Badge variant={PAYABLE_SOURCE_BADGE[payable.origem]} size="sm">
                    {PAYABLE_SOURCE_LABELS[payable.origem]}
                  </Badge>
                  <SourceLink payable={payable} />
                  {payable.costCenter && <span>· {payable.costCenter}</span>}
                </div>
              </TableCell>
              <TableCell className="text-ink-soft">{payable.supplierName ?? '—'}</TableCell>
              <TableCell className="whitespace-nowrap">
                {payable.notaFiscal ? (
                  <span className="inline-flex items-center gap-1.5">
                    <span className="font-mono text-xs text-ink">{payable.notaFiscal}</span>
                    {payable.notaFiscalPdfUrl && (
                      <FileText
                        className="h-3.5 w-3.5 text-ink-soft"
                        aria-label={t('finance:table.hasPdf')}
                      />
                    )}
                    {payable.notaFiscalXmlUrl && (
                      <FileCode2
                        className="h-3.5 w-3.5 text-ink-soft"
                        aria-label={t('finance:table.hasXml')}
                      />
                    )}
                  </span>
                ) : payable.status !== 'CANCELADO' ? (
                  <Badge variant="warning" size="sm">
                    {t('finance:table.noInvoice')}
                  </Badge>
                ) : (
                  '—'
                )}
              </TableCell>
              <TableCell className="whitespace-nowrap text-right tabular-nums">
                <span className="font-semibold">{formatCurrencyBRL(payable.valor)}</span>
                {payable.valorPago && payable.valorPago !== payable.valor && (
                  <p className="text-xs text-ink-soft">
                    {t('finance:table.paidAmount', {
                      value: formatCurrencyBRL(payable.valorPago),
                    })}
                  </p>
                )}
              </TableCell>
              <TableCell>
                <div className="flex flex-wrap items-center gap-1.5">
                  <Badge variant={PAYABLE_STATUS_BADGE[payable.status]} size="sm">
                    {PAYABLE_STATUS_LABELS[payable.status]}
                  </Badge>
                  {payable.vencida && (
                    <Badge variant="danger" size="sm">
                      {t('finance:table.overdue')}
                    </Badge>
                  )}
                </div>
                {payable.formaPagamento && (
                  <p className="mt-1 text-xs text-ink-soft">
                    {PAYMENT_METHOD_LABELS[payable.formaPagamento]}
                  </p>
                )}
              </TableCell>
              {canWrite && (
                <TableCell>
                  <div className="flex justify-end gap-0.5">
                    {isOpen && (
                      <RowAction
                        label={t('finance:actions.pay')}
                        tooltip={t('finance:actions.pay')}
                        onClick={() => onPay(payable)}
                        className="text-success"
                      >
                        <CircleCheck className="h-4 w-4" />
                      </RowAction>
                    )}
                    {payable.status !== 'CANCELADO' && (
                      <RowAction
                        label={t('finance:actions.invoice')}
                        tooltip={
                          payable.notaFiscal
                            ? t('finance:actions.invoiceEdit')
                            : t('finance:actions.invoice')
                        }
                        onClick={() => onInvoice(payable)}
                      >
                        <FileCheck2 className="h-4 w-4" />
                      </RowAction>
                    )}
                    {isOpen && (
                      <RowAction
                        label={t('common:actions.edit')}
                        tooltip={t('common:actions.edit')}
                        onClick={() => onEdit(payable)}
                      >
                        <Pencil className="h-4 w-4" />
                      </RowAction>
                    )}
                    {isOpen && (
                      <RowAction
                        label={t('finance:actions.cancel')}
                        tooltip={
                          payable.origem === 'REEMBOLSO'
                            ? t('finance:actions.cancelReimbursementBlocked')
                            : t('finance:actions.cancel')
                        }
                        onClick={() => onCancel(payable)}
                        disabled={payable.origem === 'REEMBOLSO'}
                        className="text-danger"
                      >
                        <Ban className="h-4 w-4" />
                      </RowAction>
                    )}
                  </div>
                </TableCell>
              )}
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}

function SourceLink({ payable }: { payable: PayableDto }) {
  const { t } = useTranslation('finance');
  const linkClass = 'hover:text-brand-gold-700 hover:underline';
  if (payable.contractId && payable.contractNumero) {
    return (
      <Link to={routeTo.contract(payable.contractId)} className={cn('font-mono', linkClass)}>
        {payable.contractNumero}
      </Link>
    );
  }
  if (payable.purchaseRequestId && payable.purchaseRequestTitle) {
    return (
      <Link to={routeTo.purchaseRequest(payable.purchaseRequestId)} className={linkClass}>
        {payable.purchaseRequestTitle}
      </Link>
    );
  }
  if (payable.reimbursementId) {
    return (
      <Link to={routeTo.reimbursement(payable.reimbursementId)} className={linkClass}>
        {t('finance:table.openReimbursement')}
      </Link>
    );
  }
  return null;
}
