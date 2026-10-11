import { type ReactNode } from 'react';
import { BlueprintBackdrop } from './BlueprintBackdrop';
import { CornerBrackets } from './CornerBrackets';

export interface StatusScreenProps {
  /** Código grande em contorno (ex.: "404", "403"). */
  code: string;
  /** Rótulo em mono acima do título (ex.: "Folha não encontrada"). */
  label: string;
  title: string;
  description: string;
  icon: ReactNode;
  actions: ReactNode;
}

/**
 * Tela de status no estilo "planta técnica": código enorme em contorno
 * tracejado sobre a malha, cartão com cantoneiras e ações. Usada pelo 404 e
 * pelo acesso negado.
 */
export function StatusScreen({
  code,
  label,
  title,
  description,
  icon,
  actions,
}: StatusScreenProps) {
  return (
    <div className="relative flex min-h-[calc(100vh-4.5rem)] items-center justify-center overflow-hidden px-6 py-16">
      <BlueprintBackdrop registrationMarks={false} />

      <div className="relative flex w-full max-w-xl flex-col items-center text-center">
        <p
          aria-hidden="true"
          className="pointer-events-none animate-fade-in select-none font-mono text-[8rem] font-semibold leading-none tracking-tighter text-transparent sm:text-[11rem]"
          style={{
            WebkitTextStroke: '1.5px rgb(var(--color-brand-gold-500) / 0.55)',
          }}
        >
          {code}
        </p>

        <div className="relative -mt-10 w-full animate-slide-up rounded-xl border border-border bg-surface/90 px-8 py-8 shadow-lg backdrop-blur-md sm:-mt-14">
          <CornerBrackets />
          <div className="flex flex-col items-center gap-4">
            <span
              aria-hidden="true"
              className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-gold-50 text-brand-gold-700 ring-4 ring-brand-gold-50/50"
            >
              {icon}
            </span>
            <p className="font-mono text-2xs uppercase tracking-[0.22em] text-brand-gold-700">
              {label}
            </p>
            <h1 className="font-display text-2xl font-semibold text-ink sm:text-3xl">{title}</h1>
            <p className="max-w-md text-sm text-ink-soft">{description}</p>
            <div className="mt-2 flex flex-wrap items-center justify-center gap-2">{actions}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
