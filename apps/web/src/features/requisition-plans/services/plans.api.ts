import type {
  PaginatedResult,
  PlanCandidateRequestDto,
  RequisitionPlanDetailDto,
  RequisitionPlanStatsDto,
  RequisitionPlanStatus,
  RequisitionPlanSummaryDto,
} from '@falcao-erp/shared-types';

import { httpClient } from '@/services/http/client';

export interface PlanListParams {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: RequisitionPlanStatus;
}

/** Corpo de `POST /requisition-plans` (e do `PATCH`, parcial). */
export interface PlanPayload {
  titulo: string;
  obra?: string;
  prazoResposta: string;
  observacoes?: string;
  purchaseRequestIds: string[];
}

export const plansApi = {
  async list(params: PlanListParams): Promise<PaginatedResult<RequisitionPlanSummaryDto>> {
    const { data } = await httpClient.get<PaginatedResult<RequisitionPlanSummaryDto>>(
      '/requisition-plans',
      { params },
    );
    return data;
  },

  async stats(): Promise<RequisitionPlanStatsDto> {
    const { data } = await httpClient.get<RequisitionPlanStatsDto>('/requisition-plans/stats');
    return data;
  },

  async candidates(planId?: string): Promise<PlanCandidateRequestDto[]> {
    const { data } = await httpClient.get<PlanCandidateRequestDto[]>(
      '/requisition-plans/candidates',
      { params: { planId } },
    );
    return data;
  },

  async getById(id: string): Promise<RequisitionPlanDetailDto> {
    const { data } = await httpClient.get<RequisitionPlanDetailDto>(`/requisition-plans/${id}`);
    return data;
  },

  async create(payload: PlanPayload): Promise<RequisitionPlanDetailDto> {
    const { data } = await httpClient.post<RequisitionPlanDetailDto>('/requisition-plans', payload);
    return data;
  },

  async update(id: string, payload: Partial<PlanPayload>): Promise<RequisitionPlanDetailDto> {
    const { data } = await httpClient.patch<RequisitionPlanDetailDto>(
      `/requisition-plans/${id}`,
      payload,
    );
    return data;
  },

  async launch(id: string, supplierIds: string[]): Promise<RequisitionPlanDetailDto> {
    const { data } = await httpClient.post<RequisitionPlanDetailDto>(
      `/requisition-plans/${id}/launch`,
      { supplierIds },
    );
    return data;
  },

  async cancel(id: string): Promise<RequisitionPlanDetailDto> {
    const { data } = await httpClient.post<RequisitionPlanDetailDto>(
      `/requisition-plans/${id}/cancel`,
    );
    return data;
  },
};
