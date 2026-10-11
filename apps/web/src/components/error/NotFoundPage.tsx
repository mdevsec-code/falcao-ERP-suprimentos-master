import { type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Compass } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ROUTE_PATHS } from '@/constants/routes';

export interface NotFoundPageProps {
  title?: string;
  description?: string;
  homeLabel?: string;
}

export function NotFoundPage({ title, description, homeLabel }: NotFoundPageProps): ReactNode {
  const { t } = useTranslation('common');
  const resolvedTitle = title ?? t('notFound.title');
  const resolvedDescription = description ?? t('notFound.description');
  const resolvedHomeLabel = homeLabel ?? t('actions.backToHome');

  return (
    <div className="flex h-full min-h-[60vh] items-center justify-center p-6">
      <div className="flex max-w-md flex-col items-center gap-4 text-center">
        <div
          aria-hidden="true"
          className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-gold-50 text-brand-gold-700"
        >
          <Compass className="h-7 w-7" />
        </div>
        <h1 className="font-display text-2xl font-semibold text-ink">{resolvedTitle}</h1>
        <p className="text-sm text-ink-soft">{resolvedDescription}</p>
        <Button asChild variant="primary">
          <Link to={ROUTE_PATHS.DASHBOARD}>{resolvedHomeLabel}</Link>
        </Button>
      </div>
    </div>
  );
}

export default NotFoundPage;
