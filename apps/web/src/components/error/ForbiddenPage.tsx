import { type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ShieldOff } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ROUTE_PATHS } from '@/constants/routes';

export function ForbiddenPage(): ReactNode {
  const { t } = useTranslation('common');

  return (
    <div className="flex h-full min-h-[60vh] items-center justify-center p-6">
      <div className="flex max-w-md animate-fade-in flex-col items-center gap-4 text-center">
        <div
          aria-hidden="true"
          className="flex h-14 w-14 items-center justify-center rounded-full bg-danger/10 text-danger"
        >
          <ShieldOff className="h-7 w-7" />
        </div>
        <h1 className="font-display text-2xl font-semibold text-ink">{t('forbidden.title')}</h1>
        <p className="text-sm text-ink-soft">{t('forbidden.description')}</p>
        <Button asChild variant="primary">
          <Link to={ROUTE_PATHS.DASHBOARD}>{t('actions.backToHome')}</Link>
        </Button>
      </div>
    </div>
  );
}

export default ForbiddenPage;
