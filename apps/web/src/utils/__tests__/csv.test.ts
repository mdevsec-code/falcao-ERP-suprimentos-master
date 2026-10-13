import { describe, expect, it } from 'vitest';
import { BOM, csvNumber, toCsv } from '../csv';

describe('toCsv', () => {
  it('separa por ponto e vírgula e prefixa o BOM', () => {
    expect(
      toCsv([
        ['a', 'b'],
        ['1', '2'],
      ]),
    ).toBe(`${BOM}a;b\r\n1;2`);
  });

  it('coloca entre aspas só os campos com separador, aspas ou quebra de linha', () => {
    const csv = toCsv([['Aço; CA-50', 'Diz "olá"', 'linha\nnova', 'simples']]);
    expect(csv).toBe(`${BOM}"Aço; CA-50";"Diz ""olá""";"linha\nnova";simples`);
  });

  it('neutraliza fórmulas sem mexer em números negativos', () => {
    expect(toCsv([['=HYPERLINK("x")', '@SUM(A1)', '-1234,50', '+55 31 9999']])).toBe(
      `${BOM}"'=HYPERLINK(""x"")";'@SUM(A1);-1234,50;'+55 31 9999`,
    );
  });

  it('trata nulos como vazio', () => {
    expect(toCsv([[null, undefined, 0]])).toBe(`${BOM};;0`);
  });
});

describe('csvNumber', () => {
  it('usa vírgula decimal com duas casas', () => {
    expect(csvNumber(1234.5)).toBe('1234,50');
    expect(csvNumber('68500.00')).toBe('68500,00');
  });

  it('devolve vazio para valores ausentes ou inválidos', () => {
    expect(csvNumber(null)).toBe('');
    expect(csvNumber('')).toBe('');
    expect(csvNumber('abc')).toBe('');
  });
});
