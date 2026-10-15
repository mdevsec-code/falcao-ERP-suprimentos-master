import type { QuotationDetailDto, QuotationSupplierDto } from '@falcao-erp/shared-types';

import i18n from '@/i18n';
import { routeTo } from '@/constants/routes';
import { formatDateOnly } from '@/utils/format';

/** URL completa do link de resposta (o token só vem para quem gerencia a cotação). */
export function supplierLink(token: string, origin: string = window.location.origin): string {
  return `${origin}${routeTo.supplierQuotation(token)}`;
}

/** Mensagem pronta para WhatsApp ou e-mail, com a descrição dos materiais e o link. */
export function inviteMessage(
  quotation: QuotationDetailDto,
  supplier: QuotationSupplierDto,
  link: string,
): string {
  const itens = quotation.items
    .map((item) => {
      const extra = [item.marca, item.referencia].filter(Boolean).join(' · ');
      const qty = Number(item.quantidade).toLocaleString(i18n.language);
      return `• ${qty} ${item.unidade} — ${item.descricao}${extra ? ` (${extra})` : ''}`;
    })
    .join('\n');
  return i18n.t('quotations:share.message', {
    contato: supplier.contatoNome ?? supplier.supplierName,
    numero: quotation.numero,
    titulo: quotation.titulo,
    itens,
    prazo: formatDateOnly(quotation.prazoResposta),
    link,
  });
}

/** Telefone só com dígitos, com DDI 55 quando vier sem — o wa.me exige o número completo. */
export function whatsappNumber(phone: string | null): string | null {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 10) return null;
  return digits.startsWith('55') && digits.length >= 12 ? digits : `55${digits}`;
}

export function whatsappUrl(phone: string | null, message: string): string {
  const number = whatsappNumber(phone);
  return `https://wa.me/${number ?? ''}?text=${encodeURIComponent(message)}`;
}

export function mailtoUrl(email: string | null, subject: string, body: string): string {
  return `mailto:${email ?? ''}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

/** URL do link aberto — qualquer fornecedor entra com o CNPJ. */
export function openQuotationLink(token: string, origin: string = window.location.origin): string {
  return `${origin}${routeTo.openQuotation(token)}`;
}

interface OpenInviteContext {
  numero: number;
  titulo: string;
  prazoResposta: string;
  items: ReadonlyArray<{
    descricao: string;
    quantidade: string;
    unidade: string;
    marca: string | null;
    referencia: string | null;
  }>;
}

/** Até quantos itens a mensagem lista (o restante fica para o link). */
const MESSAGE_ITEMS = 12;

/** Mensagem para divulgar o link aberto (WhatsApp, e-mail, grupo de fornecedores). */
export function openInviteMessage(context: OpenInviteContext, link: string): string {
  const listed = context.items.slice(0, MESSAGE_ITEMS).map((item) => {
    const extra = [item.marca, item.referencia].filter(Boolean).join(' · ');
    const qty = Number(item.quantidade).toLocaleString(i18n.language);
    return `• ${qty} ${item.unidade} — ${item.descricao}${extra ? ` (${extra})` : ''}`;
  });
  const rest = context.items.length - listed.length;
  if (rest > 0) listed.push(i18n.t('quotations:openLink.moreItems', { count: rest }));
  return i18n.t('quotations:openLink.message', {
    numero: context.numero,
    titulo: context.titulo,
    itens: listed.join('\n'),
    prazo: formatDateOnly(context.prazoResposta),
    link,
  });
}
