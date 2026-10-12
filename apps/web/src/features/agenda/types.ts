import { z } from 'zod';
import type { AgendaEventType, AgendaItemDto } from '@falcao-erp/shared-types';

import i18n from '@/i18n';
import { dateOnlySchema, emptyToUndefined, optionalText, requiredText } from '@/validators/common';
import { toDateOnly } from '@falcao-erp/shared-types';

export type { AgendaItemDto, AgendaItemKind } from '@falcao-erp/shared-types';

const TIME = /^\d{2}:\d{2}$/;

export const agendaEventFormSchema = z
  .object({
    titulo: requiredText(2, 180),
    tipo: z.string().min(1, i18n.t('validation:selectOption')),
    data: dateOnlySchema,
    diaInteiro: z.boolean(),
    horaInicio: z.string(),
    horaFim: z.string(),
    obra: optionalText(60),
    local: optionalText(180),
    supplierId: z.string().optional(),
    descricao: optionalText(2000),
  })
  .superRefine((v, ctx) => {
    if (v.diaInteiro) return;
    if (!TIME.test(v.horaInicio)) {
      ctx.addIssue({
        code: 'custom',
        path: ['horaInicio'],
        message: i18n.t('validation:required'),
      });
    }
    if (v.horaFim && TIME.test(v.horaInicio) && v.horaFim < v.horaInicio) {
      ctx.addIssue({ code: 'custom', path: ['horaFim'], message: i18n.t('validation:timeOrder') });
    }
  });

export type AgendaEventFormInput = z.infer<typeof agendaEventFormSchema>;

/** Corpo de `POST/PATCH /agenda/events` — horários em ISO (UTC), montados no fuso local. */
export interface AgendaEventPayload {
  titulo: string;
  tipo: AgendaEventType;
  inicio: string;
  fim: string | null;
  diaInteiro: boolean;
  obra?: string;
  local?: string;
  supplierId?: string;
  descricao?: string;
}

function localIso(date: string, time: string): string {
  const [y, m, d] = date.split('-').map(Number) as [number, number, number];
  const [h, min] = time.split(':').map(Number) as [number, number];
  return new Date(y, m - 1, d, h, min).toISOString();
}

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

export function emptyEventForm(date?: string): AgendaEventFormInput {
  return {
    titulo: '',
    tipo: '',
    data: date ?? toDateOnly(),
    diaInteiro: false,
    horaInicio: '09:00',
    horaFim: '10:00',
    obra: '',
    local: '',
    supplierId: '',
    descricao: '',
  };
}

export function toEventForm(item: AgendaItemDto): AgendaEventFormInput {
  const start = new Date(item.inicio);
  const end = item.fim ? new Date(item.fim) : null;
  return {
    titulo: item.titulo,
    tipo: item.tipo ?? '',
    data: toDateOnly(start),
    diaInteiro: item.diaInteiro,
    horaInicio: `${pad(start.getHours())}:${pad(start.getMinutes())}`,
    horaFim: end ? `${pad(end.getHours())}:${pad(end.getMinutes())}` : '',
    obra: item.obra ?? '',
    local: item.local ?? '',
    supplierId: item.supplierId ?? '',
    descricao: item.descricao ?? '',
  };
}

export function fromEventForm(input: AgendaEventFormInput): AgendaEventPayload {
  return {
    titulo: input.titulo,
    tipo: input.tipo as AgendaEventType,
    diaInteiro: input.diaInteiro,
    inicio: localIso(input.data, input.diaInteiro ? '00:00' : input.horaInicio),
    fim: !input.diaInteiro && input.horaFim ? localIso(input.data, input.horaFim) : null,
    obra: emptyToUndefined(input.obra),
    local: emptyToUndefined(input.local),
    supplierId: emptyToUndefined(input.supplierId),
    descricao: emptyToUndefined(input.descricao),
  };
}

/** Data local (`YYYY-MM-DD`) em que o item aparece no calendário. */
export function itemDay(item: AgendaItemDto): string {
  return item.inicio.length === 10 ? item.inicio : toDateOnly(new Date(item.inicio));
}
