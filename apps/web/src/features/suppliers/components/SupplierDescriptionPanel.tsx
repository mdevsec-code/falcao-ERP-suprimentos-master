import { useTranslation } from 'react-i18next';
import type { SupplierDetailDto } from '@falcao-erp/shared-types';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';

/** Atividades e produtos do fornecedor nos dois idiomas, lado a lado. */
export function SupplierDescriptionPanel({ supplier }: { supplier: SupplierDetailDto }) {
  const { t } = useTranslation('suppliers');
  const columns = [
    {
      lang: 'pt-BR',
      tag: 'Português',
      products: supplier.produtosServicos,
      activity: supplier.atividades,
    },
    {
      lang: 'zh-CN',
      tag: '中文',
      products: supplier.produtosServicosZh,
      activity: supplier.atividadesZh,
    },
  ];
  const empty = columns.every((column) => !column.products && !column.activity);

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle className="text-base">{t('suppliers:form.sections.description')}</CardTitle>
        {empty && <CardDescription>{t('suppliers:detail.noDescription')}</CardDescription>}
      </CardHeader>
      {!empty && (
        <CardContent className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {columns.map((column) => (
            <div key={column.lang} lang={column.lang} className="min-w-0 space-y-3">
              <p className="border-b border-border pb-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-brand-gold-700">
                {column.tag}
              </p>
              <div>
                <p className="text-xs font-semibold text-ink-soft">
                  {t('suppliers:form.fields.produtosServicos')}
                </p>
                <p className="whitespace-pre-wrap break-words text-sm text-ink">
                  {column.products || '—'}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold text-ink-soft">
                  {t('suppliers:form.fields.atividades')}
                </p>
                <p className="whitespace-pre-wrap break-words text-sm text-ink">
                  {column.activity || '—'}
                </p>
              </div>
            </div>
          ))}
        </CardContent>
      )}
    </Card>
  );
}
