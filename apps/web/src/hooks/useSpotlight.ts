import { useCallback, type PointerEvent } from 'react';

/**
 * Alimenta a classe `.spotlight` (ver tailwind.css): grava a posição do
 * ponteiro em `--mx`/`--my` no próprio elemento, sem re-renderizar.
 * Uso: `<div className="spotlight" onPointerMove={onPointerMove}>`.
 */
export function useSpotlight<T extends HTMLElement = HTMLElement>() {
  const onPointerMove = useCallback((event: PointerEvent<T>) => {
    const el = event.currentTarget;
    const rect = el.getBoundingClientRect();
    el.style.setProperty('--mx', `${event.clientX - rect.left}px`);
    el.style.setProperty('--my', `${event.clientY - rect.top}px`);
  }, []);

  return { onPointerMove };
}
