import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CalendarDays, CalendarPlus, ChevronLeft, ChevronRight, List, Plus } from 'lucide-react';
import { addDays, toDateOnly, type AgendaItemKind } from '@falcao-erp/shared-types';

import { PageHeader } from '@/components/layout/PageHeader';
import { EmptyState } from '@/components/feedback/EmptyState';
import { ErrorState } from '@/components/feedback/ErrorState';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { SelectField } from '@/components/common/SelectField';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { AGENDA_ITEM_KIND_LABELS } from '@/constants/enums';
import { PERMISSIONS } from '@/constants/permissions';
import { getIntlLocale } from '@/utils/locale';
import { parseDateOnly } from '@/utils/format';
import { cn } from '@/utils/cn';

import { useAgenda, useObras } from '../hooks/useAgenda';
import { useCreateEvent, useDeleteEvent, useUpdateEvent } from '../hooks/useAgendaMutations';
import { MonthGrid } from '../components/MonthGrid';
import { AgendaItemCard } from '../components/AgendaItemCard';
import { EventDialog } from '../components/EventDialog';
import { ALL_KINDS, KIND_STYLE } from '../lib/kinds';
import { monthGrid, monthStart, monthTitle, shiftMonth } from '../lib/calendar';
import { fromEventForm, itemDay, type AgendaEventFormInput, type AgendaItemDto } from '../types';

const LIST_DAYS = 30;

type View = 'month' | 'list';

export function AgendaPage() {
  const { t } = useTranslation('agenda');
  const { can, user } = useAuth();
  const locale = getIntlLocale();
  const today = toDateOnly();
  const canWrite = can(PERMISSIONS.AGENDA_WRITE);
  const canManage = can(PERMISSIONS.AGENDA_MANAGE);

  const [view, setView] = useState<View>('month');
  const [month, setMonth] = useState(monthStart(today));
  const [selectedDay, setSelectedDay] = useState(today);
  const [obra, setObra] = useState('');
  const [hiddenKinds, setHiddenKinds] = useState<ReadonlySet<AgendaItemKind>>(new Set());

  const grid = monthGrid(month);
  const [from, to] =
    view === 'month' ? [grid[0] as string, grid[41] as string] : [today, addDays(today, LIST_DAYS)];
  const agenda = useAgenda(from, to, obra);
  const obras = useObras();

  const createEvent = useCreateEvent();
  const updateEvent = useUpdateEvent();
  const deleteEvent = useDeleteEvent();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<AgendaItemDto | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const itemsByDay = useMemo(() => {
    const map = new Map<string, AgendaItemDto[]>();
    for (const item of agenda.data ?? []) {
      if (hiddenKinds.has(item.kind)) continue;
      const day = itemDay(item);
      if (day < from || day > to) continue;
      map.set(day, [...(map.get(day) ?? []), item]);
    }
    // Dentro do dia: dia inteiro primeiro, depois por horário.
    for (const items of map.values()) {
      items.sort((a, b) =>
        a.diaInteiro === b.diaInteiro ? a.inicio.localeCompare(b.inicio) : a.diaInteiro ? -1 : 1,
      );
    }
    return map;
  }, [agenda.data, hiddenKinds, from, to]);

  const countsByKind = useMemo(() => {
    const counts = new Map<AgendaItemKind, number>();
    for (const item of agenda.data ?? []) {
      const day = itemDay(item);
      if (day < from || day > to) continue;
      counts.set(item.kind, (counts.get(item.kind) ?? 0) + 1);
    }
    return counts;
  }, [agenda.data, from, to]);

  // Prazos de contas/contratos só existem para quem consulta esses módulos (a API já filtra).
  const visibleKinds = ALL_KINDS.filter(
    (kind) =>
      (kind !== 'PAYABLE_DUE' || can(PERMISSIONS.FINANCE_READ)) &&
      (kind !== 'CONTRACT_END' || can(PERMISSIONS.CONTRACT_READ)),
  );

  const canEditItem = (item: AgendaItemDto) =>
    canWrite && (canManage || item.createdById === user?.id);

  function toggleKind(kind: AgendaItemKind) {
    setHiddenKinds((prev) => {
      const next = new Set(prev);
      if (next.has(kind)) next.delete(kind);
      else next.add(kind);
      return next;
    });
  }

  function goToMonth(delta: number) {
    const next = shiftMonth(month, delta);
    setMonth(next);
    setSelectedDay(next.slice(0, 7) === today.slice(0, 7) ? today : next);
  }

  function goToday() {
    setMonth(monthStart(today));
    setSelectedDay(today);
  }

  function openCreate() {
    setEditing(null);
    setDialogOpen(true);
  }

  function openEdit(item: AgendaItemDto) {
    setEditing(item);
    setDialogOpen(true);
  }

  function handleSubmit(values: AgendaEventFormInput) {
    const input = fromEventForm(values);
    const close = { onSuccess: () => setDialogOpen(false) };
    if (editing) updateEvent.mutate({ id: editing.sourceId, input }, close);
    else createEvent.mutate(input, close);
  }

  const dayLabel = (day: string) =>
    new Intl.DateTimeFormat(locale, { weekday: 'long', day: 'numeric', month: 'long' }).format(
      parseDateOnly(day),
    );

  const selectedItems = itemsByDay.get(selectedDay) ?? [];
  const listDays = [...itemsByDay.keys()].sort();

  return (
    <>
      <PageHeader
        eyebrow={t('agenda:page.eyebrow')}
        title={t('agenda:page.title')}
        description={t('agenda:page.description')}
        actions={
          canWrite ? (
            <Button variant="primary" leftIcon={<Plus className="h-4 w-4" />} onClick={openCreate}>
              {t('agenda:actions.new')}
            </Button>
          ) : null
        }
      />

      <div className="space-y-6 px-6 py-8 sm:px-8">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <Tabs value={view} onValueChange={(v) => setView(v as View)}>
              <TabsList>
                <TabsTrigger value="month" className="gap-1.5">
                  <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />
                  {t('agenda:view.month')}
                </TabsTrigger>
                <TabsTrigger value="list" className="gap-1.5">
                  <List className="h-3.5 w-3.5" aria-hidden="true" />
                  {t('agenda:view.list')}
                </TabsTrigger>
              </TabsList>
            </Tabs>
            {view === 'month' && (
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-9 w-9"
                  aria-label={t('agenda:nav.previous')}
                  onClick={() => goToMonth(-1)}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={goToday}>
                  {t('agenda:nav.today')}
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-9 w-9"
                  aria-label={t('agenda:nav.next')}
                  onClick={() => goToMonth(1)}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <h2 className="ml-2 font-display text-xl font-semibold text-ink" aria-live="polite">
                  {monthTitle(month, locale)}
                </h2>
              </div>
            )}
          </div>
          <div className="w-full sm:w-64">
            <SelectField
              id="agenda-obra"
              label={t('agenda:filters.obra')}
              noneLabel={t('agenda:filters.allObras')}
              value={obra}
              onChange={setObra}
              options={(obras.data ?? []).map((value) => ({ value, label: value }))}
              hint={obra ? t('agenda:filters.obraHint') : undefined}
            />
          </div>
        </div>

        {/* Legenda que também filtra os tipos. */}
        <div
          className="flex flex-wrap gap-2"
          role="group"
          aria-label={t('agenda:legend.ariaLabel')}
        >
          {visibleKinds.map((kind) => {
            const style = KIND_STYLE[kind];
            const Icon = style.icon;
            const hidden = hiddenKinds.has(kind);
            return (
              <button
                key={kind}
                type="button"
                aria-pressed={!hidden}
                onClick={() => toggleKind(kind)}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-all duration-fast focus:outline-none focus-visible:shadow-focus',
                  hidden ? 'border-dashed border-border text-muted line-through' : style.className,
                )}
              >
                <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                {AGENDA_ITEM_KIND_LABELS[kind]}
                <span className="font-mono opacity-70">{countsByKind.get(kind) ?? 0}</span>
              </button>
            );
          })}
        </div>

        {agenda.isError && (
          <ErrorState
            title={t('agenda:error.title')}
            description={t('agenda:error.description')}
            action={
              <Button variant="outline" onClick={() => void agenda.refetch()}>
                {t('common:actions.retry')}
              </Button>
            }
          />
        )}

        {view === 'month' && !agenda.isError && (
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_22rem]">
            <div
              className={cn('transition-opacity duration-base', agenda.isFetching && 'opacity-70')}
            >
              {agenda.isLoading ? (
                <Skeleton className="h-[640px] w-full" />
              ) : (
                <MonthGrid
                  month={month}
                  itemsByDay={itemsByDay}
                  selectedDay={selectedDay}
                  onSelectDay={setSelectedDay}
                />
              )}
            </div>

            <Card className="self-start xl:sticky xl:top-4">
              <CardHeader className="flex-row items-start justify-between gap-2 space-y-0">
                <div>
                  <p className="font-mono text-2xs uppercase tracking-[0.14em] text-brand-gold-700">
                    {selectedDay === today ? t('agenda:day.today') : t('agenda:day.selected')}
                  </p>
                  <CardTitle className="mt-1 text-base first-letter:uppercase">
                    {dayLabel(selectedDay)}
                  </CardTitle>
                </div>
                {canWrite && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    aria-label={t('agenda:day.addEvent')}
                    onClick={openCreate}
                  >
                    <CalendarPlus className="h-4 w-4" />
                  </Button>
                )}
              </CardHeader>
              <CardContent className="space-y-2">
                {selectedItems.length === 0 ? (
                  <p className="py-6 text-center text-sm text-ink-soft">{t('agenda:day.empty')}</p>
                ) : (
                  selectedItems.map((item, idx) => (
                    <AgendaItemCard
                      key={item.key}
                      item={item}
                      canEdit={canEditItem(item)}
                      onEdit={openEdit}
                      style={{ animationDelay: `${idx * 40}ms` }}
                    />
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {view === 'list' && !agenda.isError && (
          <div className="space-y-6">
            <p className="text-sm text-ink-soft">{t('agenda:list.range', { count: LIST_DAYS })}</p>
            {agenda.isLoading && <Skeleton className="h-64 w-full" />}
            {agenda.data && listDays.length === 0 && (
              <EmptyState
                icon={<CalendarDays className="h-6 w-6" />}
                title={t('agenda:list.emptyTitle')}
                description={t('agenda:list.emptyDescription')}
              />
            )}
            <ol className="space-y-6">
              {listDays.map((day) => (
                <li key={day} className="grid grid-cols-1 gap-3 sm:grid-cols-[10rem_1fr]">
                  <div className="sm:sticky sm:top-4 sm:self-start">
                    <p className="font-mono text-2xs uppercase tracking-[0.14em] text-brand-gold-700">
                      {day === today ? t('agenda:day.today') : day.slice(8)}
                    </p>
                    <p className="font-display text-lg font-semibold text-ink first-letter:uppercase">
                      {dayLabel(day)}
                    </p>
                  </div>
                  <div className="space-y-2 border-l border-dashed border-border pl-4">
                    {(itemsByDay.get(day) ?? []).map((item, idx) => (
                      <AgendaItemCard
                        key={item.key}
                        item={item}
                        canEdit={canEditItem(item)}
                        onEdit={openEdit}
                        style={{ animationDelay: `${idx * 40}ms` }}
                      />
                    ))}
                  </div>
                </li>
              ))}
            </ol>
          </div>
        )}
      </div>

      <EventDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        event={editing}
        defaultDate={selectedDay}
        isSubmitting={createEvent.isPending || updateEvent.isPending}
        onSubmit={handleSubmit}
        onDelete={editing ? () => setConfirmDelete(true) : undefined}
      />

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title={t('agenda:confirm.deleteTitle')}
        description={t('agenda:confirm.deleteDescription', { title: editing?.titulo ?? '' })}
        destructive
        confirmLabel={t('agenda:dialog.delete')}
        isSubmitting={deleteEvent.isPending}
        onConfirm={() =>
          editing &&
          deleteEvent.mutate(editing.sourceId, {
            onSuccess: () => {
              setConfirmDelete(false);
              setDialogOpen(false);
            },
          })
        }
      />
    </>
  );
}

export default AgendaPage;
