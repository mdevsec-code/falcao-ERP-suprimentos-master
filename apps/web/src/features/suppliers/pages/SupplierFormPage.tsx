import { Link, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft } from 'lucide-react';

import { PageHeader } from '@/components/layout/PageHeader';
import { ErrorState } from '@/components/feedback/ErrorState';
import { PageSkeleton } from '@/components/feedback/PageSkeleton';
import { Button } from '@/components/ui/Button';
import { ROUTE_PATHS, routeTo } from '@/constants/routes';

import { useSupplier } from '../hooks/useSuppliers';
import { useCreateSupplier, useUpdateSupplier } from '../hooks/useSupplierMutations';
import { SupplierForm } from '../components/SupplierForm';
import { fromFormInput, toFormInput, type SupplierFormInput } from '../types';

/**
 * Cadastro e edição de fornecedor na mesma página: com `:id` na rota é
 * edição (carrega o fornecedor e faz PATCH), sem `:id` é criação (POST).
 */
export function SupplierFormPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const { t } = useTranslation('suppliers');

  const supplierQuery = useSupplier(id);
  const createSupplier = useCreateSupplier();
  const updateSupplier = useUpdateSupplier(id ?? '');

  const backTo = id ? routeTo.supplier(id) : ROUTE_PATHS.FORNECEDORES;

  function handleSubmit(values: SupplierFormInput) {
    const payload = fromFormInput(values);
    if (id) {
      updateSupplier.mutate(payload, { onSuccess: () => navigate(routeTo.supplier(id)) });
    } else {
      createSupplier.mutate(payload, {
        onSuccess: (supplier) => navigate(routeTo.supplier(supplier.id)),
      });
    }
  }

  if (isEdit && supplierQuery.isLoading) return <PageSkeleton tiles={3} />;

  if (isEdit && (supplierQuery.isError || !supplierQuery.data)) {
    return (
      <div className="px-6 py-10 sm:px-8">
        <ErrorState
          title={t('suppliers:detail.notFoundTitle')}
          description={t('suppliers:detail.notFoundDescription')}
          action={
            <Button asChild variant="primary">
              <Link to={ROUTE_PATHS.FORNECEDORES}>{t('suppliers:actions.backToList')}</Link>
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <>
      <PageHeader
        eyebrow={t('suppliers:page.eyebrow')}
        title={isEdit ? t('suppliers:form.editTitle') : t('suppliers:form.createTitle')}
        description={
          isEdit ? (supplierQuery.data?.nomeFantasia ?? '') : t('suppliers:form.createDescription')
        }
        actions={
          <Button
            variant="outline"
            leftIcon={<ArrowLeft className="h-4 w-4" />}
            onClick={() => navigate(backTo)}
          >
            {t('common:actions.back')}
          </Button>
        }
      />

      <div className="mx-auto max-w-4xl px-6 py-8 sm:px-8">
        <SupplierForm
          defaultValues={supplierQuery.data ? toFormInput(supplierQuery.data) : undefined}
          onSubmit={handleSubmit}
          onCancel={() => navigate(backTo)}
          isSubmitting={createSupplier.isPending || updateSupplier.isPending}
          submitLabel={isEdit ? t('suppliers:form.submitEdit') : t('suppliers:form.submitCreate')}
        />
      </div>
    </>
  );
}

export default SupplierFormPage;
