import type { AgendaItemDto } from '@falcao-erp/shared-types';
import { httpClient } from '@/services/http/client';
import type { AgendaEventPayload } from '../types';

export const agendaApi = {
  async list(params: { from: string; to: string; obra?: string }): Promise<AgendaItemDto[]> {
    const { data } = await httpClient.get<AgendaItemDto[]>('/agenda', { params });
    return data;
  },

  async obras(): Promise<string[]> {
    const { data } = await httpClient.get<string[]>('/agenda/obras');
    return data;
  },

  async createEvent(input: AgendaEventPayload): Promise<AgendaItemDto> {
    const { data } = await httpClient.post<AgendaItemDto>('/agenda/events', input);
    return data;
  },

  async updateEvent(id: string, input: AgendaEventPayload): Promise<AgendaItemDto> {
    const { data } = await httpClient.patch<AgendaItemDto>(`/agenda/events/${id}`, input);
    return data;
  },

  async deleteEvent(id: string): Promise<void> {
    await httpClient.delete(`/agenda/events/${id}`);
  },
};
