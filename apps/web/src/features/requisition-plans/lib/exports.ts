import type { RequisitionPlanDetailDto, RequisitionPlanSummaryDto } from '@falcao-erp/shared-types';

import i18n from '@/i18n';
import { brand } from '@/config/brand';
import { QUOTATION_STATUS_LABELS, REQUISITION_PLAN_STATUS_LABELS } from '@/constants/enums';
import { openQuotationLink } from '@/features/quotations/lib/share';
import { exportFileName } from '@/utils/export/brand';
import { displayValue, type ReportDefinition } from '@/utils/export/report';
import { formatDateOnly } from '@/utils/format';

const t = (key: string, options?: Record<string, unknown>) => i18n.t(`plans:${key}`, options);

/**
 * Pedido de cotação em PDF — o documento que vai para o fornecedor: itens
 * consolidados do plano, prazo, obra e como responder (o link aberto).
 * Não traz preços nem as solicitações internas de origem.
 */
export async function exportPlanRequestPdf(plan: RequisitionPlanDetailDto): Promise<void> {
  const { createPdfReport } = await import('@/utils/export/pdf');
  const pdf = await createPdfReport({
    title: t('pdf.title', { numero: plan.numero }),
    subtitle: plan.titulo,
  });

  pdf.fields(
    [
      [t('pdf.company'), brand.legalName],
      [t('pdf.workSite'), plan.obra],
      [t('pdf.deadline'), formatDateOnly(plan.prazoResposta)],
      [t('pdf.itemCount'), String(plan.items.length)],
    ],
    4,
  );
  if (plan.observacoes) {
    pdf.section(t('pdf.notes'));
    pdf.paragraph(plan.observacoes);
  }

  pdf.section(t('pdf.itemsTitle'));
  pdf.table({
    columns: [
      { header: t('pdf.col.item'), align: 'center', width: 10 },
      { header: t('pdf.col.description') },
      { header: t('pdf.col.requested'), width: 45 },
      { header: t('pdf.col.quantity'), align: 'right', width: 22 },
      { header: t('pdf.col.unit'), align: 'center', width: 14 },
    ],
    rows: plan.items.map((item, index) => [
      String(index + 1),
      item.descricao,
      [item.marca, item.referencia].filter(Boolean).join(' · '),
      displayValue(item.quantidade, 'number'),
      item.unidade,
    ]),
  });

  pdf.section(t('pdf.howTo'));
  if (plan.linkAbertoToken) {
    pdf.paragraph(t('pdf.howToLink', { prazo: formatDateOnly(plan.prazoResposta) }));
    pdf.paragraph(openQuotationLink(plan.linkAbertoToken));
  } else {
    pdf.paragraph(t('pdf.howToNoLink', { prazo: formatDateOnly(plan.prazoResposta) }));
  }
  pdf.meta([t('pdf.privacy')]);

  pdf.save(exportFileName(t('pdf.fileBase', { numero: plan.numero }), 'pdf'));
}

/** Lista de planos (filtro atual) para o relatório padrão em PDF, Excel ou CSV. */
export function plansReport(
  rows: readonly RequisitionPlanSummaryDto[],
  meta: string[],
): ReportDefinition<RequisitionPlanSummaryDto> {
  return {
    title: t('page.title'),
    subtitle: t('page.eyebrow'),
    meta,
    fileBase: t('report.fileBase'),
    orientation: 'landscape',
    rows,
    columns: [
      { header: t('table.number'), value: (p) => p.numero, type: 'integer', width: 8 },
      { header: t('table.title'), value: (p) => p.titulo, width: 36 },
      { header: t('table.workSite'), value: (p) => p.obra, width: 20 },
      {
        header: t('table.status'),
        value: (p) => REQUISITION_PLAN_STATUS_LABELS[p.status],
        width: 12,
      },
      { header: t('table.deadline'), value: (p) => p.prazoResposta, type: 'date', width: 12 },
      { header: t('table.requests'), value: (p) => p.solicitacoes, type: 'integer', width: 12 },
      {
        header: t('table.quotation'),
        value: (p) =>
          p.quotation
            ? `#${p.quotation.numero} · ${QUOTATION_STATUS_LABELS[p.quotation.status]}`
            : null,
        width: 18,
      },
      {
        header: t('table.answers'),
        value: (p) => (p.quotation ? `${p.quotation.respondidos}/${p.quotation.convidados}` : null),
        width: 10,
      },
      { header: t('table.createdBy'), value: (p) => p.createdByName, width: 20 },
      { header: t('table.createdAt'), value: (p) => p.createdAt, type: 'dateTime', width: 16 },
    ],
  };
}
