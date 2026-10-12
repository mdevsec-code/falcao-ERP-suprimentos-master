import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft } from 'lucide-react';

import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { ROUTE_PATHS, routeTo } from '@/constants/routes';

import { useCreateReimbursement } from '../hooks/useReimbursements';
import { ReimbursementForm } from '../components/ReimbursementForm';
import { fromReimbursementForm } from '../types';

export function ReimbursementCreatePage() {
  const { t } = useTranslation('reimbursements');
  const navigate = useNavigate();
  const createReimbursement = useCreateReimbursement();

  return (
    <>
      <PageHeader
        eyebrow={t('reimbursements:page.eyebrow')}
        title={t('reimbursements:form.title')}
        description={t('reimbursements:form.description')}
        actions={
          <Button
            variant="outline"
            leftIcon={<ArrowLeft className="h-4 w-4" />}
            onClick={() => navigate(ROUTE_PATHS.REEMBOLSOS)}
          >
            {t('common:actions.back')}
          </Button>
        }
      />
      <div className="mx-auto max-w-5xl px-6 py-8 sm:px-8">
        <ReimbursementForm
          isSubmitting={createReimbursement.isPending}
          onCancel={() => navigate(ROUTE_PATHS.REEMBOLSOS)}
          onSubmit={(values, files) =>
            createReimbursement.mutate(
              { input: fromReimbursementForm(values), files },
              { onSuccess: ({ created }) => navigate(routeTo.reimbursement(created.id)) },
            )
          }
        />
      </div>
    </>
  );
}

export default ReimbursementCreatePage;
