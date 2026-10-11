import { type CSSProperties, type ImgHTMLAttributes } from 'react';

import logoMark from './falcao-mark.png';
import logoWordmark from './falcao-wordmark.png';

export type FalcaoLogoVariant = 'mark' | 'wordmark';

export interface FalcaoLogoProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'> {
  /**
   * `mark` (padrão) — silhueta do falcão isolada (recorte com fundo
   * transparente, 585×790). Use em sidebar, avatar de login, favicon.
   * `wordmark` — logo completa com "FALCÃO", "Construções" e "Engenharia"
   * (recorte com fundo transparente, 1540×780). Use em painéis e header.
   *
   * O tamanho é resolvido pela imagem em si (via `aspect-ratio` + a
   * dimensão que você definir em `className`/`style`) — defina apenas
   * `width` OU `height`, nunca as duas, senão a imagem distorce ou sobra
   * espaço vazio ao redor dela.
   */
  variant?: FalcaoLogoVariant;
  /**
   * Classes do "card" ao redor da logo (fundo, padding, borda, sombra).
   * Como esse wrapper não tem tamanho fixo — ele apenas envolve a imagem
   * já dimensionada — qualquer `p-*` aqui vira respiro real ao redor do
   * falcão, sem brigar com o aspect-ratio. Padrão: `'transparent'`.
   */
  bgClassName?: string;
}

const MARK_ASPECT_RATIO = '585 / 790';
const WORDMARK_ASPECT_RATIO = '1540 / 780';

/**
 * Logo oficial da Falcão Construções e Engenharia.
 *
 * Ambos os assets (`falcao-mark.png`, `falcao-wordmark.png`) são recortes
 * com fundo transparente gerados a partir da arte original
 * (`Logo-Falcão.jpeg`), isolando exatamente a silhueta do falcão ou o
 * lockup completo. A imagem carrega seu próprio `aspect-ratio`, então
 * ela sempre preenche a área definida sem sobra nem distorção — o
 * wrapper (`bgClassName`) só existe para dar um fundo/padding opcional.
 */
export function FalcaoLogo({
  variant = 'mark',
  bgClassName = '',
  className,
  alt,
  style,
  ...rest
}: FalcaoLogoProps) {
  const isWordmark = variant === 'wordmark';

  const aspectStyle: CSSProperties = {
    aspectRatio: isWordmark ? WORDMARK_ASPECT_RATIO : MARK_ASPECT_RATIO,
  };

  return (
    <span
      className={['inline-flex items-center justify-center', bgClassName].filter(Boolean).join(' ')}
    >
      <img
        src={isWordmark ? logoWordmark : logoMark}
        alt={alt ?? (isWordmark ? 'Falcão Construções e Engenharia' : 'Falcão')}
        decoding="async"
        loading="lazy"
        className={['block object-contain object-center', isWordmark ? '' : 'rounded-md', className]
          .filter(Boolean)
          .join(' ')}
        style={{ ...aspectStyle, ...style }}
        {...rest}
      />
    </span>
  );
}

export default FalcaoLogo;
