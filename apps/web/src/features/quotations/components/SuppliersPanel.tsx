import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import {
  Copy,
  ExternalLink,
  KeyRound,
  Mail,
  MessageCircle,
  MoreHorizontal,
  NotebookPen,
  Trash2,
  UserPlus,
} from 'lucide-react';
import type { QuotationDetailDto, QuotationSupplierDto } from '@falcao-erp/shared-types';

import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { routeTo } from '@/constants/routes';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { formatCNPJ, formatDateTime } from '@/utils/format';
import { inviteMessage, mailtoUrl, supplierLink, whatsappUrl } from '../lib/share';
import { useRegenerateQuotationLink, useRemoveQuotationSupplier } from '../hooks/useQuotations';
import { SupplierResponseBadge } from './QuotationBadges';

interface SuppliersPanelProps {
  quotation: QuotationDetailDto;
  canManage: boolean;
  onAddSupplier: () => void;
  onEnterPrices: (supplier: QuotationSupplierDto) => void;
}

async function copy(text: string, success: string, failure: string) {
  try {
    await navigator.clipboard.writeText(text);
    toast.success(success);
  } catch {
    toast.error(failure);
  }
}

/** Convidados da cotação: situação da resposta e o link de cada um. */
export function SuppliersPanel({
  quotation,
  canManage,
  onAddSupplier,
  onEnterPrices,
}: SuppliersPanelProps) {
  const { t } = useTranslation('quotations');
  const regenerate = useRegenerateQuotationLink(quotation.id);
  const remove = useRemoveQuotationSupplier(quotation.id);
  const [toRemove, setToRemove] = useState<QuotationSupplierDto | null>(null);
  const [toRegenerate, setToRegenerate] = useState<QuotationSupplierDto | null>(null);
  const isOpen = quotation.status === 'ABERTA';

  return (
    <section aria-labelledby="quotation-suppliers" className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="quotation-suppliers" className="text-base font-semibold text-ink">
          {t('quotations:suppliers.title', { count: quotation.suppliers.length })}
        </h2>
        {canManage && isOpen && (
          <Button
            size="sm"
            variant="outline"
            leftIcon={<UserPlus className="h-4 w-4" />}
            onClick={onAddSupplier}
          >
            {t('quotations:suppliers.add')}
          </Button>
        )}
      </div>

      <ul className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        {quotation.suppliers.map((supplier) => {
          const link = supplier.linkToken ? supplierLink(supplier.linkToken) : null;
          const message = link ? inviteMessage(quotation, supplier, link) : '';
          const subject = t('quotations:share.subject', {
            numero: quotation.numero,
            titulo: quotation.titulo,
          });
          return (
            <li
              key={supplier.id}
              className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-4 shadow-sm"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate font-semibold text-ink">{supplier.supplierName}</p>
                  <p className="font-mono text-2xs text-ink-soft">
                    {formatCNPJ(supplier.supplierCnpj)}
                  </p>
                  {(supplier.origem === 'LINK_ABERTO' || supplier.cadastroPendente) && (
                    <p className="mt-1 flex flex-wrap gap-1">
                      {supplier.origem === 'LINK_ABERTO' && (
                        <Badge size="sm" variant="info">
                          {t('quotations:suppliers.viaOpenLink')}
                        </Badge>
                      )}
                      {supplier.cadastroPendente && (
                        <Link to={routeTo.supplier(supplier.supplierId)}>
                          <Badge size="sm" variant="warning">
                            {t('quotations:suppliers.pendingRegistration')}
                          </Badge>
                        </Link>
                      )}
                    </p>
                  )}
                </div>
                <SupplierResponseBadge status={supplier.status} />
              </div>

              <div className="space-y-0.5 text-xs text-ink-soft">
                {supplier.respondidoEm ? (
                  <p>
                    {t('quotations:suppliers.answeredBy', {
                      name: supplier.respondidoPor ?? '—',
                      date: formatDateTime(supplier.respondidoEm),
                    })}
                  </p>
                ) : (
                  <p>{t('quotations:suppliers.waiting')}</p>
                )}
                {supplier.status === 'RECUSOU' && supplier.observacoes && (
                  <p className="italic">“{supplier.observacoes}”</p>
                )}
                {supplier.condicaoPagamento && (
                  <p>{t('quotations:suppliers.payment', { value: supplier.condicaoPagamento })}</p>
                )}
                {(supplier.contatoEmail || supplier.contatoTelefone) && (
                  <p className="truncate">
                    {[supplier.contatoNome, supplier.contatoTelefone, supplier.contatoEmail]
                      .filter(Boolean)
                      .join(' · ')}
                  </p>
                )}
              </div>

              {canManage && isOpen && link && (
                <div className="mt-auto flex flex-wrap gap-2 border-t border-border pt-3">
                  <Button
                    size="sm"
                    variant="primary"
                    leftIcon={<Copy className="h-3.5 w-3.5" />}
                    onClick={() =>
                      void copy(
                        link,
                        t('quotations:toast.linkCopied'),
                        t('quotations:toast.copyFailed'),
                      )
                    }
                  >
                    {t('quotations:suppliers.copyLink')}
                  </Button>
                  <Button size="sm" variant="outline" asChild>
                    <a
                      href={whatsappUrl(supplier.contatoTelefone, message)}
                      target="_blank"
                      rel="noreferrer"
                      className="gap-1.5"
                    >
                      <MessageCircle className="h-3.5 w-3.5" aria-hidden="true" />
                      {t('quotations:suppliers.whatsapp')}
                    </a>
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        size="sm"
                        variant="ghost"
                        aria-label={t('quotations:suppliers.moreAria', {
                          name: supplier.supplierName,
                        })}
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <a href={mailtoUrl(supplier.contatoEmail, subject, message)}>
                          <Mail className="h-4 w-4" />
                          {t('quotations:suppliers.email')}
                        </a>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onSelect={() =>
                          void copy(
                            message,
                            t('quotations:toast.messageCopied'),
                            t('quotations:toast.copyFailed'),
                          )
                        }
                      >
                        <Copy className="h-4 w-4" />
                        {t('quotations:suppliers.copyMessage')}
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <a href={link} target="_blank" rel="noreferrer">
                          <ExternalLink className="h-4 w-4" />
                          {t('quotations:suppliers.openLink')}
                        </a>
                      </DropdownMenuItem>
                      <DropdownMenuItem onSelect={() => onEnterPrices(supplier)}>
                        <NotebookPen className="h-4 w-4" />
                        {t('quotations:suppliers.enterPrices')}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onSelect={() => setToRegenerate(supplier)}>
                        <KeyRound className="h-4 w-4" />
                        {t('quotations:suppliers.regenerate')}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-danger"
                        onSelect={() => setToRemove(supplier)}
                      >
                        <Trash2 className="h-4 w-4" />
                        {t('quotations:suppliers.remove')}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              )}
            </li>
          );
        })}
      </ul>

      <ConfirmDialog
        open={toRegenerate !== null}
        onOpenChange={(open) => !open && setToRegenerate(null)}
        title={t('quotations:confirm.regenerateTitle')}
        description={t('quotations:confirm.regenerateDescription', {
          name: toRegenerate?.supplierName ?? '',
        })}
        confirmLabel={t('quotations:suppliers.regenerate')}
        isSubmitting={regenerate.isPending}
        onConfirm={() =>
          toRegenerate &&
          regenerate.mutate(toRegenerate.id, { onSuccess: () => setToRegenerate(null) })
        }
      />
      <ConfirmDialog
        open={toRemove !== null}
        onOpenChange={(open) => !open && setToRemove(null)}
        title={t('quotations:confirm.removeSupplierTitle')}
        description={t('quotations:confirm.removeSupplierDescription', {
          name: toRemove?.supplierName ?? '',
        })}
        destructive
        confirmLabel={t('common:actions.remove')}
        isSubmitting={remove.isPending}
        onConfirm={() =>
          toRemove && remove.mutate(toRemove.id, { onSuccess: () => setToRemove(null) })
        }
      />
    </section>
  );
}
