import { z } from 'zod';
import { emailSchema, loginPasswordSchema } from '@/validators/common';

export { ROLES, ROLE_LABELS, ALL_ROLES, type Role } from '@/constants/roles';
export type { AuthSession, User } from '@/types/auth';

export const loginSchema = z.object({
  email: emailSchema,
  password: loginPasswordSchema,
  rememberMe: z.boolean().default(true),
});

export type LoginInput = z.infer<typeof loginSchema>;
