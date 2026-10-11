import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import i18n from '@/i18n';
import {
  formatCNPJ,
  formatCPF,
  formatCurrencyBRL,
  formatDate,
  formatDateTime,
  formatFileSize,
  formatPhoneBR,
  getInitials,
  relativeTime,
  truncate,
} from '../format';

describe('format utils', () => {
  // Os formatadores seguem o idioma ativo (getIntlLocale()); fixamos pt-BR
  // aqui para as asserções ficarem determinísticas, independente do locale
  // que o navegador/jsdom do ambiente de teste reporta.
  const originalLanguage = i18n.language;
  beforeAll(async () => {
    await i18n.changeLanguage('pt-BR');
  });
  afterAll(async () => {
    await i18n.changeLanguage(originalLanguage);
  });

  describe('getInitials', () => {
    it('extrai até 2 iniciais', () => {
      expect(getInitials('Maria Silva Santos')).toBe('MS');
    });

    it('trata whitespace', () => {
      expect(getInitials('  joão  ')).toBe('J');
    });

    it('retorna vazio para string vazia', () => {
      expect(getInitials('')).toBe('');
    });
  });

  describe('formatDate', () => {
    it('formata data ISO', () => {
      const formatted = formatDate('2026-01-15T00:00:00Z');
      expect(formatted).toMatch(/\d{2}\/\d{2}\/\d{4}/);
    });

    it('retorna null para entrada inválida', () => {
      expect(formatDate(null)).toBeNull();
      expect(formatDate(undefined)).toBeNull();
      expect(formatDate('not-a-date')).toBeNull();
    });

    it('acompanha o idioma ativo (não fica preso em pt-BR)', async () => {
      await i18n.changeLanguage('en-US');
      try {
        const formatted = formatDate('2026-01-15T00:00:00Z');
        // en-US usa M/D/YY, não dd/mm/yyyy — provando que o formatador lê o
        // locale atual em vez de uma instância de Intl.DateTimeFormat fixa.
        expect(formatted).not.toMatch(/^\d{2}\/\d{2}\/\d{4}$/);
      } finally {
        await i18n.changeLanguage('pt-BR');
      }
    });
  });

  describe('formatDateTime', () => {
    it('formata data + hora', () => {
      const formatted = formatDateTime('2026-01-15T14:30:00Z');
      expect(formatted).toMatch(/\d{2}\/\d{2}\/\d{4}/);
    });
  });

  describe('formatCurrencyBRL', () => {
    it('formata em BRL', () => {
      expect(formatCurrencyBRL(1234.5)).toContain('1.234,50');
    });

    it('devolve placeholder para nulo', () => {
      expect(formatCurrencyBRL(null)).toBe('—');
      expect(formatCurrencyBRL(undefined)).toBe('—');
    });

    it('aceita Decimal serializado como string pela API', () => {
      expect(formatCurrencyBRL('1234.5')).toContain('1.234,50');
      expect(formatCurrencyBRL('')).toBe('—');
      expect(formatCurrencyBRL('abc')).toBe('—');
    });
  });

  describe('formatFileSize', () => {
    it('formata bytes, KB e MB', () => {
      expect(formatFileSize(512)).toBe('512 B');
      expect(formatFileSize(34 * 1024)).toBe('34 KB');
      expect(formatFileSize(2.1 * 1024 * 1024)).toBe('2,1 MB');
    });

    it('devolve placeholder para valor inválido', () => {
      expect(formatFileSize(null)).toBe('—');
      expect(formatFileSize(-1)).toBe('—');
    });
  });

  describe('formatCPF', () => {
    it('aplica máscara', () => {
      expect(formatCPF('12345678900')).toBe('123.456.789-00');
    });

    it('limpa caracteres não-numéricos', () => {
      expect(formatCPF('123.456.789-00')).toBe('123.456.789-00');
    });

    it('limita a 11 dígitos', () => {
      expect(formatCPF('123456789000000')).toBe('123.456.789-00');
    });
  });

  describe('formatCNPJ', () => {
    it('aplica máscara', () => {
      expect(formatCNPJ('12345678000199')).toBe('12.345.678/0001-99');
    });
  });

  describe('formatPhoneBR', () => {
    it('aplica máscara de 11 dígitos (celular)', () => {
      expect(formatPhoneBR('11999998888')).toBe('(11) 99999-8888');
    });

    it('aplica máscara de 10 dígitos (fixo)', () => {
      expect(formatPhoneBR('1133334444')).toBe('(11) 3333-4444');
    });
  });

  describe('relativeTime', () => {
    it('retorna string para datas válidas', () => {
      const now = new Date();
      const result = relativeTime(now);
      expect(typeof result).toBe('string');
    });

    it('retorna vazio para nulo/inválido', () => {
      expect(relativeTime(null)).toBe('');
      expect(relativeTime('not-a-date')).toBe('');
    });
  });

  describe('truncate', () => {
    it('trunca strings longas', () => {
      expect(truncate('uma frase muito longa para caber no limite', 10)).toBe('uma frase…');
    });

    it('não trunca strings curtas', () => {
      expect(truncate('curta', 10)).toBe('curta');
    });
  });
});
