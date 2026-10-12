import { Fragment } from 'react';
import { useTranslation } from 'react-i18next';
import { Check, XCircle } from 'lucide-react';
import type { ReimbursementStatus } from '@falcao-erp/shared-types';

import { REIMBURSEMENT_STATUS_LABELS } from '@/constants/enums';
import { cn } from '@/utils/cn';
import { REIMBURSEMENT_PIPELINE } from '../lib/status';

/** Enviado → aprovado → pago; rejeitado vira um aviso no lugar do fluxo. */
export function ReimbursementStepper({ status }: { status: ReimbursementStatus }) {
  const { t } = useTranslation('reimbursements');

  if (status === 'REJEITADO') {
    return (
      <div className="flex items-center gap-2 rounded-md bg-danger/10 px-3 py-2 text-sm text-danger">
        <XCircle className="h-4 w-4" aria-hidden="true" />
        {t('reimbursements:stepper.rejected')}
      </div>
    );
  }

  const currentIndex = REIMBURSEMENT_PIPELINE.indexOf(status);
  return (
    <nav aria-label={t('reimbursements:stepper.ariaLabel')}>
      <ol className="flex items-start">
        {REIMBURSEMENT_PIPELINE.map((step, idx) => {
          const isDone = idx < currentIndex || status === 'PAGO';
          const isCurrent = idx === currentIndex && status !== 'PAGO';
          return (
            <Fragment key={step}>
              <li
                className="flex w-28 shrink-0 animate-fade-in flex-col items-center gap-2 text-center"
                style={{ animationDelay: `${idx * 80}ms`, animationFillMode: 'backwards' }}
                aria-current={isCurrent ? 'step' : undefined}
              >
                <span
                  className={cn(
                    'flex h-8 w-8 items-center justify-center rounded-full border-2 font-mono text-xs font-semibold',
                    isDone && 'border-brand-gold-500 bg-brand-gold-500 text-neutral-0',
                    isCurrent && 'border-brand-gold-500 bg-brand-gold-50 text-brand-gold-700',
                    !isDone && !isCurrent && 'border-border text-ink-soft',
                  )}
                >
                  {isDone ? <Check className="h-4 w-4" aria-hidden="true" /> : idx + 1}
                </span>
                <span
                  className={cn(
                    'text-xs font-medium',
                    isDone || isCurrent ? 'text-ink' : 'text-ink-soft',
                  )}
                >
                  {REIMBURSEMENT_STATUS_LABELS[step]}
                </span>
              </li>
              {idx < REIMBURSEMENT_PIPELINE.length - 1 && (
                <li aria-hidden="true" className="mt-4 h-0.5 flex-1">
                  <span
                    className={cn(
                      'block h-full origin-left',
                      idx < currentIndex || status === 'PAGO'
                        ? 'animate-grow-x bg-brand-gold-500'
                        : 'border-t-2 border-dashed border-border',
                    )}
                  />
                </li>
              )}
            </Fragment>
          );
        })}
      </ol>
    </nav>
  );
}
