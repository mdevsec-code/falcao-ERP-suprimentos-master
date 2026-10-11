import { Fragment } from 'react';
import { useTranslation } from 'react-i18next';
import { Check, XCircle } from 'lucide-react';
import { PURCHASE_REQUEST_PIPELINE, type PurchaseRequestStatus } from '@falcao-erp/shared-types';

import { PURCHASE_REQUEST_STATUS_LABELS } from '@/constants/enums';
import { cn } from '@/utils/cn';

interface StatusStepperProps {
  status: PurchaseRequestStatus;
}

/**
 * Trilha do fluxo da solicitação (Aprovação → … → Finalizado). Etapas já
 * vencidas em dourado com ✓, a atual pulsando suavemente; rejeitada mostra
 * um aviso no lugar da trilha.
 */
export function StatusStepper({ status }: StatusStepperProps) {
  const { t } = useTranslation('purchaseRequests');

  if (status === 'REJEITADO') {
    return (
      <div
        role="status"
        className="flex animate-fade-in items-center gap-2 rounded-md border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger"
      >
        <XCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
        {t('purchaseRequests:stepper.rejected')}
      </div>
    );
  }

  const currentIndex = PURCHASE_REQUEST_PIPELINE.indexOf(status);

  return (
    <nav
      aria-label={t('purchaseRequests:stepper.ariaLabel')}
      className="scrollbar-thin overflow-x-auto"
    >
      <ol className="flex min-w-[640px] items-start">
        {PURCHASE_REQUEST_PIPELINE.map((step, idx) => {
          const isDone = idx < currentIndex || status === 'FINALIZADO';
          const isCurrent = idx === currentIndex && status !== 'FINALIZADO';
          return (
            <Fragment key={step}>
              <li
                className="flex w-24 shrink-0 animate-fade-in flex-col items-center gap-2 text-center"
                style={{ animationDelay: `${idx * 50}ms`, animationFillMode: 'backwards' }}
                aria-current={isCurrent ? 'step' : undefined}
              >
                <span
                  className={cn(
                    'relative flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs font-semibold',
                    'transition-colors duration-base',
                    isDone && 'border-brand-gold-500 bg-brand-gold-500 text-white',
                    isCurrent && 'border-brand-gold-500 bg-brand-gold-50 text-brand-gold-900',
                    !isDone && !isCurrent && 'border-border bg-surface text-ink-soft',
                  )}
                >
                  {isCurrent && (
                    <span
                      aria-hidden="true"
                      className="absolute inset-0 animate-glow-pulse rounded-full ring-4 ring-brand-gold-300/40"
                    />
                  )}
                  {isDone ? <Check className="h-4 w-4" aria-hidden="true" /> : idx + 1}
                </span>
                <span
                  className={cn(
                    'text-2xs font-medium leading-tight',
                    isCurrent ? 'text-ink' : 'text-ink-soft',
                  )}
                >
                  {PURCHASE_REQUEST_STATUS_LABELS[step]}
                </span>
              </li>
              {idx < PURCHASE_REQUEST_PIPELINE.length - 1 && (
                <li
                  aria-hidden="true"
                  className={cn(
                    'mt-4 h-0.5 flex-1 rounded-full transition-colors duration-slow',
                    idx < currentIndex || status === 'FINALIZADO'
                      ? 'bg-brand-gold-500'
                      : 'bg-border',
                  )}
                />
              )}
            </Fragment>
          );
        })}
      </ol>
    </nav>
  );
}
