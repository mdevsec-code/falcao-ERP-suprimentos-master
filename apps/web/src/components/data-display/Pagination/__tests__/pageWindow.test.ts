import { describe, expect, it } from 'vitest';
import { pageWindow } from '../pageWindow';

describe('pageWindow', () => {
  it('poucas páginas: mostra todas', () => {
    expect(pageWindow(1, 1)).toEqual([1]);
    expect(pageWindow(2, 3)).toEqual([1, 2, 3]);
  });

  it('meio de muitas páginas: pontas, vizinhas e reticências', () => {
    expect(pageWindow(6, 12)).toEqual([1, 'gap', 5, 6, 7, 'gap', 12]);
  });

  it('salto de uma página só vira o número, não reticências', () => {
    expect(pageWindow(4, 12)).toEqual([1, 2, 3, 4, 5, 'gap', 12]);
    expect(pageWindow(1, 12)).toEqual([1, 2, 'gap', 12]);
    expect(pageWindow(12, 12)).toEqual([1, 'gap', 11, 12]);
  });
});
