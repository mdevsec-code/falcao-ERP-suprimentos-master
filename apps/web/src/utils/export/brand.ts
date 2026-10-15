import wordmarkUrl from '@/assets/logo/falcao-wordmark.png';
import { brand } from '@/config/brand';
import i18n from '@/i18n';
import { authStore } from '@/store/authStore';
import { toDateOnly } from '@falcao-erp/shared-types';

/**
 * Identidade visual de tudo que o sistema exporta (PDF, Excel, CSV) — um lugar
 * só para cor, logo, rodapé e nome de arquivo. Cores em hex sem `#` (o formato
 * do ExcelJS); o PDF converte com `rgb()`.
 */
export const EXPORT_COLORS = {
  /** Texto e cabeçalho das tabelas (preto da logo). */
  ink: '14140F',
  /** Dourado da logo — filete do cabeçalho e destaques. */
  gold: 'FDBF2A',
  goldDark: 'AC7E06',
  /** Fundo da linha de totais / destaque suave. */
  goldSoft: 'FFF8E6',
  /** Linhas alternadas. */
  zebra: 'FAFAF7',
  border: 'E7E7E3',
  muted: '6B6B63',
  /** Melhor preço no mapa de cotação. */
  best: 'DCF3E4',
  white: 'FFFFFF',
} as const;

export const rgb = (hex: string): [number, number, number] => [
  parseInt(hex.slice(0, 2), 16),
  parseInt(hex.slice(2, 4), 16),
  parseInt(hex.slice(4, 6), 16),
];

/** Proporção do logotipo (1540 × 780). */
export const LOGO_RATIO = 1540 / 780;

let logoPromise: Promise<string | null> | null = null;

/**
 * Logo em data URL PNG, reduzida para ~480 px de largura (o arquivo original
 * tem 400 KB — embutido em cada PDF/planilha pesaria à toa). `null` se o
 * navegador não conseguir desenhar (o documento sai sem logo, não quebra).
 */
export function loadLogoDataUrl(): Promise<string | null> {
  logoPromise ??= new Promise<string | null>((resolve) => {
    if (typeof Image === 'undefined' || typeof document === 'undefined') return resolve(null);
    // Se a imagem não carregar (rede, ambiente de teste), o documento sai sem logo.
    const timeout = setTimeout(() => resolve(null), 3000);
    const image = new Image();
    image.onload = () => {
      clearTimeout(timeout);
      try {
        const width = 480;
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = Math.round(width / LOGO_RATIO);
        const context = canvas.getContext('2d');
        if (!context) return resolve(null);
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/png'));
      } catch {
        resolve(null);
      }
    };
    image.onerror = () => {
      clearTimeout(timeout);
      resolve(null);
    };
    image.src = wordmarkUrl;
  }).then((result) => {
    if (result === null) logoPromise = null;
    return result;
  });
  return logoPromise;
}

/** Linha de rodapé: quando e por quem o arquivo foi gerado. */
export function generatedLine(now: Date = new Date()): string {
  const date = now.toLocaleString(i18n.language, { dateStyle: 'short', timeStyle: 'short' });
  const name = authStore.session?.user.name;
  return name
    ? i18n.t('common:export.generatedBy', { date, name })
    : i18n.t('common:export.generatedAt', { date });
}

/** Empresa e sistema, no rodapé/cabeçalho de impressão. */
export const exportIssuer = () => `${brand.legalName} · ${brand.name}`;

/** "Contas a pagar" → `falcao-contas-a-pagar-2026-10-15.pdf` — mesmo padrão em todo formato. */
export function exportFileName(base: string, extension: 'pdf' | 'xlsx' | 'csv'): string {
  const slug = base
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
  return `falcao-${slug || 'relatorio'}-${toDateOnly()}.${extension}`;
}
