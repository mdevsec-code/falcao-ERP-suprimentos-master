import { useTranslation } from 'react-i18next';
import { daysBetween, toDateOnly, type DeadlineState } from '@falcao-erp/shared-types';
import { formatDateOnly } from '@/utils/format';
import { cn } from '@/utils/cn';

interface VigenciaBarProps {
  dataInicio: string;
  dataFim: string;
  alertaDias: number;
  prazo: DeadlineState | null;
}

/**
 * Régua da vigência no estilo "planta técnica": trilho tracejado do início
 * ao fim, trecho decorrido preenchido, faixa de alerta antes do término e o
 * marcador de hoje. Ajuda a ler "quanto falta" sem fazer conta.
 */
export function VigenciaBar({ dataInicio, dataFim, alertaDias, prazo }: VigenciaBarProps) {
  const { t } = useTranslation('contracts');
  const today = toDateOnly();
  const total = Math.max(1, daysBetween(dataInicio, dataFim));
  const elapsed = daysBetween(dataInicio, today);
  const progress = Math.min(100, Math.max(0, (elapsed / total) * 100));
  const alertStart = Math.min(100, Math.max(0, ((total - alertaDias) / total) * 100));

  return (
    <figure className="space-y-2" aria-label={t('contracts:vigencia.ariaLabel')}>
      <div className="relative h-10">
        {/* Faixa de alerta (últimos N dias). */}
        <div
          className="absolute inset-y-3 rounded-sm bg-warning/10"
          style={{ left: `${alertStart}%`, right: 0 }}
          aria-hidden="true"
        />
        {/* Trilho tracejado. */}
        <div
          className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 border-t border-dashed border-ink-soft/50"
          aria-hidden="true"
        />
        {/* Trecho decorrido. */}
        <div
          className={cn(
            'absolute left-0 top-[calc(50%-2px)] h-1 origin-left animate-grow-x rounded-full',
            prazo === 'VENCIDO' ? 'bg-danger' : 'bg-brand-gold-500',
          )}
          style={{ width: `${progress}%` }}
          aria-hidden="true"
        />
        {/* Marcas de início e fim. */}
        {[0, 100].map((pos) => (
          <span
            key={pos}
            className="absolute top-1/2 h-4 w-px -translate-y-1/2 bg-ink-soft"
            style={{ left: `${pos}%` }}
            aria-hidden="true"
          />
        ))}
        {/* Hoje. */}
        {elapsed >= 0 && elapsed <= total && (
          <span
            className="absolute top-0 flex -translate-x-1/2 flex-col items-center"
            style={{ left: `${progress}%` }}
          >
            <span className="rounded-sm bg-ink px-1 font-mono text-[9px] uppercase leading-4 tracking-wider text-bg">
              {t('contracts:vigencia.today')}
            </span>
            <span className="h-4 w-px bg-ink" aria-hidden="true" />
          </span>
        )}
      </div>
      <figcaption className="flex items-center justify-between font-mono text-2xs uppercase tracking-[0.12em] text-ink-soft">
        <span>{formatDateOnly(dataInicio)}</span>
        <span>{t('contracts:vigencia.elapsed', { percent: Math.round(progress) })}</span>
        <span>{formatDateOnly(dataFim)}</span>
      </figcaption>
    </figure>
  );
}
