import type { PurchaseRequestDetailDto, PurchaseRequestSummaryDto } from '@falcao-erp/shared-types';

import i18n from '@/i18n';
import { APPROVAL_ACTION_LABELS, PURCHASE_REQUEST_STATUS_LABELS } from '@/constants/enums';
import { exportFileName } from '@/utils/export/brand';
import { displayValue, type ReportDefinition } from '@/utils/export/report';
import { formatDateTime } from '@/utils/format';

const t = (key: string, options?: Record<string, unknown>) => i18n.t(key, options);

/** Solicitações do filtro atual — relatório padrão. */
export function purchaseRequestsReport(
  rows: readonly PurchaseRequestSummaryDto[],
  meta: string[],
): ReportDefinition<PurchaseRequestSummaryDto> {
  return {
    title: t('purchaseRequests:page.title'),
    subtitle: t('purchaseRequests:page.eyebrow'),
    meta,
    fileBase: t('purchaseRequests:report.fileBase'),
    orientation: 'landscape',
    rows,
    columns: [
      { header: t('purchaseRequests:report.title'), value: (r) => r.title, width: 40 },
      {
        header: t('purchaseRequests:report.status'),
        value: (r) => PURCHASE_REQUEST_STATUS_LABELS[r.status],
        width: 20,
      },
      { header: t('purchaseRequests:report.costCenter'), value: (r) => r.costCenter, width: 18 },
      { header: t('purchaseRequests:report.requester'), value: (r) => r.requesterName, width: 22 },
      {
        header: t('purchaseRequests:report.items'),
        value: (r) => r.itemCount,
        type: 'integer',
        width: 8,
      },
      {
        header: t('purchaseRequests:report.estimated'),
        value: (r) => r.estimatedTotal,
        type: 'money',
        total: true,
      },
      {
        header: t('purchaseRequests:report.createdAt'),
        value: (r) => r.createdAt,
        type: 'dateTime',
      },
    ],
  };
}

/** Ficha da solicitação em PDF: dados, itens com estimativa e o histórico de aprovação. */
export async function exportPurchaseRequestPdf(request: PurchaseRequestDetailDto): Promise<void> {
  const { createPdfReport } = await import('@/utils/export/pdf');
  const pdf = await createPdfReport({
    title: t('purchaseRequests:pdf.title'),
    subtitle: request.title,
  });

  pdf.fields(
    [
      [t('purchaseRequests:report.status'), PURCHASE_REQUEST_STATUS_LABELS[request.status]],
      [t('purchaseRequests:report.requester'), request.requesterName],
      [t('purchaseRequests:report.costCenter'), request.costCenter],
      [t('purchaseRequests:report.createdAt'), formatDateTime(request.createdAt)],
    ],
    4,
  );
  if (request.justification) {
    pdf.section(t('purchaseRequests:pdf.justification'));
    pdf.paragraph(request.justification);
  }

  pdf.section(t('purchaseRequests:pdf.items', { count: request.items.length }));
  pdf.table({
    columns: [
      { header: t('purchaseRequests:pdf.col.item'), align: 'center', width: 10 },
      { header: t('purchaseRequests:pdf.col.description') },
      { header: t('purchaseRequests:pdf.col.brand'), width: 40 },
      { header: t('purchaseRequests:pdf.col.quantity'), align: 'right', width: 24 },
      { header: t('purchaseRequests:pdf.col.estimated'), align: 'right', width: 26 },
      { header: t('purchaseRequests:pdf.col.subtotal'), align: 'right', width: 28 },
    ],
    rows: request.items.map((item, index) => {
      const subtotal =
        item.estimatedPrice !== null ? Number(item.estimatedPrice) * Number(item.quantity) : null;
      return [
        String(index + 1),
        item.productName ? `${item.description}\n${item.productName}` : item.description,
        [item.marca, item.referencia].filter(Boolean).join(' · '),
        `${displayValue(item.quantity, 'number')} ${item.unit}`,
        displayValue(item.estimatedPrice, 'money'),
        displayValue(subtotal, 'money'),
      ];
    }),
    foot: [
      ['', t('common:export.total'), '', '', '', displayValue(request.estimatedTotal, 'money')],
    ],
  });

  if (request.approvals.length > 0) {
    pdf.section(t('purchaseRequests:pdf.history'));
    pdf.table({
      columns: [
        { header: t('purchaseRequests:pdf.col.date'), width: 32 },
        { header: t('purchaseRequests:pdf.col.who'), width: 40 },
        { header: t('purchaseRequests:pdf.col.action'), width: 32 },
        { header: t('purchaseRequests:pdf.col.change'), width: 48 },
        { header: t('purchaseRequests:pdf.col.comment') },
      ],
      rows: request.approvals.map((approval) => [
        formatDateTime(approval.createdAt) ?? '',
        approval.approverName,
        APPROVAL_ACTION_LABELS[approval.action],
        `${PURCHASE_REQUEST_STATUS_LABELS[approval.fromStatus]} » ${PURCHASE_REQUEST_STATUS_LABELS[approval.toStatus]}`,
        approval.comment ?? '',
      ]),
    });
  }

  pdf.save(exportFileName(t('purchaseRequests:pdf.fileBase', { title: request.title }), 'pdf'));
}
