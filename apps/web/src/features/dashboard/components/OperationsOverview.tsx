import { type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  AlarmClock,
  ArrowRight,
  CalendarClock,
  CalendarDays,
  ChevronRight,
  Hourglass,
  ReceiptText,
  Wallet,
  type LucideIcon,
} from 'lucide-react';
import { addDays, toDateOnly } from '@falcao-erp/shared-types';

import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useContractStats } from '@/features/contracts/hooks/useContracts';
import { usePayableStats } from '@/features/finance/hooks/useFinance';
import { useReimbursementStats } from '@/features/reimbursements/hooks/useReimbursements';
import { useAgenda } from '@/features/agenda/hooks/useAgenda';
import { AgendaItemCard } from '@/features/agenda/components/AgendaItemCard';
import { itemDay } from '@/features/agenda/types';
import { PERMISSIONS } from '@/constants/permissions';
import { ROUTE_PATHS } from '@/constants/routes';
import { formatCurrencyBRL, parseDateOnly } from '@/utils/format';
import { getIntlLocale } from '@/utils/locale';
import { cn } from '@/utils/cn';

const AGENDA_DAYS = 7;
const AGENDA_LIMIT = 6;

interface PendingRow {
  id: string;
  icon: LucideIcon;
  label: string;
  value: ReactNode;
  hint?: string;
  to: string;
  /** Destaca quando há algo exigindo ação. */
  alert: boolean;
}

/**
 * Pendências de contratos, financeiro e reembolsos + os próximos dias da
 * agenda. Cada linha só aparece (e só consulta a API) para quem pode ver o
 * módulo de origem.
 */
export function OperationsOverview() {
  const { t } = useTranslation('dashboard');
  const { can } = useAuth();
  const canContracts = can(PERMISSIONS.CONTRACT_READ);
  const canFinance = can(PERMISSIONS.FINANCE_READ);
  const canDecide = can(PERMISSIONS.REIMBURSEMENT_DECIDE);

  const contracts = useContractStats(canContracts);
  const payables = usePayableStats(canFinance);
  const reimbursements = useReimbursementStats();
  const today = toDateOnly();
  const agenda = useAgenda(today, addDays(today, AGENDA_DAYS));

  const rows: PendingRow[] = [];
  if (canContracts && contracts.data) {
    rows.push({
      id: 'contracts',
      icon: AlarmClock,
      label: t('dashboard:operations.contractsExpiring'),
      value: contracts.data.vencendo,
      hint:
        contracts.data.vencidos > 0
          ? t('dashboard:operations.contractsExpired', { count: contracts.data.vencidos })
          : undefined,
      to: ROUTE_PATHS.CONTRATOS,
      alert: contracts.data.vencendo + contracts.data.vencidos > 0,
    });
  }
  if (canFinance && payables.data) {
    rows.push({
      id: 'overdue',
      icon: Wallet,
      label: t('dashboard:operations.payablesOverdue'),
      value: formatCurrencyBRL(payables.data.vencido),
      hint: t('dashboard:operations.bills', { count: payables.data.vencidoCount }),
      to: ROUTE_PATHS.FINANCEIRO,
      alert: payables.data.vencidoCount > 0,
    });
    rows.push({
      id: 'next7',
      icon: CalendarClock,
      label: t('dashboard:operations.payablesNext7'),
      value: formatCurrencyBRL(payables.data.proximos7Dias),
      hint: t('dashboard:operations.bills', { count: payables.data.proximos7DiasCount }),
      to: ROUTE_PATHS.FINANCEIRO,
      alert: false,
    });
  }
  if (reimbursements.data) {
    const open = reimbursements.data.byStatus.find((row) => row.status === 'ENVIADO');
    rows.push(
      canDecide
        ? {
            id: 'reimbursements',
            icon: Hourglass,
            label: t('dashboard:operations.reimbursementsToDecide'),
            value: reimbursements.data.pendingMyDecision,
            to: ROUTE_PATHS.REEMBOLSOS,
            alert: reimbursements.data.pendingMyDecision > 0,
          }
        : {
            id: 'reimbursements',
            icon: ReceiptText,
            label: t('dashboard:operations.myReimbursementsOpen'),
            value: open?.count ?? 0,
            hint: open ? formatCurrencyBRL(open.total) : undefined,
            to: ROUTE_PATHS.REEMBOLSOS,
            alert: false,
          },
    );
  }

  const pendingLoading =
    (canContracts && contracts.isLoading) ||
    (canFinance && payables.isLoading) ||
    reimbursements.isLoading;

  const upcoming = (agenda.data ?? [])
    .filter((item) => itemDay(item) >= today)
    .slice(0, AGENDA_LIMIT);
  const dayLabel = (day: string) =>
    day === today
      ? t('dashboard:operations.today')
      : new Intl.DateTimeFormat(getIntlLocale(), {
          weekday: 'short',
          day: '2-digit',
          month: '2-digit',
        }).format(parseDateOnly(day));

  return (
    <section className="grid grid-cols-1 gap-6 xl:grid-cols-[2fr_3fr]">
      <Card className="animate-slide-up">
        <CardHeader>
          <CardTitle>{t('dashboard:operations.pendingTitle')}</CardTitle>
          <CardDescription>{t('dashboard:operations.pendingDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          {pendingLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, idx) => (
                <Skeleton key={idx} className="h-14 w-full" />
              ))}
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {rows.map((row) => (
                <li key={row.id}>
                  <Link
                    to={row.to}
                    className="group flex items-center gap-3 rounded-md px-2 py-3 transition-colors duration-fast hover:bg-hover focus:outline-none focus-visible:shadow-focus"
                  >
                    <span
                      className={cn(
                        'flex h-9 w-9 shrink-0 items-center justify-center rounded-md',
                        row.alert
                          ? 'bg-warning/15 text-warning'
                          : 'bg-brand-gold-50 text-brand-gold-700',
                      )}
                      aria-hidden="true"
                    >
                      <row.icon className="h-4 w-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm text-ink">{row.label}</span>
                      {row.hint && <span className="block text-xs text-ink-soft">{row.hint}</span>}
                    </span>
                    <span className="font-display text-xl font-semibold tabular-nums text-ink">
                      {row.value}
                    </span>
                    <ChevronRight
                      className="h-4 w-4 text-ink-soft transition-transform duration-fast group-hover:translate-x-0.5 group-hover:text-brand-gold-700"
                      aria-hidden="true"
                    />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card className="animate-slide-up" style={{ animationDelay: '60ms' }}>
        <CardHeader className="flex-row items-start justify-between gap-3 space-y-0">
          <div className="space-y-1">
            <CardTitle>{t('dashboard:operations.agendaTitle', { count: AGENDA_DAYS })}</CardTitle>
            <CardDescription>{t('dashboard:operations.agendaDescription')}</CardDescription>
          </div>
          <Button
            asChild
            variant="outline"
            size="sm"
            rightIcon={<ArrowRight className="h-3.5 w-3.5" />}
          >
            <Link to={ROUTE_PATHS.AGENDA}>{t('dashboard:operations.openAgenda')}</Link>
          </Button>
        </CardHeader>
        <CardContent>
          {agenda.isLoading ? (
            <Skeleton className="h-48 w-full" />
          ) : upcoming.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-10 text-center text-sm text-ink-soft">
              <CalendarDays className="h-6 w-6" aria-hidden="true" />
              {t('dashboard:operations.agendaEmpty')}
            </div>
          ) : (
            <ol className="space-y-2">
              {upcoming.map((item, idx) => (
                <li key={item.key} className="grid grid-cols-[5.5rem_1fr] items-start gap-3">
                  <span className="pt-3 font-mono text-2xs uppercase tracking-[0.12em] text-brand-gold-700">
                    {dayLabel(itemDay(item))}
                  </span>
                  <AgendaItemCard
                    item={item}
                    canEdit={false}
                    onEdit={() => undefined}
                    style={{ animationDelay: `${idx * 40}ms` }}
                  />
                </li>
              ))}
            </ol>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
