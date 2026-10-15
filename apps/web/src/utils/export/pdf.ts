import type { jsPDF } from 'jspdf';
import type { CellHookData, RowInput, UserOptions } from 'jspdf-autotable';

import i18n from '@/i18n';
import { downloadBlob } from '@/utils/csv';
import {
  EXPORT_COLORS,
  LOGO_RATIO,
  exportIssuer,
  generatedLine,
  loadLogoDataUrl,
  rgb,
} from './brand';

export interface PdfReportOptions {
  title: string;
  subtitle?: string;
  orientation?: 'portrait' | 'landscape';
}

export interface PdfTableColumn {
  header: string;
  /** Alinha números e valores à direita. */
  align?: 'left' | 'right' | 'center';
  /** Largura em mm; sem ela a coluna se ajusta ao conteúdo. */
  width?: number;
}

export interface PdfTableOptions {
  columns: PdfTableColumn[];
  rows: RowInput[];
  /** Linha(s) de total, com o destaque dourado. */
  foot?: RowInput[];
  /** Ex.: pintar a célula do menor preço. */
  didParseCell?: (data: CellHookData) => void;
  fontSize?: number;
}

const MARGIN = 14;
/** Altura reservada ao cabeçalho de cada página (logo + título + filete). */
const HEADER_BOTTOM = 30;
const FOOTER_HEIGHT = 12;

/**
 * Documento PDF no padrão Falcão: em toda página, logo + título + filete
 * dourado no topo e, no rodapé, empresa, "gerado em/por" e "Página x de y".
 * Uso: `const pdf = await createPdfReport({...}); pdf.meta([...]); pdf.table({...}); pdf.save(nome)`.
 */
export class PdfReport {
  /** Posição vertical atual (mm) — cada bloco escreve a partir daqui. */
  y = HEADER_BOTTOM + 4;

  constructor(
    readonly doc: jsPDF,
    private readonly autoTable: (doc: jsPDF, options: UserOptions) => void,
    private readonly options: PdfReportOptions,
    private readonly logo: string | null,
  ) {
    this.drawHeader();
  }

  get pageWidth() {
    return this.doc.internal.pageSize.getWidth();
  }

  get pageHeight() {
    return this.doc.internal.pageSize.getHeight();
  }

  get contentWidth() {
    return this.pageWidth - MARGIN * 2;
  }

  /** Linhas de contexto (filtros, obra, prazo) logo abaixo do cabeçalho. */
  meta(lines: readonly (string | null | undefined)[]): this {
    const visible = lines.filter((line): line is string => !!line);
    if (visible.length === 0) return this;
    this.doc
      .setFont('helvetica', 'normal')
      .setFontSize(9)
      .setTextColor(...rgb(EXPORT_COLORS.muted));
    for (const line of visible) {
      const wrapped = this.doc.splitTextToSize(line, this.contentWidth) as string[];
      this.ensureSpace(wrapped.length * 4.2);
      this.doc.text(wrapped, MARGIN, this.y);
      this.y += wrapped.length * 4.2;
    }
    this.y += 2;
    return this;
  }

  /** Título de seção com filete dourado à esquerda. */
  section(title: string): this {
    this.ensureSpace(12);
    this.y += 2;
    this.doc.setFillColor(...rgb(EXPORT_COLORS.gold)).rect(MARGIN, this.y - 3.6, 1.2, 4.8, 'F');
    this.doc
      .setFont('helvetica', 'bold')
      .setFontSize(11)
      .setTextColor(...rgb(EXPORT_COLORS.ink));
    this.doc.text(title, MARGIN + 3, this.y);
    this.y += 5;
    return this;
  }

  /** Pares rótulo/valor em grade (2 colunas por padrão), como numa ficha. */
  fields(pairs: ReadonlyArray<[string, string | null | undefined]>, columns = 2): this {
    const colWidth = this.contentWidth / columns;
    const visible = pairs.map(([label, value]) => [label, value?.trim() ? value : '—'] as const);
    for (let index = 0; index < visible.length; index += columns) {
      const chunk = visible.slice(index, index + columns);
      const heights = chunk.map(
        ([, value]) => (this.doc.splitTextToSize(value, colWidth - 4) as string[]).length,
      );
      const height = 4 + Math.max(...heights) * 4.2;
      this.ensureSpace(height + 1);
      chunk.forEach(([label, value], col) => {
        const x = MARGIN + col * colWidth;
        this.doc
          .setFont('helvetica', 'normal')
          .setFontSize(7.5)
          .setTextColor(...rgb(EXPORT_COLORS.muted));
        this.doc.text(label.toUpperCase(), x, this.y);
        this.doc
          .setFont('helvetica', 'normal')
          .setFontSize(9.5)
          .setTextColor(...rgb(EXPORT_COLORS.ink));
        this.doc.text(this.doc.splitTextToSize(value, colWidth - 4) as string[], x, this.y + 4.2);
      });
      this.y += height + 1.5;
    }
    this.y += 1;
    return this;
  }

  /** Texto corrido (observações, justificativa). */
  paragraph(text: string | null | undefined): this {
    if (!text?.trim()) return this;
    this.doc
      .setFont('helvetica', 'normal')
      .setFontSize(9.5)
      .setTextColor(...rgb(EXPORT_COLORS.ink));
    const lines = this.doc.splitTextToSize(text.trim(), this.contentWidth) as string[];
    for (const line of lines) {
      this.ensureSpace(4.6);
      this.doc.text(line, MARGIN, this.y);
      this.y += 4.6;
    }
    this.y += 2;
    return this;
  }

  /** Tabela no padrão: cabeçalho preto, linhas alternadas, total em dourado; quebra página sozinha. */
  table(options: PdfTableOptions): this {
    const columnStyles: UserOptions['columnStyles'] = {};
    options.columns.forEach((column, index) => {
      columnStyles[index] = {
        halign: column.align ?? 'left',
        ...(column.width ? { cellWidth: column.width } : {}),
      };
    });
    this.autoTable(this.doc, {
      startY: this.y,
      head: [options.columns.map((column) => column.header)],
      body: options.rows,
      foot: options.foot,
      showFoot: 'lastPage',
      margin: { top: HEADER_BOTTOM + 4, left: MARGIN, right: MARGIN, bottom: FOOTER_HEIGHT + 4 },
      theme: 'grid',
      styles: {
        font: 'helvetica',
        fontSize: options.fontSize ?? 8,
        cellPadding: 1.6,
        textColor: rgb(EXPORT_COLORS.ink),
        lineColor: rgb(EXPORT_COLORS.border),
        lineWidth: 0.1,
        valign: 'middle',
        overflow: 'linebreak',
      },
      headStyles: {
        fillColor: rgb(EXPORT_COLORS.ink),
        textColor: rgb(EXPORT_COLORS.white),
        fontStyle: 'bold',
        halign: 'center',
      },
      footStyles: {
        fillColor: rgb(EXPORT_COLORS.goldSoft),
        textColor: rgb(EXPORT_COLORS.ink),
        fontStyle: 'bold',
      },
      alternateRowStyles: { fillColor: rgb(EXPORT_COLORS.zebra) },
      columnStyles,
      didParseCell: (data) => {
        // Rodapé herda o alinhamento da coluna (total de valor fica à direita).
        if (data.section === 'foot')
          data.cell.styles.halign = options.columns[data.column.index]?.align ?? 'left';
        options.didParseCell?.(data);
      },
      didDrawPage: () => this.drawHeader(),
    });
    const last = (this.doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable;
    this.y = (last?.finalY ?? this.y) + 6;
    return this;
  }

  /** Espaço vertical; abre página nova quando não cabe. */
  ensureSpace(height: number): void {
    if (this.y + height <= this.pageHeight - FOOTER_HEIGHT - 4) return;
    this.doc.addPage();
    this.drawHeader();
    this.y = HEADER_BOTTOM + 4;
  }

  /** Rodapé com "Página x de y" (só dá para saber o total no fim) e download. */
  save(fileName: string): void {
    const total = this.doc.getNumberOfPages();
    for (let page = 1; page <= total; page += 1) {
      this.doc.setPage(page);
      const y = this.pageHeight - 8;
      this.doc.setDrawColor(...rgb(EXPORT_COLORS.border)).setLineWidth(0.2);
      this.doc.line(MARGIN, y - 4, this.pageWidth - MARGIN, y - 4);
      this.doc
        .setFont('helvetica', 'normal')
        .setFontSize(7)
        .setTextColor(...rgb(EXPORT_COLORS.muted));
      this.doc.text(exportIssuer(), MARGIN, y);
      this.doc.text(generatedLine(), this.pageWidth / 2, y, { align: 'center' });
      this.doc.text(i18n.t('common:export.page', { page, total }), this.pageWidth - MARGIN, y, {
        align: 'right',
      });
    }
    downloadBlob(this.doc.output('blob'), fileName);
  }

  /** Páginas que já têm cabeçalho (a tabela chama o desenho de novo a cada página). */
  private readonly pagesWithHeader = new Set<number>();

  private drawHeader(): void {
    const { doc } = this;
    const page = doc.getCurrentPageInfo().pageNumber;
    if (this.pagesWithHeader.has(page)) return;
    this.pagesWithHeader.add(page);
    let textX = MARGIN;
    if (this.logo) {
      const height = 12;
      doc.addImage(this.logo, 'PNG', MARGIN, 9, height * LOGO_RATIO, height);
      textX = MARGIN + height * LOGO_RATIO + 5;
    }
    const maxWidth = this.pageWidth - MARGIN - textX;
    doc
      .setFont('helvetica', 'bold')
      .setFontSize(13)
      .setTextColor(...rgb(EXPORT_COLORS.ink));
    doc.text((doc.splitTextToSize(this.options.title, maxWidth) as string[])[0] ?? '', textX, 15);
    if (this.options.subtitle) {
      doc
        .setFont('helvetica', 'normal')
        .setFontSize(9)
        .setTextColor(...rgb(EXPORT_COLORS.muted));
      doc.text(
        (doc.splitTextToSize(this.options.subtitle, maxWidth) as string[])[0] ?? '',
        textX,
        20.5,
      );
    }
    doc.setDrawColor(...rgb(EXPORT_COLORS.gold)).setLineWidth(0.8);
    doc.line(MARGIN, HEADER_BOTTOM - 4, this.pageWidth - MARGIN, HEADER_BOTTOM - 4);
  }
}

/** O jsPDF (e o plugin de tabela) só é carregado quando alguém gera um PDF. */
export async function createPdfReport(options: PdfReportOptions): Promise<PdfReport> {
  const [{ jsPDF }, { autoTable }, logo] = await Promise.all([
    import('jspdf'),
    import('jspdf-autotable'),
    loadLogoDataUrl(),
  ]);
  const doc = new jsPDF({
    orientation: options.orientation ?? 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: true,
  });
  doc.setProperties({
    title: options.title,
    subject: options.subtitle ?? '',
    creator: exportIssuer(),
  });
  return new PdfReport(doc, autoTable, options, logo);
}
