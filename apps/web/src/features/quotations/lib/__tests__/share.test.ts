import { describe, expect, it } from 'vitest';
import { supplierLink, whatsappNumber, whatsappUrl } from '../share';

describe('link e compartilhamento da cotação', () => {
  it('monta o link público a partir do token', () => {
    expect(supplierLink('abc.def', 'https://erp.falcao.com.br')).toBe(
      'https://erp.falcao.com.br/cotacao/abc.def',
    );
  });

  it('normaliza o telefone para o wa.me (com DDI 55)', () => {
    expect(whatsappNumber('(31) 3222-1000')).toBe('553132221000');
    expect(whatsappNumber('+55 71 99999-8888')).toBe('5571999998888');
    expect(whatsappNumber('123')).toBeNull();
    expect(whatsappNumber(null)).toBeNull();
  });

  it('sem telefone, abre o WhatsApp só com a mensagem', () => {
    expect(whatsappUrl(null, 'oi & tchau')).toBe('https://wa.me/?text=oi%20%26%20tchau');
  });
});
