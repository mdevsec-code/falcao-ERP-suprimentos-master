import { useEffect, useRef } from 'react';
import { cn } from '@/utils/cn';

export interface BlueprintBackdropProps {
  /** Luz dourada que segue o ponteiro (desligada com prefers-reduced-motion). */
  spotlight?: boolean;
  /** Marcas de registro nos cantos, como numa prancha técnica. */
  registrationMarks?: boolean;
  className?: string;
}

/**
 * Fundo "planta técnica" das telas de entrada: malha milimetrada (fina + a
 * cada 5 módulos, em dourado), brilhos que derivam devagar e marcas de
 * registro nos cantos. Só usa tokens do tema — funciona no claro e no escuro.
 * Decorativo: `aria-hidden` e `pointer-events-none`.
 */
export function BlueprintBackdrop({
  spotlight = false,
  registrationMarks = true,
  className,
}: BlueprintBackdropProps) {
  const spotRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!spotlight) return;
    const el = spotRef.current;
    if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let frame = 0;
    function onMove(event: PointerEvent) {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        el?.style.setProperty('--mx', `${event.clientX}px`);
        el?.style.setProperty('--my', `${event.clientY}px`);
      });
    }
    window.addEventListener('pointermove', onMove, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('pointermove', onMove);
    };
  }, [spotlight]);

  return (
    <div
      aria-hidden="true"
      className={cn('pointer-events-none absolute inset-0 overflow-hidden', className)}
    >
      {/* Malha fina */}
      <div
        className="absolute inset-0 opacity-70"
        style={{
          backgroundImage:
            'linear-gradient(rgb(var(--color-border) / 0.6) 1px, transparent 1px), linear-gradient(90deg, rgb(var(--color-border) / 0.6) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
          maskImage: 'radial-gradient(ellipse 80% 70% at 50% 45%, black 35%, transparent 85%)',
          WebkitMaskImage:
            'radial-gradient(ellipse 80% 70% at 50% 45%, black 35%, transparent 85%)',
        }}
      />
      {/* Malha principal (a cada 5 módulos), em dourado */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            'linear-gradient(rgb(var(--color-brand-gold-500) / 0.12) 1px, transparent 1px), linear-gradient(90deg, rgb(var(--color-brand-gold-500) / 0.12) 1px, transparent 1px)',
          backgroundSize: '120px 120px',
          maskImage: 'radial-gradient(ellipse 75% 65% at 50% 45%, black 30%, transparent 80%)',
          WebkitMaskImage:
            'radial-gradient(ellipse 75% 65% at 50% 45%, black 30%, transparent 80%)',
        }}
      />

      {/* Brilhos ambientes */}
      <div
        className="absolute -left-32 -top-32 h-[32rem] w-[32rem] animate-drift rounded-full blur-3xl"
        style={{
          background:
            'radial-gradient(circle, rgb(var(--color-brand-gold-300) / 0.22), transparent 70%)',
        }}
      />
      <div
        className="absolute -bottom-40 -right-24 h-[28rem] w-[28rem] animate-drift-reverse rounded-full blur-3xl"
        style={{
          background:
            'radial-gradient(circle, rgb(var(--color-brand-gold-500) / 0.16), transparent 70%)',
        }}
      />

      {spotlight && (
        <div
          ref={spotRef}
          className="absolute inset-0 transition-opacity duration-slow"
          style={{
            background:
              'radial-gradient(420px circle at var(--mx, 70%) var(--my, 40%), rgb(var(--color-brand-gold-300) / 0.10), transparent 65%)',
          }}
        />
      )}

      {registrationMarks && (
        <>
          <RegistrationMark className="left-5 top-24" label="A1" />
          <RegistrationMark className="right-5 top-24" label="A8" align="right" />
          <RegistrationMark className="bottom-20 left-5" label="F1" />
          <RegistrationMark className="bottom-20 right-5" label="F8" align="right" />
        </>
      )}
    </div>
  );
}

function RegistrationMark({
  className,
  label,
  align = 'left',
}: {
  className: string;
  label: string;
  align?: 'left' | 'right';
}) {
  return (
    <div
      className={cn(
        'absolute hidden items-center gap-2 font-mono text-2xs tracking-[0.2em] text-muted sm:flex',
        align === 'right' && 'flex-row-reverse',
        className,
      )}
    >
      <svg width="18" height="18" viewBox="0 0 18 18" className="text-brand-gold-500/70">
        <circle cx="9" cy="9" r="4" fill="none" stroke="currentColor" strokeWidth="1" />
        <path d="M9 0v18M0 9h18" stroke="currentColor" strokeWidth="1" />
      </svg>
      <span>{label}</span>
    </div>
  );
}
