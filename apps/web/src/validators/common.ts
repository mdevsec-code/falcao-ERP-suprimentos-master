import { z } from 'zod';
import { MAX_PASSWORD_LENGTH, MIN_PASSWORD_LENGTH } from '@falcao-erp/shared-types';
import i18n from '@/i18n';

/**
 * Schemas Zod compartilhados. Cada schema é exportado junto de seu
 * tipo inferido (`infer<typeof schema>`), mantendo fonte única de verdade.
 *
 * As mensagens usam o singleton `i18n` (não o hook `useTranslation`) porque
 * estes schemas são construídos uma vez, no carregamento do módulo — fora
 * de qualquer componente React. Isso resolve a mensagem no idioma ativo no
 * momento em que a tela que usa o formulário é carregada (cobre o caso real:
 * o usuário escolhe o idioma e usa o app), mas não re-traduz mensagens de
 * validação já construídas se o idioma for trocado em uma sessão já aberta
 * na mesma tela — nesse caso específico, um recarregamento da página resolve.
 */

export const emailSchema = z
  .string()
  .trim()
  .min(1, i18n.t('validation:required'))
  .email(i18n.t('validation:email'))
  .transform((s) => s.toLowerCase());

/** Login: só exige preenchimento — a política de senha é da API. */
export const loginPasswordSchema = z.string().min(1, i18n.t('validation:required'));

/** Senha nova (criação, redefinição, troca) — mesma política da API. */
export const newPasswordSchema = z
  .string()
  .min(MIN_PASSWORD_LENGTH, i18n.t('validation:minPassword', { count: MIN_PASSWORD_LENGTH }))
  .max(MAX_PASSWORD_LENGTH, i18n.t('validation:maxPassword', { count: MAX_PASSWORD_LENGTH }));

/** CNPJ com ou sem máscara (`00.000.000/0000-00`) — exige 14 dígitos. */
export const cnpjSchema = z
  .string()
  .trim()
  .min(1, i18n.t('validation:required'))
  .refine((s) => s.replace(/\D/g, '').length === 14, i18n.t('validation:cnpj'));

export const nonEmptyString = z.string().trim().min(1, i18n.t('validation:required'));

export function requiredText(min: number, max: number) {
  return z
    .string()
    .trim()
    .min(1, i18n.t('validation:required'))
    .min(min, i18n.t('validation:minLength', { count: min }))
    .max(max, i18n.t('validation:maxLength', { count: max }));
}

export function optionalText(max: number) {
  return z
    .string()
    .trim()
    .max(max, i18n.t('validation:maxLength', { count: max }))
    .optional()
    .or(z.literal(''));
}

/**
 * Número opcional vindo de `<input type="number">` (que entrega string):
 * aceita vazio (→ `''`) ou um número ≥ `min`.
 */
export function optionalNumber(min = 0) {
  return z
    .union([
      z.literal(''),
      z.coerce.number().min(min, i18n.t('validation:minValue', { count: min })),
    ])
    .optional();
}

/** Converte o valor de `optionalNumber` para o payload da API. */
export function toOptionalNumber(value: number | '' | undefined): number | undefined {
  return value === '' || value === undefined ? undefined : Number(value);
}

/** Converte `''` em `undefined` — a API rejeita strings vazias em campos opcionais. */
export function emptyToUndefined(value: string | undefined): string | undefined {
  return value === '' ? undefined : value;
}
