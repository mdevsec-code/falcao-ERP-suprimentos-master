import type { PurchaseRequestDetailDto, PurchaseRequestSummaryDto } from '@falcao-erp/shared-types';

import { fileT, xlabel, xt } from '@/utils/export/language';
import {
  APPROVAL_ACTION_LABELS,
  APPROVAL_STEP_LABELS,
  PURCHASE_REQUEST_STATUS_LABELS,
} from '@/constants/enums';
import { EXPORT_COLORS, exportFileName, rgb } from '@/utils/export/brand';
import { PDF_FONT, type PdfReport } from '@/utils/export/pdf';
import { displayValue, type ReportDefinition } from '@/utils/export/report';
import { formatDateOnly, formatDateTime } from '@/utils/format';
import { imageDataUrl, uploadUrl } from '@/utils/image';

const t = (key: string, options?: Record<string, unknown>) => xt(key, options);

/** Solicitações do filtro atual — relatório padrão. */
export function purchaseRequestsReport(
  rows: readonly PurchaseRequestSummaryDto[],
  meta: string[],
): ReportDefinition<PurchaseRequestSummaryDto> {
  return {
    title: t('purchaseRequests:page.title'),
    subtitle: t('purchaseRequests:page.eyebrow'),
    meta,
    fileBase: fileT('purchaseRequests:report.fileBase'),
    orientation: 'landscape',
    rows,
    columns: [
      { header: t('purchaseRequests:report.title'), value: (r) => r.title, width: 40 },
      {
        header: t('purchaseRequests:report.status'),
        value: (r) => xlabel(PURCHASE_REQUEST_STATUS_LABELS, r.status),
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

/**
 * Plano de aquisição em PDF (paisagem): cabeçalho do pedido, itens com foto,
 * peso, local de uso, setor e data de entrada, e o quadro de assinaturas —
 * solicitante + as quatro etapas de aprovação.
 */
export async function exportPurchaseRequestPdf(request: PurchaseRequestDetailDto): Promise<void> {
  const [{ createPdfReport }, photos] = await Promise.all([
    import('@/utils/export/pdf'),
    Promise.all(
      request.items.map((item) => {
        const url = uploadUrl(item.photoUrl);
        return url ? imageDataUrl(url, 300) : Promise.resolve(null);
      }),
    ),
  ]);
  const pdf = await createPdfReport({
    title: t('purchaseRequests:pdf.title'),
    subtitle: `Nº ${request.numero} · ${request.title}`,
    orientation: 'landscape',
  });

  pdf.fields(
    [
      [t('purchaseRequests:pdf.number'), String(request.numero)],
      [t('purchaseRequests:report.requester'), request.requesterName],
      [t('purchaseRequests:pdf.contact'), request.requesterContact],
      [t('purchaseRequests:pdf.project'), request.costCenter],
      [t('purchaseRequests:report.createdAt'), formatDateTime(request.createdAt)],
      [t('purchaseRequests:pdf.updatedAt'), formatDateTime(request.updatedAt)],
      [t('purchaseRequests:report.status'), xlabel(PURCHASE_REQUEST_STATUS_LABELS, request.status)],
      [
        t('purchaseRequests:pdf.currentStep'),
        request.currentStep ? xlabel(APPROVAL_STEP_LABELS, request.currentStep) : null,
      ],
    ],
    4,
  );
  if (request.justification) {
    pdf.section(t('purchaseRequests:pdf.justification'));
    pdf.paragraph(request.justification);
  }

  const PHOTO_COLUMN = 3;
  const PHOTO_SIZE = 16;
  pdf.section(t('purchaseRequests:pdf.items', { count: request.items.length }));
  pdf.table({
    fontSize: 7.5,
    columns: [
      { header: t('purchaseRequests:pdf.col.item'), align: 'center', width: 9 },
      { header: t('purchaseRequests:pdf.col.material') },
      { header: t('purchaseRequests:pdf.col.spec'), width: 44 },
      { header: t('purchaseRequests:pdf.col.photo'), align: 'center', width: PHOTO_SIZE + 4 },
      { header: t('purchaseRequests:pdf.col.unit'), align: 'center', width: 12 },
      { header: t('purchaseRequests:pdf.col.weight'), align: 'right', width: 18 },
      { header: t('purchaseRequests:pdf.col.local'), width: 30 },
      { header: t('purchaseRequests:pdf.col.quantity'), align: 'right', width: 18 },
      { header: t('purchaseRequests:pdf.col.sector'), width: 26 },
      { header: t('purchaseRequests:pdf.col.neededBy'), align: 'center', width: 20 },
      { header: t('purchaseRequests:pdf.col.subtotal'), align: 'right', width: 24 },
    ],
    rows: request.items.map((item, index) => {
      const subtotal =
        item.estimatedPrice !== null ? Number(item.estimatedPrice) * Number(item.quantity) : null;
      const brand = [item.marca, item.referencia].filter(Boolean).join(' · ');
      return [
        String(index + 1),
        [item.description, item.productName, brand].filter(Boolean).join('\n'),
        item.especificacao ?? '',
        { content: '', styles: { minCellHeight: photos[index] ? PHOTO_SIZE + 2 : 0 } },
        item.unit,
        item.pesoTotal !== null ? `${displayValue(item.pesoTotal, 'number')} kg` : '',
        item.localUso ?? '',
        displayValue(item.quantity, 'number'),
        item.setorSolicitante ?? '',
        formatDateOnly(item.dataNecessaria) ?? '',
        displayValue(subtotal, 'money'),
      ];
    }),
    foot: [
      [
        '',
        t('common:export.total'),
        ...Array<string>(8).fill(''),
        displayValue(request.estimatedTotal, 'money'),
      ],
    ],
    didDrawCell: (data) => {
      if (data.section !== 'body' || data.column.index !== PHOTO_COLUMN) return;
      const image = photos[data.row.index];
      if (!image) return;
      const { width, height } = pdf.doc.getImageProperties(image);
      const scale = Math.min(PHOTO_SIZE / width, PHOTO_SIZE / height);
      const w = width * scale;
      const h = height * scale;
      pdf.doc.addImage(
        image,
        'JPEG',
        data.cell.x + (data.cell.width - w) / 2,
        data.cell.y + (data.cell.height - h) / 2,
        w,
        h,
      );
    },
  });

  drawSignatures(pdf, request);

  if (request.approvals.length > 0) {
    pdf.section(t('purchaseRequests:pdf.history'));
    pdf.table({
      columns: [
        { header: t('purchaseRequests:pdf.col.date'), width: 32 },
        { header: t('purchaseRequests:pdf.col.who'), width: 44 },
        { header: t('purchaseRequests:pdf.col.action'), width: 32 },
        { header: t('purchaseRequests:pdf.col.change'), width: 60 },
        { header: t('purchaseRequests:pdf.col.comment') },
      ],
      rows: request.approvals.map((approval) => [
        formatDateTime(approval.createdAt) ?? '',
        approval.approverName,
        xlabel(APPROVAL_ACTION_LABELS, approval.action),
        `${xlabel(PURCHASE_REQUEST_STATUS_LABELS, approval.fromStatus)} » ${xlabel(PURCHASE_REQUEST_STATUS_LABELS, approval.toStatus)}`,
        approval.comment ?? '',
      ]),
    });
  }

  pdf.save(
    exportFileName(
      fileT('purchaseRequests:pdf.fileBase', { numero: request.numero, title: request.title }),
      'pdf',
    ),
  );
}

type SignatureTone = 'ok' | 'rejected' | 'pending';

const TONE_COLORS: Record<SignatureTone, string> = {
  ok: EXPORT_COLORS.ink,
  rejected: 'B42318',
  pending: EXPORT_COLORS.muted,
};

/** Quadro de assinaturas, como no papel: uma caixa para o solicitante e uma por etapa. */
function drawSignatures(pdf: PdfReport, request: PurchaseRequestDetailDto): void {
  const BOX_HEIGHT = 40;
  const GAP = 3;
  const boxes: Array<{
    label: string;
    name: string;
    line: string;
    image: string | null;
    tone: SignatureTone;
  }> = [
    {
      label: t('purchaseRequests:pdf.requesterBox'),
      name: request.requesterName,
      line: t('purchaseRequests:pdf.submittedAt', { date: formatDateTime(request.createdAt) }),
      image: null,
      tone: 'ok',
    },
    ...request.approvalSteps.map(({ step, approvers, signature }) => ({
      label: xlabel(APPROVAL_STEP_LABELS, step),
      name: signature?.signerName ?? approvers.map((a) => a.name).join(', '),
      line: signature
        ? t(
            signature.decision === 'RECUSADO'
              ? 'purchaseRequests:pdf.rejectedAt'
              : 'purchaseRequests:pdf.approvedAt',
            { date: formatDateTime(signature.signedAt) },
          )
        : t('purchaseRequests:pdf.pending'),
      image: signature?.signatureData ?? null,
      tone: (!signature
        ? 'pending'
        : signature.decision === 'RECUSADO'
          ? 'rejected'
          : 'ok') as SignatureTone,
    })),
  ];

  pdf.ensureSpace(BOX_HEIGHT + 14);
  pdf.section(t('purchaseRequests:pdf.signatures'));
  const doc = pdf.doc;
  const width = (pdf.contentWidth - GAP * (boxes.length - 1)) / boxes.length;
  const top = pdf.y;
  boxes.forEach((box, index) => {
    const x = pdf.marginX + index * (width + GAP);
    doc.setDrawColor(...rgb(EXPORT_COLORS.border)).setLineWidth(0.2);
    doc.rect(x, top, width, BOX_HEIGHT);
    doc
      .setFont(PDF_FONT, 'bold')
      .setFontSize(8)
      .setTextColor(...rgb(EXPORT_COLORS.ink));
    doc.text(box.label.toUpperCase(), x + 2, top + 4.5);

    // Área da assinatura, com a linha de base.
    const areaTop = top + 7;
    const areaHeight = 17;
    if (box.image) {
      const props = doc.getImageProperties(box.image);
      const scale = Math.min((width - 6) / props.width, areaHeight / props.height);
      const w = props.width * scale;
      const h = props.height * scale;
      doc.addImage(box.image, 'PNG', x + (width - w) / 2, areaTop + (areaHeight - h) / 2, w, h);
    }
    doc.setDrawColor(...rgb(EXPORT_COLORS.muted)).setLineWidth(0.1);
    doc.line(x + 3, areaTop + areaHeight + 1, x + width - 3, areaTop + areaHeight + 1);

    doc
      .setFont(PDF_FONT, 'normal')
      .setFontSize(7.5)
      .setTextColor(...rgb(EXPORT_COLORS.ink));
    const name = (doc.splitTextToSize(box.name || '—', width - 4) as string[]).slice(0, 2);
    doc.text(name, x + 2, areaTop + areaHeight + 5);
    doc.setFontSize(7).setTextColor(...rgb(TONE_COLORS[box.tone]));
    doc.text(doc.splitTextToSize(box.line, width - 4) as string[], x + 2, top + BOX_HEIGHT - 3);
  });
  pdf.y = top + BOX_HEIGHT + 6;
}
