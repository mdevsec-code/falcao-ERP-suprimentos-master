import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft } from 'lucide-react';

import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { ROUTE_PATHS, routeTo } from '@/constants/routes';
import { useCreatePurchaseRequest } from '../hooks/usePurchaseRequestMutations';
import { PurchaseRequestForm } from '../components/PurchaseRequestForm';
import { fromFormInput, type PurchaseRequestFormInput } from '../types';

export function PurchaseRequestCreatePage() {
  const navigate = useNavigate();
  const { t } = useTranslation('purchaseRequests');
  const createRequest = useCreatePurchaseRequest();

  function handleSubmit(values: PurchaseRequestFormInput) {
    createRequest.mutate(fromFormInput(values), {
      onSuccess: (request) => navigate(routeTo.purchaseRequest(request.id)),
    });
  }

  return (
    <>
      <PageHeader
        eyebrow={t('purchaseRequests:page.eyebrow')}
        title={t('purchaseRequests:form.createTitle')}
        description={t('purchaseRequests:form.createDescription')}
        actions={
          <Button
            variant="outline"
            leftIcon={<ArrowLeft className="h-4 w-4" />}
            onClick={() => navigate(ROUTE_PATHS.SOLICITACOES)}
          >
            {t('common:actions.back')}
          </Button>
        }
      />

      <div className="mx-auto max-w-5xl px-6 py-8 sm:px-8">
        <PurchaseRequestForm
          onSubmit={handleSubmit}
          onCancel={() => navigate(ROUTE_PATHS.SOLICITACOES)}
          isSubmitting={createRequest.isPending}
        />
      </div>
    </>
  );
}

export default PurchaseRequestCreatePage;
