import { MIN_PASSWORD_LENGTH } from '@falcao-erp/shared-types';

export type PasswordStrength = 0 | 1 | 2 | 3 | 4;

/**
 * Força aproximada da senha (0–4) para o medidor visual: comprimento e
 * variedade de caracteres. Não substitui a validação da API — só orienta.
 */
export function passwordStrength(password: string): PasswordStrength {
  if (!password) return 0;
  if (password.length < MIN_PASSWORD_LENGTH) return 1;
  const variety = [/[a-z]/, /[A-Z]/, /\d/, /[^A-Za-z0-9]/].filter((re) => re.test(password)).length;
  let score = 1;
  if (variety >= 2) score++;
  if (variety >= 3) score++;
  if (password.length >= 12 && variety >= 3) score++;
  return Math.min(score, 4) as PasswordStrength;
}
