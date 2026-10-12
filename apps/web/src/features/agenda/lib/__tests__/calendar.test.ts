import { describe, expect, it } from 'vitest';
import { monthGrid, monthStart, shiftMonth, weekdayLabels } from '../calendar';

describe('monthGrid', () => {
  it('tem 42 dias começando no domingo anterior ao dia 1', () => {
    // Outubro de 2026 começa numa quinta-feira.
    const grid = monthGrid('2026-10-01');
    expect(grid).toHaveLength(42);
    expect(grid[0]).toBe('2026-09-27');
    expect(grid[4]).toBe('2026-10-01');
    expect(grid[41]).toBe('2026-11-07');
  });

  it('não repete a semana anterior quando o mês começa no domingo', () => {
    // Fevereiro de 2026 começa num domingo.
    expect(monthGrid('2026-02-01')[0]).toBe('2026-02-01');
  });
});

describe('shiftMonth / monthStart', () => {
  it('atravessa a virada do ano', () => {
    expect(shiftMonth('2026-12-01', 1)).toBe('2027-01-01');
    expect(shiftMonth('2026-01-01', -1)).toBe('2025-12-01');
  });

  it('normaliza para o dia 1', () => {
    expect(monthStart('2026-10-23')).toBe('2026-10-01');
  });
});

describe('weekdayLabels', () => {
  it('começa no domingo', () => {
    expect(weekdayLabels('pt-BR')[0]?.toLowerCase()).toMatch(/^dom/);
    expect(weekdayLabels('en-US')[0]).toMatch(/^Sun/);
  });
});
