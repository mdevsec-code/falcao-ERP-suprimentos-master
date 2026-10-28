import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Copy, Link2Off, Mail, MessageCircle, RefreshCw, UserPlus } from 'lucide-react';

import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { Button } from '@/components/ui/Button';
import { routeTo } from '@/constants/routes';
import { mailtoUrl, whatsappUrl } from '@/features/quotations/lib/share';
import {
  useSupplierSignupLink,
  useSupplierSignupLinkMutation,
} from '../hooks/useSupplierMutations';

/**
 * Link da empresa para o fornecedor fazer o próprio cadastro (com atividades e
 * produtos em português e chinês). O cadastro chega pendente para aprovação.
 */
export function SignupLinkCard() {
  const { t } = useTranslation('suppliers');
  const link = useSupplierSignupLink();
  const mutation = useSupplierSignupLinkMutation();
  const [confirm, setConfirm] = useState<'regenerate' | 'disable' | null>(null);

  const url = link.data?.token
    ? `${window.location.origin}${routeTo.supplierSignup(link.data.token)}`
    : null;
  const message = url ? t('suppliers:signupLink.message', { link: url }) : '';

  async function copy() {
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      toast.success(t('suppliers:signupLink.copied'));
    } catch {
      toast.error(t('suppliers:signupLink.copyFailed'));
    }
  }

  return (
    <section
      aria-labelledby="supplier-signup-link-title"
      className="rounded-lg border border-border bg-surface p-4 shadow-sm sm:p-5"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 gap-3">
          <UserPlus className="mt-0.5 h-5 w-5 shrink-0 text-brand-gold-700" aria-hidden="true" />
          <div className="min-w-0">
            <h2 id="supplier-signup-link-title" className="text-base font-semibold text-ink">
              {t('suppliers:signupLink.title')}
            </h2>
            <p className="text-sm text-ink-soft">
              {url ? t('suppliers:signupLink.description') : t('suppliers:signupLink.offText')}
            </p>
          </div>
        </div>
        {!url && !link.isLoading && (
          <Button
            size="sm"
            variant="primary"
            isLoading={mutation.isPending}
            onClick={() => mutation.mutate('regenerate')}
          >
            {t('suppliers:signupLink.enable')}
          </Button>
        )}
      </div>

      {url && (
        <div className="mt-4 space-y-3">
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              readOnly
              value={url}
              aria-label={t('suppliers:signupLink.title')}
              onFocus={(event) => event.target.select()}
              className="h-10 min-w-0 flex-1 rounded-md border border-border bg-bg px-3 font-mono text-xs text-ink"
            />
            <Button
              variant="primary"
              leftIcon={<Copy className="h-4 w-4" />}
              onClick={() => void copy()}
            >
              {t('suppliers:signupLink.copy')}
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" asChild>
              <a href={whatsappUrl(null, message)} target="_blank" rel="noreferrer">
                <MessageCircle className="h-3.5 w-3.5" aria-hidden="true" />
                {t('suppliers:signupLink.whatsapp')}
              </a>
            </Button>
            <Button size="sm" variant="outline" asChild>
              <a href={mailtoUrl(null, t('suppliers:signupLink.subject'), message)}>
                <Mail className="h-3.5 w-3.5" aria-hidden="true" />
                {t('suppliers:signupLink.email')}
              </a>
            </Button>
            <Button
              size="sm"
              variant="ghost"
              leftIcon={<RefreshCw className="h-3.5 w-3.5" />}
              onClick={() => setConfirm('regenerate')}
            >
              {t('suppliers:signupLink.regenerate')}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              leftIcon={<Link2Off className="h-3.5 w-3.5" />}
              onClick={() => setConfirm('disable')}
            >
              {t('suppliers:signupLink.disable')}
            </Button>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={confirm !== null}
        onOpenChange={(open) => !open && setConfirm(null)}
        title={
          confirm === 'disable'
            ? t('suppliers:signupLink.disableTitle')
            : t('suppliers:signupLink.regenerateTitle')
        }
        description={t('suppliers:signupLink.confirmDescription')}
        confirmLabel={
          confirm === 'disable'
            ? t('suppliers:signupLink.disable')
            : t('suppliers:signupLink.regenerate')
        }
        destructive={confirm === 'disable'}
        isSubmitting={mutation.isPending}
        onConfirm={() => {
          if (confirm) mutation.mutate(confirm, { onSuccess: () => setConfirm(null) });
        }}
      />
    </section>
  );
}
