import { describe, expect, it } from 'vitest';
import { parseNfeXml } from '@falcao-erp/shared-types';

const CHAVE = '35261011222333000144550010000123451000123456';

function nfe({ withProtocol = true, prefix = '' } = {}) {
  const tag = (name: string) => (prefix ? `${prefix}:${name}` : name);
  const open = (name: string, attrs = '') => `<${tag(name)}${attrs}>`;
  const close = (name: string) => `</${tag(name)}>`;
  return `<?xml version="1.0" encoding="UTF-8"?>
${open('nfeProc', ' xmlns="http://www.portalfiscal.inf.br/nfe"')}${open('NFe')}${open('infNFe', ` Id="NFe${CHAVE}" versao="4.00"`)}
  ${open('ide')}${open('nNF')}12345${close('nNF')}${open('serie')}1${close('serie')}${open('dhEmi')}2026-10-01T10:15:00-03:00${close('dhEmi')}${close('ide')}
  ${open('emit')}${open('CNPJ')}11222333000144${close('CNPJ')}${open('xNome')}Aço Forte &amp; Cia${close('xNome')}${close('emit')}
  ${open('dest')}${open('CNPJ')}12345678000190${close('CNPJ')}${open('xNome')}<![CDATA[Falcão Engenharia]]>${close('xNome')}${close('dest')}
  ${open('total')}${open('ICMSTot')}${open('vProd')}3080.00${close('vProd')}${open('vNF')}3080${close('vNF')}${close('ICMSTot')}${close('total')}
  ${open('cobr')}${open('dup')}${open('nDup')}001${close('nDup')}${open('dVenc')}2026-10-29${close('dVenc')}${open('vDup')}1540.00${close('vDup')}${close('dup')}${open('dup')}${open('nDup')}002${close('nDup')}${open('dVenc')}2026-11-28${close('dVenc')}${open('vDup')}1540.00${close('vDup')}${close('dup')}${close('cobr')}
${close('infNFe')}${close('NFe')}${withProtocol ? `${open('protNFe')}${open('infProt')}${open('chNFe')}${CHAVE}${close('chNFe')}${close('infProt')}${close('protNFe')}` : ''}${close('nfeProc')}`;
}

describe('parseNfeXml', () => {
  it('lê número, série, emissão, valor, chave e partes', () => {
    const data = parseNfeXml(nfe());
    expect(data).toMatchObject({
      chave: CHAVE,
      numero: '12345',
      serie: '1',
      emissao: '2026-10-01',
      valor: '3080.00',
      emitente: { cnpj: '11222333000144', nome: 'Aço Forte & Cia' },
      destinatario: { cnpj: '12345678000190', nome: 'Falcão Engenharia' },
    });
  });

  it('lê as duplicatas (vencimentos)', () => {
    expect(parseNfeXml(nfe())?.duplicatas).toEqual([
      { numero: '001', vencimento: '2026-10-29', valor: '1540.00' },
      { numero: '002', vencimento: '2026-11-28', valor: '1540.00' },
    ]);
  });

  it('aceita tags com prefixo de namespace', () => {
    expect(parseNfeXml(nfe({ prefix: 'nfe' }))?.numero).toBe('12345');
  });

  it('o CNPJ do emitente não se confunde com o do destinatário', () => {
    expect(parseNfeXml(nfe())?.emitente.cnpj).toBe('11222333000144');
  });

  it('pega a chave do atributo Id mesmo sem protocolo', () => {
    expect(parseNfeXml(nfe({ withProtocol: false }))?.chave).toBe(CHAVE);
  });

  it('recusa o que não é NF-e', () => {
    expect(parseNfeXml('<html><body>oi</body></html>')).toBeNull();
    expect(parseNfeXml('<infNFe><ide></ide></infNFe>')).toBeNull();
    expect(parseNfeXml('')).toBeNull();
  });

  it('não resolve entidades externas (sem XXE)', () => {
    const xxe = `<?xml version="1.0"?><!DOCTYPE x [<!ENTITY e SYSTEM "file:///etc/passwd">]>${nfe().replace('Aço Forte &amp; Cia', '&e;')}`;
    expect(parseNfeXml(xxe)?.emitente.nome).toBe('&e;');
  });
});
