import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Mescla classes Tailwind de forma inteligente.
 *
 * Combina `clsx` (condicional) e `tailwind-merge` (resolve conflitos
 * de classes utilitárias — ex.: `cn('p-2', 'p-4')` resulta em `p-4`).
 *
 * Use em todos os componentes que recebem `className` por prop.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
