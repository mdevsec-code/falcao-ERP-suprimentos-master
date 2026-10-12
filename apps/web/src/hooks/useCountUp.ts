import { useEffect, useRef, useState } from 'react';

/**
 * Anima um número inteiro subindo até `target` em `duration` ms.
 * Respeita `prefers-reduced-motion` (pula direto para o valor final).
 */
export function useCountUp(target: number, duration = 600): number {
  const [value, setValue] = useState(target);
  const previousTarget = useRef(target);

  useEffect(() => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) {
      setValue(target);
      previousTarget.current = target;
      return;
    }

    const from = previousTarget.current;
    const to = target;
    previousTarget.current = target;
    if (from === to) return;

    let frame: number;
    const start = performance.now();

    function tick(now: number) {
      const elapsed = now - start;
      const progress = Math.min(1, elapsed / duration);
      const eased = 1 - (1 - progress) * (1 - progress);
      // Quadros intermediários inteiros; o último é o valor exato (centavos).
      setValue(progress < 1 ? Math.round(from + (to - from) * eased) : to);
      if (progress < 1) {
        frame = requestAnimationFrame(tick);
      }
    }

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, duration]);

  return value;
}
