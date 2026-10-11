import { type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, ShieldOff } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { StatusScreen } from '@/components/brand/StatusScreen';
import { ROUTE_PATHS } from '@/constants/routes';

export function ForbiddenPage(): ReactNode {
  const { t } = useTranslation('common');
  const navigate = useNavigate();

  return (
    <StatusScreen
      code="403"
      label={t('forbidden.label')}
      title={t('forbidden.title')}
      description={t('forbidden.description')}
      icon={<ShieldOff className="h-6 w-6" />}
      actions={
        <>
          <Button
            variant="outline"
            leftIcon={<ArrowLeft className="h-4 w-4" />}
            onClick={() => navigate(-1)}
          >
            {t('actions.back')}
          </Button>
          <Button asChild variant="primary">
            <Link to={ROUTE_PATHS.DASHBOARD}>{t('actions.backToHome')}</Link>
          </Button>
        </>
      }
    />
  );
}

export default ForbiddenPage;
