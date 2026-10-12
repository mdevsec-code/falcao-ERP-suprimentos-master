import { useTranslation } from 'react-i18next';
import { toDateOnly } from '@falcao-erp/shared-types';

import { getIntlLocale } from '@/utils/locale';
import { cn } from '@/utils/cn';
import { KIND_STYLE } from '../lib/kinds';
import { monthGrid, weekdayLabels } from '../lib/calendar';
import type { AgendaItemDto } from '../types';

const MAX_PER_DAY = 3;

interface MonthGridProps {
  month: string;
  itemsByDay: ReadonlyMap<string, AgendaItemDto[]>;
  selectedDay: string;
  onSelectDay: (day: string) => void;
}

/**
 * Calendário mensal no traço da "planta técnica": grade fina, números em
 * mono, hoje marcado com cantoneira dourada e itens como etiquetas.
 */
export function MonthGrid({ month, itemsByDay, selectedDay, onSelectDay }: MonthGridProps) {
  const { t } = useTranslation('agenda');
  const locale = getIntlLocale();
  const today = toDateOnly();
  const days = monthGrid(month);
  const currentMonth = month.slice(0, 7);

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-surface">
      <div className="grid grid-cols-7 border-b border-border bg-brand-gold-50/60">
        {weekdayLabels(locale).map((label) => (
          <div
            key={label}
            className="px-2 py-2 text-center font-mono text-2xs uppercase tracking-[0.14em] text-ink-soft"
          >
            {label}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {days.map((day, idx) => {
          const items = itemsByDay.get(day) ?? [];
          const inMonth = day.startsWith(currentMonth);
          const isToday = day === today;
          const isSelected = day === selectedDay;
          return (
            <button
              key={day}
              type="button"
              onClick={() => onSelectDay(day)}
              aria-pressed={isSelected}
              aria-label={t('agenda:grid.dayAria', {
                date: new Intl.DateTimeFormat(locale, { dateStyle: 'full' }).format(
                  new Date(`${day}T12:00:00`),
                ),
                count: items.length,
              })}
              className={cn(
                'relative flex min-h-[5.5rem] flex-col gap-1 border-b border-r border-border p-1.5 text-left transition-colors duration-fast sm:min-h-[7rem]',
                'focus:outline-none focus-visible:z-10 focus-visible:shadow-focus',
                idx % 7 === 6 && 'border-r-0',
                idx >= 35 && 'border-b-0',
                inMonth ? 'bg-surface hover:bg-hover' : 'bg-bg/60 text-muted hover:bg-hover',
                isSelected && 'bg-brand-gold-50/70 hover:bg-brand-gold-50',
              )}
            >
              {isToday && (
                <>
                  <span className="pointer-events-none absolute left-0.5 top-0.5 h-2.5 w-2.5 border-l-2 border-t-2 border-brand-gold-500" />
                  <span className="pointer-events-none absolute bottom-0.5 right-0.5 h-2.5 w-2.5 border-b-2 border-r-2 border-brand-gold-500" />
                </>
              )}
              <span
                className={cn(
                  'self-end font-mono text-xs tabular-nums',
                  isToday
                    ? 'rounded-sm bg-brand-gold-500 px-1 font-semibold text-neutral-0'
                    : inMonth
                      ? 'text-ink'
                      : 'text-muted',
                )}
              >
                {Number(day.slice(8))}
              </span>
              <span className="flex min-w-0 flex-col gap-0.5">
                {items.slice(0, MAX_PER_DAY).map((item) => {
                  const style = KIND_STYLE[item.kind];
                  const Icon = style.icon;
                  return (
                    <span
                      key={item.key}
                      className={cn(
                        'hidden items-center gap-1 truncate rounded-sm border px-1 py-px text-[10px] leading-4 sm:flex',
                        style.className,
                      )}
                    >
                      <Icon className="h-2.5 w-2.5 shrink-0" aria-hidden="true" />
                      <span className="truncate">{item.titulo}</span>
                    </span>
                  );
                })}
                {/* No celular, só pontinhos por tipo. */}
                {items.length > 0 && (
                  <span className="flex flex-wrap gap-0.5 sm:hidden" aria-hidden="true">
                    {items.slice(0, 6).map((item) => (
                      <span
                        key={item.key}
                        className={cn('h-1.5 w-1.5 rounded-full', KIND_STYLE[item.kind].dot)}
                      />
                    ))}
                  </span>
                )}
                {items.length > MAX_PER_DAY && (
                  <span className="hidden px-1 font-mono text-[10px] text-ink-soft sm:block">
                    {t('agenda:grid.more', { count: items.length - MAX_PER_DAY })}
                  </span>
                )}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
