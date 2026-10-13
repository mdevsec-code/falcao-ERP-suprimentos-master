/**
 * CSV no formato que o Excel em português abre direto: separador `;`,
 * vírgula decimal fica a cargo de quem formata os valores, BOM UTF-8 para
 * os acentos e aspas só quando o campo precisa.
 */
export const BOM = String.fromCharCode(0xfeff);

/** Começo de célula que o Excel interpretaria como fórmula. */
const FORMULA_START = /^[=+\-@\t\r]/;
const PLAIN_NUMBER = /^-?\d+([.,]\d+)?$/;

export function toCsv(rows: readonly (readonly (string | number | null | undefined)[])[]): string {
  const escape = (value: string | number | null | undefined) => {
    let text = value === null || value === undefined ? '' : String(value);
    // Injeção de fórmula: texto vindo do usuário que começa com =, +, -, @ (ou
    // tab/CR) seria executado pelo Excel. Números (inclusive negativos) ficam intactos.
    if (typeof value === 'string' && FORMULA_START.test(text) && !PLAIN_NUMBER.test(text)) {
      text = `'${text}`;
    }
    return /[";\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  };
  return `${BOM}${rows.map((row) => row.map(escape).join(';')).join('\r\n')}`;
}

/** Número com vírgula decimal e sem separador de milhar (`1234.5` → `1234,50`). */
export function csvNumber(value: number | string | null | undefined): string {
  if (value === null || value === undefined || value === '') return '';
  const numeric = typeof value === 'string' ? Number(value) : value;
  return Number.isNaN(numeric) ? '' : numeric.toFixed(2).replace('.', ',');
}

/** Dispara o download de um texto como arquivo. */
export function downloadText(content: string, fileName: string, mimeType = 'text/csv') {
  const blob = new Blob([content], { type: `${mimeType};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
