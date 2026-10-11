import { Role as SharedRole } from '@falcao-erp/shared-types';
import { createTranslatedLabels } from '@/utils/i18nLabels';

/**
 * Perfis de acesso da plataforma Falcão Suprimentos. Os valores vêm de
 * `@falcao-erp/shared-types` — a mesma fonte usada pelos guards da API.
 */
export const ROLES = SharedRole;

export type Role = (typeof ROLES)[keyof typeof ROLES];

/** Rótulos traduzidos (`enums:roles.*`) — acompanham o idioma ativo. */
export const ROLE_LABELS: Record<Role, string> = createTranslatedLabels<Role>('roles');

export const ALL_ROLES: Role[] = Object.values(ROLES);
