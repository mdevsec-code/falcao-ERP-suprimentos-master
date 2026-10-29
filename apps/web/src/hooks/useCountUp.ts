import { useEffect, useRef, useState } from 'react';

function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

/**
 * Anima um número inteiro subindo até `target` em `duration` ms — inclusive
 * na primeira renderização (parte do zero). Respeita `prefers-reduced-motion`
 * (pula direto para o valor final).
 */
export function useCountUp(target: number, duration = 900): number {
  const [value, setValue] = useState(() => (prefersReducedMotion() ? target : 0));
  // Valor na tela agora. A animação parte daqui (e não do alvo anterior): se
  // ela for cancelada no meio — troca de alvo ou o efeito duplo do
  // StrictMode — a próxima continua de onde o número parou.
  const shown = useRef(value);

  useEffect(() => {
    function show(next: number) {
      shown.current = next;
      setValue(next);
    }

    if (prefersReducedMotion()) {
      show(target);
      return;
    }

    const from = shown.current;
    const to = target;
    if (from === to) return;

    let frame: number;
    const start = performance.now();

    function tick(now: number) {
      const elapsed = now - start;
      const progress = Math.min(1, elapsed / duration);
      // ease-out cúbico: dispara rápido e assenta devagar no valor final.
      const eased = 1 - Math.pow(1 - progress, 3);
      // Quadros intermediários inteiros; o último é o valor exato (centavos).
      show(progress < 1 ? Math.round(from + (to - from) * eased) : to);
      if (progress < 1) {
        frame = requestAnimationFrame(tick);
      }
    }

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, duration]);

  return value;
}
