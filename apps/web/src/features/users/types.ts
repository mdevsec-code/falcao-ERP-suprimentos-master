import { z } from 'zod';
import { Role, type UserSummaryDto } from '@falcao-erp/shared-types';

import i18n from '@/i18n';
import { emailSchema, newPasswordSchema, requiredText } from '@/validators/common';

export type { UserSummaryDto, UserStatsDto } from '@falcao-erp/shared-types';

export interface UserListParams {
  page?: number;
  pageSize?: number;
  search?: string;
  role?: Role;
  isActive?: boolean;
}

export interface UserFilters {
  busca?: string;
  role?: Role;
  status?: 'active' | 'inactive';
}

const roleSchema = z.nativeEnum(Role, {
  errorMap: () => ({ message: i18n.t('validation:selectOption') }),
});

/** Criação: e-mail e senha inicial são obrigatórios. */
export const createUserSchema = z.object({
  name: requiredText(3, 120),
  email: emailSchema,
  role: roleSchema,
  password: newPasswordSchema,
});

/** Edição: e-mail é fixo (é o login); senha muda pelo diálogo de redefinição. */
export const editUserSchema = z.object({
  name: requiredText(3, 120),
  role: roleSchema,
  isActive: z.boolean(),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type EditUserInput = z.infer<typeof editUserSchema>;

export function toEditInput(user: UserSummaryDto): EditUserInput {
  return { name: user.name, role: user.role, isActive: user.isActive };
}

/** Confirmação de senha — usada na redefinição (admin) e na troca (perfil). */
export function withPasswordConfirmation<T extends z.ZodRawShape>(shape: T, passwordField: string) {
  return z
    .object({ ...shape, confirmPassword: z.string() })
    .refine((data) => (data as Record<string, unknown>)[passwordField] === data.confirmPassword, {
      message: i18n.t('validation:passwordMismatch'),
      path: ['confirmPassword'],
    });
}

export const resetPasswordSchema = withPasswordConfirmation(
  { password: newPasswordSchema },
  'password',
);
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
