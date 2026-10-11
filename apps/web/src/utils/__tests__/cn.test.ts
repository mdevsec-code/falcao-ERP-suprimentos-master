import { describe, expect, it } from 'vitest';
import { cn } from '../cn';

describe('cn', () => {
  it('combina classes', () => {
    expect(cn('p-2', 'text-red-500')).toBe('p-2 text-red-500');
  });

  it('aceita condicional via falsy values', () => {
    expect(cn('p-2', false && 'text-red-500', undefined, 'mt-4')).toBe('p-2 mt-4');
  });

  it('resolve conflitos Tailwind (twMerge)', () => {
    expect(cn('p-2', 'p-4')).toBe('p-4');
    expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500');
  });

  it('mantém classes não conflitantes', () => {
    expect(cn('bg-red-500', 'text-white', 'p-2')).toBe('bg-red-500 text-white p-2');
  });
});
