import { useTranslation } from 'react-i18next';
import type { UseFormRegisterReturn } from 'react-hook-form';

import { Textarea } from '@/components/ui/Textarea';

export type SupplierDescriptionField =
  'atividades' | 'atividadesZh' | 'produtosServicos' | 'produtosServicosZh';

interface SupplierDescriptionFieldsProps {
  register: (name: SupplierDescriptionField) => UseFormRegisterReturn;
  errors: Partial<Record<SupplierDescriptionField, string | undefined>>;
  /** Mostra o asterisco nos produtos (o cadastro pelo fornecedor exige em pelo menos um idioma). */
  productsRequired?: boolean;
  idPrefix?: string;
}

/**
 * Atividades e produtos/serviços em português e em chinês, lado a lado. O
 * nome de cada idioma fica escrito nele mesmo ("Português", "中文"), qualquer
 * que seja o idioma da tela — é a língua em que se escreve naquele campo.
 */
export function SupplierDescriptionFields({
  register,
  errors,
  productsRequired,
  idPrefix = 'supplier',
}: SupplierDescriptionFieldsProps) {
  const { t } = useTranslation('suppliers');
  const columns = [
    { lang: 'pt-BR', tag: 'Português', activity: 'atividades', products: 'produtosServicos' },
    { lang: 'zh-CN', tag: '中文', activity: 'atividadesZh', products: 'produtosServicosZh' },
  ] as const;

  return (
    <div className="grid grid-cols-1 gap-x-5 gap-y-4 md:grid-cols-2">
      {columns.map((column) => (
        <div key={column.lang} className="flex min-w-0 flex-col gap-4" lang={column.lang}>
          <p className="flex items-center gap-2 border-b border-border pb-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-brand-gold-700">
            {column.tag}
          </p>
          <Textarea
            {...register(column.products)}
            id={`${idPrefix}-${column.products}`}
            label={t('suppliers:form.fields.produtosServicos')}
            placeholder={t(`suppliers:form.placeholders.${column.products}`)}
            hint={t('suppliers:form.hints.produtosServicos')}
            error={errors[column.products]}
            required={productsRequired}
            rows={4}
          />
          <Textarea
            {...register(column.activity)}
            id={`${idPrefix}-${column.activity}`}
            label={t('suppliers:form.fields.atividades')}
            placeholder={t(`suppliers:form.placeholders.${column.activity}`)}
            error={errors[column.activity]}
            rows={3}
          />
        </div>
      ))}
    </div>
  );
}
