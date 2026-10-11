import { describe, expect, it } from 'vitest';
import { passwordStrength } from '../passwordStrength';

describe('passwordStrength', () => {
  it('vazia é 0 e curta demais é 1', () => {
    expect(passwordStrength('')).toBe(0);
    expect(passwordStrength('Ab1!')).toBe(1);
  });

  it('cresce com a variedade de caracteres', () => {
    expect(passwordStrength('abcdefgh')).toBe(1);
    expect(passwordStrength('abcdefg1')).toBe(2);
    expect(passwordStrength('Abcdefg1')).toBe(3);
  });

  it('longa e variada é 4', () => {
    expect(passwordStrength('Falcao@2026!x')).toBe(4);
  });
});
