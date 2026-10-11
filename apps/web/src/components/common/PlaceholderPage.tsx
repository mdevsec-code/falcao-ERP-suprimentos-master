import { type ReactNode, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, PencilRuler } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { PageHeader } from '@/components/layout/PageHeader';
import { BlueprintBackdrop } from '@/components/brand/BlueprintBackdrop';
import { CornerBrackets } from '@/components/brand/CornerBrackets';
import { ROUTE_PATHS } from '@/constants/routes';
import falcaoMark from '@/assets/logo/falcao-mark.png';

interface PlaceholderPageProps {
  title: string;
  description?: string;
  /** Itens específicos do que está a caminho para este módulo (opcional). */
  features?: string[];
  /** Conteúdo adicional exibido abaixo da prancha de "em projeto". */
  children?: ReactNode;
}

/**
 * Módulo ainda não construído, apresentado como uma prancha "em projeto":
 * malha técnica, carimbo inclinado e o escopo previsto como itens numerados.
 */
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
        <div className="relative mx-auto max-w-3xl overflow-hidden rounded-xl border border-border bg-surface shadow-sm">
          <BlueprintBackdrop registrationMarks={false} />
          <CornerBrackets />

          <img
            src={falcaoMark}
            alt=""
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-12 -right-10 h-56 w-auto object-contain opacity-[0.05]"
          />

          {/* Carimbo */}
          <div
            aria-hidden="true"
            className="absolute right-6 top-6 hidden rotate-[-8deg] animate-scale-in rounded-md border-2 border-brand-gold-500/70 px-3 py-1 font-mono text-xs font-semibold uppercase tracking-[0.25em] text-brand-gold-700 sm:block"
            style={{ animationDelay: '300ms', animationFillMode: 'backwards' }}
          >
            {t('placeholder.stamp')}
          </div>

          <div className="relative space-y-6 p-8 sm:p-10">
            <div className="flex items-center gap-3">
              <span
                aria-hidden="true"
                className="flex h-11 w-11 items-center justify-center rounded-md bg-brand-gold-50 text-brand-gold-700"
              >
                <PencilRuler className="h-5 w-5" />
              </span>
              <div>
                <p className="font-mono text-2xs uppercase tracking-[0.22em] text-muted">
                  {t('placeholder.scopeLabel')}
                </p>
                <h2 className="font-display text-2xl font-semibold text-ink">{title}</h2>
              </div>
            </div>

            {features && features.length > 0 && (
              <ol className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {features.map((item, idx) => (
                  <li
                    key={item}
                    className="flex animate-slide-up items-start gap-3 rounded-md border border-dashed border-border bg-bg/60 px-4 py-3 backdrop-blur-sm"
                    style={{ animationDelay: `${80 + idx * 60}ms`, animationFillMode: 'backwards' }}
                  >
                    <span className="mt-0.5 font-mono text-xs font-semibold text-brand-gold-700">
                      {String(idx + 1).padStart(2, '0')}
                    </span>
                    <span className="text-sm text-ink">{item}</span>
                  </li>
                ))}
              </ol>
            )}

            <p className="border-t border-dashed border-border pt-4 font-mono text-2xs uppercase tracking-[0.16em] text-muted">
              {t('placeholder.footnote')}
            </p>
          </div>
        </div>

        {children}
      </div>
    </>
  );
}

export default PlaceholderPage;
