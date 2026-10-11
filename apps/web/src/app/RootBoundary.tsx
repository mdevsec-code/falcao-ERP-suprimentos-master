import { type ReactNode } from 'react';
import { Link, useRouteError, isRouteErrorResponse } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { EmptyState } from '@/components/feedback/EmptyState';
import { Button } from '@/components/ui/Button';
import { AlertTriangle } from 'lucide-react';

interface RootBoundaryProps {
  children?: ReactNode;
}

/**
 * Boundary de erro global. Funciona como:
 *  - wrapper de layout (renderiza `children` quando não há erro);
 *  - estado de erro (mostra EmptyState quando o router entrega um erro).
 *
 * Hooks são chamados incondicionalmente (Rules of Hooks) e a decisão
 * de qual árvore renderizar é tomada pelo `if` abaixo, não por `children`.
 */
export function RootBoundary({ children }: RootBoundaryProps) {
  const { t } = useTranslation('common');
  const error = useRouteError();

  if (!error) return <>{children}</>;

  const title = isRouteErrorResponse(error)
    ? `${error.status} — ${error.statusText || t('notFound.title')}`
    : t('states.error');
  const description = isRouteErrorResponse(error)
    ? t('errorBoundary.routeErrorDescription')
    : error instanceof Error
      ? error.message
      : t('errorBoundary.genericDescription');

  return (
    <div className="flex h-full min-h-screen items-center justify-center bg-bg p-6">
      <EmptyState
        icon={<AlertTriangle className="h-6 w-6" />}
        title={title}
        description={description}
        action={
          <Button asChild variant="primary">
            <Link to="/" replace>
              {t('actions.backToHome')}
            </Link>
          </Button>
        }
      />
    </div>
  );
}
