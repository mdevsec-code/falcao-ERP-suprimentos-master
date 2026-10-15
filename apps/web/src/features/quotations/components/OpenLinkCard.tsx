import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Copy, ExternalLink, Globe2, Link2Off, Mail, MessageCircle, RefreshCw } from 'lucide-react';

import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { Button } from '@/components/ui/Button';
import { mailtoUrl, openInviteMessage, openQuotationLink, whatsappUrl } from '../lib/share';

interface OpenLinkCardProps {
  /** `null` = link desligado. */
  token: string | null;
  /** Cotação aberta (o link só funciona enquanto ela recebe respostas). */
  isOpen: boolean;
  canManage: boolean;
  context: Parameters<typeof openInviteMessage>[0];
  onEnable: () => void;
  onDisable: () => void;
  isPending?: boolean;
}

async function copy(text: string, success: string, failure: string) {
  try {
    await navigator.clipboard.writeText(text);
    toast.success(success);
  } catch {
    toast.error(failure);
  }
}

/**
 * Link aberto da cotação: um endereço só para divulgar (WhatsApp, e-mail,
 * grupo de fornecedores). Quem abre informa o CNPJ e cota em cima da lista;
 * CNPJ novo vira cadastro pendente para compras aprovar.
 */
export function OpenLinkCard({
  token,
  isOpen,
  canManage,
  context,
  onEnable,
  onDisable,
  isPending,
}: OpenLinkCardProps) {
  const { t } = useTranslation('quotations');
  const [confirm, setConfirm] = useState<'regenerate' | 'disable' | null>(null);
  const link = token ? openQuotationLink(token) : null;
  const message = link ? openInviteMessage(context, link) : '';
  const subject = t('quotations:share.subject', { numero: context.numero, titulo: context.titulo });

  if (!isOpen) return null;

  return (
    <section
      aria-labelledby="open-link-title"
      className="rounded-lg border border-brand-gold-300 bg-brand-gold-50/60 p-4 shadow-sm sm:p-5"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <Globe2 className="mt-0.5 h-5 w-5 shrink-0 text-brand-gold-700" aria-hidden="true" />
          <div className="min-w-0">
            <h2 id="open-link-title" className="text-base font-semibold text-ink">
              {t('quotations:openLink.title')}
            </h2>
            <p className="text-sm text-ink-soft">
              {link ? t('quotations:openLink.description') : t('quotations:openLink.off')}
            </p>
          </div>
        </div>
        {canManage && !link && (
          <Button variant="primary" size="sm" onClick={onEnable} isLoading={isPending}>
            {t('quotations:openLink.enable')}
          </Button>
        )}
      </div>

      {link && (
        <div className="mt-4 space-y-3">
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              readOnly
              value={link}
              aria-label={t('quotations:openLink.title')}
              onFocus={(e) => e.target.select()}
              className="h-10 min-w-0 flex-1 rounded-md border border-border bg-surface px-3 font-mono text-xs text-ink"
            />
            <Button
              variant="primary"
              leftIcon={<Copy className="h-4 w-4" />}
              onClick={() =>
                void copy(link, t('quotations:toast.linkCopied'), t('quotations:toast.copyFailed'))
              }
            >
              {t('quotations:suppliers.copyLink')}
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" asChild>
              <a href={whatsappUrl(null, message)} target="_blank" rel="noreferrer">
                <MessageCircle className="h-3.5 w-3.5" aria-hidden="true" />
                {t('quotations:suppliers.whatsapp')}
              </a>
            </Button>
            <Button size="sm" variant="outline" asChild>
              <a href={mailtoUrl(null, subject, message)}>
                <Mail className="h-3.5 w-3.5" aria-hidden="true" />
                {t('quotations:suppliers.email')}
              </a>
            </Button>
            <Button
              size="sm"
              variant="outline"
              leftIcon={<Copy className="h-3.5 w-3.5" />}
              onClick={() =>
                void copy(
                  message,
                  t('quotations:toast.messageCopied'),
                  t('quotations:toast.copyFailed'),
                )
              }
            >
              {t('quotations:suppliers.copyMessage')}
            </Button>
            <Button size="sm" variant="ghost" asChild>
              <a href={link} target="_blank" rel="noreferrer">
                <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                {t('quotations:suppliers.openLink')}
              </a>
            </Button>
            {canManage && (
              <>
                <Button
                  size="sm"
                  variant="ghost"
                  leftIcon={<RefreshCw className="h-3.5 w-3.5" />}
                  onClick={() => setConfirm('regenerate')}
                  disabled={isPending}
                >
                  {t('quotations:openLink.regenerate')}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  leftIcon={<Link2Off className="h-3.5 w-3.5" />}
                  onClick={() => setConfirm('disable')}
                  disabled={isPending}
                >
                  {t('quotations:openLink.disable')}
                </Button>
              </>
            )}
          </div>
          <p className="text-xs text-ink-soft">{t('quotations:openLink.hint')}</p>
        </div>
      )}

      <ConfirmDialog
        open={confirm !== null}
        onOpenChange={(open) => !open && setConfirm(null)}
        title={
          confirm === 'disable'
            ? t('quotations:openLink.disableTitle')
            : t('quotations:openLink.regenerateTitle')
        }
        description={
          confirm === 'disable'
            ? t('quotations:openLink.disableDescription')
            : t('quotations:openLink.regenerateDescription')
        }
        confirmLabel={
          confirm === 'disable'
            ? t('quotations:openLink.disable')
            : t('quotations:openLink.regenerate')
        }
        destructive={confirm === 'disable'}
        isSubmitting={isPending}
        onConfirm={() => {
          if (confirm === 'disable') onDisable();
          else onEnable();
          setConfirm(null);
        }}
      />
    </section>
  );
}
