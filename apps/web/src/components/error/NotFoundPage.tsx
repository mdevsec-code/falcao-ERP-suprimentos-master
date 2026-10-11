import { type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Compass } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { StatusScreen } from '@/components/brand/StatusScreen';
import { ROUTE_PATHS } from '@/constants/routes';

export interface NotFoundPageProps {
  title?: string;
  description?: string;
  homeLabel?: string;
}

export function NotFoundPage({ title, description, homeLabel }: NotFoundPageProps): ReactNode {
  const { t } = useTranslation('common');
  const navigate = useNavigate();

  return (
    <StatusScreen
      code="404"
      label={t('notFound.label')}
      title={title ?? t('notFound.title')}
      description={description ?? t('notFound.description')}
      icon={<Compass className="h-6 w-6" />}
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
            <Link to={ROUTE_PATHS.DASHBOARD}>{homeLabel ?? t('actions.backToHome')}</Link>
          </Button>
        </>
      }
    />
  );
}

export default NotFoundPage;
