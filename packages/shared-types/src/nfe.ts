/**
 * Leitura dos campos que interessam ao contas a pagar num XML de NF-e (modelo 55).
 *
 * Não usa parser XML de propósito: extrai só tags conhecidas do leiaute oficial,
 * sem resolver entidades nem DTD (nada de XXE) e sem dependência nova.
 */

export interface NfeDuplicata {
  numero: string | null;
  vencimento: string | null;
  valor: string | null;
}

export interface NfeData {
  /** 44 dígitos. */
  chave: string | null;
  numero: string;
  serie: string | null;
  /** `YYYY-MM-DD` */
  emissao: string | null;
  /** Valor total da nota (`vNF`), com 2 casas. */
  valor: string | null;
  emitente: { cnpj: string | null; nome: string | null };
  destinatario: { cnpj: string | null; nome: string | null };
  duplicatas: NfeDuplicata[];
}

const tagRegex = (tag: string) =>
  new RegExp(`<(?:[\\w-]+:)?${tag}\\b[^>]*>([\\s\\S]*?)</(?:[\\w-]+:)?${tag}>`, "i");

function block(xml: string, tag: string): string | null {
  const match = tagRegex(tag).exec(xml);
  return match?.[1] ?? null;
}

function blocks(xml: string, tag: string): string[] {
  const regex = new RegExp(tagRegex(tag).source, "gi");
  const found: string[] = [];
  let match: RegExpExecArray | null;
  while ((match = regex.exec(xml)) !== null) found.push(match[1] ?? "");
  return found;
}

function value(xml: string | null, tag: string): string | null {
  if (xml === null) return null;
  const inner = block(xml, tag);
  if (inner === null) return null;
  const text = decodeEntities(inner.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")).trim();
  return text === "" ? null : text;
}

function decodeEntities(text: string): string {
  return text
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCharCode(Number(code)))
    .replace(/&amp;/g, "&");
}

const onlyDigits = (text: string | null) => (text ? text.replace(/\D/g, "") : null);
const money = (text: string | null) => (text !== null && !Number.isNaN(Number(text)) ? Number(text).toFixed(2) : null);
const date = (text: string | null) => (text && /^\d{4}-\d{2}-\d{2}/.test(text) ? text.slice(0, 10) : null);

/** Devolve `null` quando o conteúdo não é uma NF-e. */
export function parseNfeXml(xml: string): NfeData | null {
  const infNFe = /<(?:[\w-]+:)?infNFe\b([^>]*)>/i.exec(xml);
  if (!infNFe) return null;

  const ide = block(xml, "ide");
  const numero = value(ide, "nNF");
  if (!numero) return null;

  const idAttr = /\bId\s*=\s*"NFe(\d{44})"/i.exec(infNFe[1] ?? "");
  const chave = idAttr?.[1] ?? onlyDigits(value(xml, "chNFe"));

  const emit = block(xml, "emit");
  const dest = block(xml, "dest");
  const icmsTot = block(xml, "ICMSTot");
  const cobr = block(xml, "cobr");

  return {
    chave: chave && chave.length === 44 ? chave : null,
    numero,
    serie: value(ide, "serie"),
    emissao: date(value(ide, "dhEmi") ?? value(ide, "dEmi")),
    valor: money(value(icmsTot, "vNF")),
    emitente: { cnpj: onlyDigits(value(emit, "CNPJ") ?? value(emit, "CPF")), nome: value(emit, "xNome") },
    destinatario: { cnpj: onlyDigits(value(dest, "CNPJ") ?? value(dest, "CPF")), nome: value(dest, "xNome") },
    duplicatas: cobr
      ? blocks(cobr, "dup").map((dup) => ({
          numero: value(dup, "nDup"),
          vencimento: date(value(dup, "dVenc")),
          valor: money(value(dup, "vDup")),
        }))
      : [],
  };
}
