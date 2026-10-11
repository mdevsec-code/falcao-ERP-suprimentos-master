import { Link, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft } from 'lucide-react';

import { PageHeader } from '@/components/layout/PageHeader';
import { ErrorState } from '@/components/feedback/ErrorState';
import { PageSkeleton } from '@/components/feedback/PageSkeleton';
import { Button } from '@/components/ui/Button';
import { ROUTE_PATHS, routeTo } from '@/constants/routes';

import { useProduct } from '../hooks/useProducts';
import { useCreateProduct, useUpdateProduct } from '../hooks/useProductMutations';
import { ProductForm } from '../components/ProductForm';
import { fromFormInput, toFormInput, type ProductFormInput } from '../types';

/** Cadastro (sem `:id`) e edição (com `:id`) de produto na mesma página. */
export function ProductFormPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const { t } = useTranslation('products');

  const productQuery = useProduct(id);
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct(id ?? '');

  const backTo = id ? routeTo.product(id) : ROUTE_PATHS.PRODUTOS;

  function handleSubmit(values: ProductFormInput) {
    const payload = fromFormInput(values, { isEdit });
    if (id) {
      updateProduct.mutate(payload, { onSuccess: () => navigate(routeTo.product(id)) });
    } else {
      createProduct.mutate(payload, {
        onSuccess: (product) => navigate(routeTo.product(product.id)),
      });
    }
  }

  if (isEdit && productQuery.isLoading) return <PageSkeleton tiles={3} />;

  if (isEdit && (productQuery.isError || !productQuery.data)) {
    return (
      <div className="px-6 py-10 sm:px-8">
        <ErrorState
          title={t('products:detail.notFoundTitle')}
          description={t('products:detail.notFoundDescription')}
          action={
            <Button asChild variant="primary">
              <Link to={ROUTE_PATHS.PRODUTOS}>{t('products:actions.backToList')}</Link>
            </Button>
          }
        />
      </div>
    );
  }

  const product = productQuery.data;
  const linkedSuppliers = product
    ? [
        ...(product.primarySupplier ? [product.primarySupplier] : []),
        ...product.alternativeSuppliers,
      ]
    : [];

  return (
    <>
      <PageHeader
        eyebrow={t('products:page.eyebrow')}
        title={isEdit ? t('products:form.editTitle') : t('products:form.createTitle')}
        description={isEdit ? (product?.nome ?? '') : t('products:form.createDescription')}
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
        <ProductForm
          defaultValues={product ? toFormInput(product) : undefined}
          linkedSuppliers={linkedSuppliers}
          showInitialPrice={!isEdit}
          onSubmit={handleSubmit}
          onCancel={() => navigate(backTo)}
          isSubmitting={createProduct.isPending || updateProduct.isPending}
          submitLabel={isEdit ? t('products:form.submitEdit') : t('products:form.submitCreate')}
        />
      </div>
    </>
  );
}

export default ProductFormPage;
