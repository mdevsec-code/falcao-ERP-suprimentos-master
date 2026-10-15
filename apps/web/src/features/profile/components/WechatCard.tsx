import { useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { CheckCircle2, ExternalLink, MessageCircle, Unplug } from 'lucide-react';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Skeleton } from '@/components/ui/Skeleton';
import { useRemoveWechat, useSetWechat, useWechatStatus } from '../hooks/useProfile';

const PUSHPLUS_URL = 'https://www.pushplus.plus/';

/**
 * Avisos no WeChat pessoal via PushPlus: a pessoa segue a conta do serviço no
 * WeChat, copia o código dela e cola aqui. Ao salvar, chega uma mensagem de teste.
 */
export function WechatCard() {
  const { t } = useTranslation('profile');
  const status = useWechatStatus();
  const setWechat = useSetWechat();
  const removeWechat = useRemoveWechat();
  const [token, setToken] = useState('');
  const connected = status.data?.connected ?? false;

  return (
    <Card
      className="animate-slide-up"
      style={{ animationDelay: '240ms', animationFillMode: 'backwards' }}
    >
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <MessageCircle className="h-4 w-4 text-brand-gold-700" aria-hidden="true" />
            {t('profile:wechat.title')}
          </CardTitle>
          {connected && (
            <Badge variant="success">
              <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
              {t('profile:wechat.connected')}
            </Badge>
          )}
        </div>
        <CardDescription>{t('profile:wechat.description')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {status.isLoading ? (
          <Skeleton className="h-24 w-full" />
        ) : connected ? (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-ink-soft">{t('profile:wechat.connectedHint')}</p>
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Unplug className="h-3.5 w-3.5" />}
              isLoading={removeWechat.isPending}
              onClick={() => removeWechat.mutate()}
            >
              {t('profile:wechat.disconnect')}
            </Button>
          </div>
        ) : (
          <>
            <ol className="list-decimal space-y-1.5 pl-5 text-sm text-ink">
              <li>
                <Trans
                  t={t}
                  i18nKey="profile:wechat.step1"
                  components={{
                    link: (
                      <a
                        href={PUSHPLUS_URL}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-0.5 font-medium text-brand-gold-700 underline"
                      >
                        pushplus.plus
                      </a>
                    ),
                  }}
                />
                <ExternalLink className="ml-1 inline h-3 w-3 text-ink-soft" aria-hidden="true" />
              </li>
              <li>{t('profile:wechat.step2')}</li>
              <li>{t('profile:wechat.step3')}</li>
            </ol>
            <form
              className="flex flex-col gap-3 sm:flex-row sm:items-end"
              noValidate
              onSubmit={(event) => {
                event.preventDefault();
                if (token.trim()) setWechat.mutate(token.trim(), { onSuccess: () => setToken('') });
              }}
            >
              <div className="flex-1">
                <Input
                  name="wechat-token"
                  label={t('profile:wechat.tokenLabel')}
                  placeholder={t('profile:wechat.tokenPlaceholder')}
                  value={token}
                  onChange={(event) => setToken(event.target.value)}
                  autoComplete="off"
                  spellCheck={false}
                  className="font-mono"
                />
              </div>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                isLoading={setWechat.isPending}
                disabled={!token.trim()}
              >
                {t('profile:wechat.connect')}
              </Button>
            </form>
            <p className="text-xs text-ink-soft">{t('profile:wechat.privacy')}</p>
          </>
        )}
      </CardContent>
    </Card>
  );
}
