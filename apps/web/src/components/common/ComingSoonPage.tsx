import { type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { PlaceholderPage } from './PlaceholderPage';

/**
 * Módulos previstos na navegação mas ainda não construídos — título vem de
 * `common:nav.<navKey>` e a lista do que está a caminho de
 * `common:placeholder.features.<navKey>`.
 */
export function ComingSoonPage({ navKey }: { navKey: string }): ReactNode {
  const { t } = useTranslation('common');
  return (
    <PlaceholderPage
      title={t(`nav.${navKey}` as never)}
      features={t(`placeholder.features.${navKey}`, { returnObjects: true }) as string[]}
    />
  );
}
