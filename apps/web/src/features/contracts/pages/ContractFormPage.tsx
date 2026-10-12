import { Link, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft } from 'lucide-react';

import { PageHeader } from '@/components/layout/PageHeader';
import { ErrorState } from '@/components/feedback/ErrorState';
import { PageSkeleton } from '@/components/feedback/PageSkeleton';
import { Button } from '@/components/ui/Button';
import { ROUTE_PATHS, routeTo } from '@/constants/routes';

import { useContract } from '../hooks/useContracts';
import { useCreateContract, useUpdateContract } from '../hooks/useContractMutations';
import { ContractForm } from '../components/ContractForm';
import { isContractEditable } from '../lib/status';
import { fromContractForm, toContractForm, type ContractFormInput } from '../types';

/** Cadastro (sem `:id`) e edição (com `:id`) de contrato na mesma página. */
export function ContractFormPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const { t } = useTranslation('contracts');

  const contractQuery = useContract(id);
  const createContract = useCreateContract();
  const updateContract = useUpdateContract(id ?? '');
  const backTo = id ? routeTo.contract(id) : ROUTE_PATHS.CONTRATOS;

  function handleSubmit(values: ContractFormInput) {
    const payload = fromContractForm(values);
    if (id) {
      updateContract.mutate(payload, { onSuccess: () => navigate(routeTo.contract(id)) });
    } else {
      createContract.mutate(payload, {
        onSuccess: (contract) => navigate(routeTo.contract(contract.id)),
      });
    }
  }

  if (isEdit && contractQuery.isLoading) return <PageSkeleton tiles={3} />;

  const contract = contractQuery.data;
  if (isEdit && (contractQuery.isError || !contract || !isContractEditable(contract.status))) {
    return (
      <div className="px-6 py-10 sm:px-8">
        <ErrorState
          title={contract ? t('contracts:form.lockedTitle') : t('contracts:detail.notFoundTitle')}
          description={
            contract
              ? t('contracts:form.lockedDescription')
              : t('contracts:detail.notFoundDescription')
          }
          action={
            <Button asChild variant="primary">
              <Link to={contract ? routeTo.contract(contract.id) : ROUTE_PATHS.CONTRATOS}>
                {t('common:actions.back')}
              </Link>
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <>
      <PageHeader
        eyebrow={t('contracts:page.eyebrow')}
        title={isEdit ? t('contracts:form.editTitle') : t('contracts:form.createTitle')}
        description={
          isEdit && contract
            ? `${contract.numero} · ${contract.objeto}`
            : t('contracts:form.createDescription')
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
        <ContractForm
          defaultValues={contract ? toContractForm(contract) : undefined}
          currentSupplier={
            contract ? { id: contract.supplierId, name: contract.supplierName } : undefined
          }
          onSubmit={handleSubmit}
          onCancel={() => navigate(backTo)}
          isSubmitting={createContract.isPending || updateContract.isPending}
          submitLabel={isEdit ? t('common:actions.save') : t('contracts:form.submitCreate')}
        />
      </div>
    </>
  );
}

export default ContractFormPage;
