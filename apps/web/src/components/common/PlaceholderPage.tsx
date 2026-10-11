import { type ReactNode, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { PageHeader } from '@/components/layout/PageHeader';
import { ROUTE_PATHS } from '@/constants/routes';
import falcaoMark from '@/assets/logo/falcao-mark.png';

interface PlaceholderPageProps {
  title: string;
  description?: string;
  /** Itens específicos do que está a caminho para este módulo (opcional). */
  features?: string[];
  /** Conteúdo adicional exibido abaixo do cartão de "em construção". */
  children?: ReactNode;
}

export function PlaceholderPage({
  title,
  description,
  features,
  children,
}: PlaceholderPageProps): ReactNode {
  const { t } = useTranslation('common');
  const resolvedDescription = description ?? t('placeholder.defaultDescription');

  // Mantém o título da aba coerente com o módulo
  useEffect(() => {
    document.title = `${title} · Falcão`;
    return () => {
      document.title = 'Falcão · Suprimentos';
    };
  }, [title]);

  return (
    <>
      <PageHeader
        eyebrow={t('sidebar.comingSoon')}
        title={title}
        description={resolvedDescription}
        actions={
          <Button asChild variant="outline" leftIcon={<ArrowLeft className="h-4 w-4" />}>
            <Link to={ROUTE_PATHS.DASHBOARD}>{t('actions.backToHome')}</Link>
          </Button>
        }
      />

      <div className="space-y-6 px-6 py-10 sm:px-8">
        <div className="relative mx-auto flex max-w-2xl flex-col items-center gap-5 overflow-hidden rounded-xl border border-border bg-surface p-10 text-center shadow-sm">
          <img
            src={falcaoMark}
            alt=""
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-10 -right-10 h-48 w-auto object-contain opacity-[0.04]"
          />

          <div
            aria-hidden="true"
            className="relative flex h-14 w-14 items-center justify-center rounded-full bg-brand-gold-50 text-brand-gold-700"
          >
            <Sparkles className="h-6 w-6" />
          </div>

          <div className="relative">
            <h2 className="font-display text-2xl font-semibold text-ink">{title}</h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-ink-soft">{resolvedDescription}</p>
          </div>

          {features && features.length > 0 && (
            <ul className="relative grid grid-cols-1 gap-2 text-left text-sm text-ink-soft sm:grid-cols-2">
              {features.map((item) => (
                <li key={item} className="flex items-center gap-2">
                  <Sparkles
                    className="h-3.5 w-3.5 shrink-0 text-brand-gold-700"
                    aria-hidden="true"
                  />
                  {item}
                </li>
              ))}
            </ul>
          )}
        </div>

        {children}
      </div>
    </>
  );
}

export default PlaceholderPage;
