import type { ContractStatus, DeadlineState } from '@falcao-erp/shared-types';
import type { BadgeVariant } from '@/components/ui/Badge';
import type { ButtonVariant } from '@/components/ui/Button';

export const CONTRACT_STATUS_BADGE: Record<ContractStatus, BadgeVariant> = {
  VIGENTE: 'success',
  SUSPENSO: 'warning',
  ENCERRADO: 'neutral',
  CANCELADO: 'danger',
};

export const DEADLINE_BADGE: Record<DeadlineState, BadgeVariant> = {
  OK: 'outline',
  VENCENDO: 'warning',
  VENCIDO: 'danger',
};

export interface ContractStatusAction {
  target: ContractStatus;
  /** Chave em `contracts:statusActions.*`. */
  labelKey: string;
  variant: ButtonVariant;
  /** Encerrar/cancelar congela o contrato — pede confirmação. */
  confirm: boolean;
}

/** Espelha `ALLOWED_STATUS_CHANGES` do `ContractsService` da API. */
export const CONTRACT_STATUS_ACTIONS: Record<ContractStatus, ContractStatusAction[]> = {
  VIGENTE: [
    { target: 'SUSPENSO', labelKey: 'suspend', variant: 'outline', confirm: false },
    { target: 'ENCERRADO', labelKey: 'close', variant: 'outline', confirm: true },
    { target: 'CANCELADO', labelKey: 'cancel', variant: 'danger', confirm: true },
  ],
  SUSPENSO: [
    { target: 'VIGENTE', labelKey: 'resume', variant: 'primary', confirm: false },
    { target: 'ENCERRADO', labelKey: 'close', variant: 'outline', confirm: true },
    { target: 'CANCELADO', labelKey: 'cancel', variant: 'danger', confirm: true },
  ],
  ENCERRADO: [],
  CANCELADO: [],
};

export const isContractEditable = (status: ContractStatus) =>
  status === 'VIGENTE' || status === 'SUSPENSO';
