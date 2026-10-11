import { useCountUp } from '@/hooks/useCountUp';
import { getIntlLocale } from '@/utils/locale';

export interface CountUpProps {
  value: number;
  /** Duração da animação em ms. */
  duration?: number;
}

/**
 * Número inteiro que "sobe" até o valor final (respeita
 * `prefers-reduced-motion`). Usado como `value` dos `StatTile`.
 */
export function CountUp({ value, duration }: CountUpProps) {
  const current = useCountUp(value, duration);
  return <>{new Intl.NumberFormat(getIntlLocale()).format(current)}</>;
}
