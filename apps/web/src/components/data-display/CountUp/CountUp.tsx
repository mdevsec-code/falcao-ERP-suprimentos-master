import { useCountUp } from '@/hooks/useCountUp';
import { getIntlLocale } from '@/utils/locale';

export interface CountUpProps {
  value: number;
  /** Duração da animação em ms. */
  duration?: number;
  /** Formatação do número exibido (padrão: inteiro no idioma ativo). Ex.: `formatCurrencyBRL`. */
  format?: (value: number) => string;
}

/**
 * Número inteiro que "sobe" até o valor final (respeita
 * `prefers-reduced-motion`). Usado como `value` dos `StatTile`.
 */
export function CountUp({ value, duration, format }: CountUpProps) {
  const current = useCountUp(value, duration);
  return <>{format ? format(current) : new Intl.NumberFormat(getIntlLocale()).format(current)}</>;
}
