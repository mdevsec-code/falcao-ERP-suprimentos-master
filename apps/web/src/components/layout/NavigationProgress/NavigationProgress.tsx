import { useEffect, useState } from 'react';
import { useIsFetching, useIsMutating } from '@tanstack/react-query';
import { cn } from '@/utils/cn';

const SHOW_DELAY_MS = 200;

/**
 * Fio dourado no topo da tela enquanto há consultas ou gravações em curso.
 * Só aparece se o carregamento passar de `SHOW_DELAY_MS` — respostas rápidas
 * não fazem a barra piscar.
 */
export function NavigationProgress() {
  const busy = useIsFetching() + useIsMutating() > 0;
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!busy) {
      setVisible(false);
      return;
    }
    const timer = window.setTimeout(() => setVisible(true), SHOW_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [busy]);

  return (
    <div
      aria-hidden="true"
      className={cn(
        'pointer-events-none fixed inset-x-0 top-0 z-toast h-0.5 overflow-hidden',
        'transition-opacity duration-slow',
        visible ? 'opacity-100' : 'opacity-0',
      )}
    >
      <div className="h-full w-full origin-left animate-progress-sweep bg-gradient-to-r from-transparent via-brand-gold-300 to-brand-gold-500 shadow-glow" />
    </div>
  );
}
