import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Trans, useTranslation } from 'react-i18next';
import {
  ArrowLeft,
  Building2,
  Clock,
  FileStack,
  FileText,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Power,
  Star,
  Upload,
  User,
} from 'lucide-react';
import { ContactType } from '@falcao-erp/shared-types';

import { PageHeader } from '@/components/layout/PageHeader';
import { InfoTile } from '@/components/data-display/InfoTile';
import { FileList, type FileListItem } from '@/components/data-display/FileList';
import { EmptyState } from '@/components/feedback/EmptyState';
import { ErrorState } from '@/components/feedback/ErrorState';
import { PageSkeleton } from '@/components/feedback/PageSkeleton';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { Can } from '@/features/auth/components/Can';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { PERMISSIONS } from '@/constants/permissions';
import { ROUTE_PATHS, routeTo } from '@/constants/routes';
import { DOCUMENT_CATEGORY_LABELS, SUPPLIER_CATEGORY_LABELS } from '@/constants/enums';
import { formatCNPJ, formatDate, formatDateTime } from '@/utils/format';

import { useSupplier } from '../hooks/useSuppliers';
import {
  useAddEvaluation,
  useRemoveSupplierDocument,
  useSetSupplierActive,
  useUploadSupplierDocument,
} from '../hooks/useSupplierMutations';
import {
  ScoreStars,
  SupplierCategoryBadge,
  SupplierScore,
  SupplierStatusBadge,
} from '../components/SupplierBadges';
import { EvaluationDialog } from '../components/EvaluationDialog';
import { UploadDocumentDialog } from '../components/UploadDocumentDialog';

const CONTACT_ICONS = { [ContactType.PHONE]: Phone, [ContactType.EMAIL]: Mail } as const;

export function SupplierDetailPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation('suppliers');
  const { can } = useAuth();
  const { data: supplier, isLoading, isError, refetch } = useSupplier(id);

  const setActive = useSetSupplierActive(id);
  const addEvaluation = useAddEvaluation(id);
  const uploadDocument = useUploadSupplierDocument(id);
  const removeDocument = useRemoveSupplierDocument(id);

  const [confirmToggle, setConfirmToggle] = useState(false);
  const [evaluationOpen, setEvaluationOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [documentToRemove, setDocumentToRemove] = useState<FileListItem | null>(null);

  if (isLoading) return <PageSkeleton />;

  if (isError || !supplier) {
    return (
      <div className="px-6 py-10 sm:px-8">
        <ErrorState
          title={t('suppliers:detail.notFoundTitle')}
          description={t('suppliers:detail.notFoundDescription')}
          action={
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => void refetch()}>
                {t('common:actions.retry')}
              </Button>
              <Button asChild variant="primary">
                <Link to={ROUTE_PATHS.FORNECEDORES}>{t('suppliers:actions.backToList')}</Link>
              </Button>
            </div>
          }
        />
      </div>
    );
  }

  const canWrite = can(PERMISSIONS.SUPPLIER_WRITE);
  const documents: FileListItem[] = supplier.documents.map((doc) => ({
    id: doc.id,
    fileName: doc.fileName,
    size: doc.size,
    url: doc.url,
    uploadedByName: doc.uploadedByName,
    uploadedAt: doc.uploadedAt,
    tag: (
      <Badge variant="outline" size="sm">
        {DOCUMENT_CATEGORY_LABELS[doc.category]}
      </Badge>
    ),
  }));

  return (
    <>
      <PageHeader
        eyebrow={SUPPLIER_CATEGORY_LABELS[supplier.categoria]}
        title={supplier.nomeFantasia}
        description={supplier.razaoSocial}
        actions={
          <>
            <Button
              variant="outline"
              leftIcon={<ArrowLeft className="h-4 w-4" />}
              onClick={() => navigate(ROUTE_PATHS.FORNECEDORES)}
            >
              {t('common:actions.back')}
            </Button>
            <Can permission={PERMISSIONS.SUPPLIER_WRITE}>
              <Button
                variant="outline"
                leftIcon={<Pencil className="h-4 w-4" />}
                onClick={() => navigate(routeTo.supplierEdit(id))}
              >
                {t('common:actions.edit')}
              </Button>
              <Button
                variant={supplier.isActive ? 'danger' : 'primary'}
                leftIcon={<Power className="h-4 w-4" />}
                onClick={() => setConfirmToggle(true)}
              >
                {supplier.isActive
                  ? t('suppliers:actions.deactivate')
                  : t('suppliers:actions.reactivate')}
              </Button>
            </Can>
          </>
        }
      />

      <div className="space-y-6 px-6 py-8 sm:px-8">
        <div className="flex animate-fade-in flex-wrap items-center gap-3">
          <SupplierStatusBadge isActive={supplier.isActive} />
          <SupplierCategoryBadge categoria={supplier.categoria} />
          <SupplierScore score={supplier.averageScore} />
        </div>

        <Tabs defaultValue="overview">
          <TabsList className="h-auto flex-wrap justify-start">
            <TabsTrigger value="overview">{t('suppliers:detail.tabs.overview')}</TabsTrigger>
            <TabsTrigger value="contacts">
              {t('suppliers:detail.tabs.contacts', { count: supplier.contacts.length })}
            </TabsTrigger>
            <TabsTrigger value="evaluations">
              {t('suppliers:detail.tabs.evaluations', { count: supplier.evaluations.length })}
            </TabsTrigger>
            <TabsTrigger value="documents">
              {t('suppliers:detail.tabs.documents', { count: supplier.documents.length })}
            </TabsTrigger>
            <TabsTrigger value="contracts">{t('suppliers:detail.tabs.contracts')}</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              <InfoTile
                icon={Building2}
                label={t('suppliers:form.fields.razaoSocial')}
                value={supplier.razaoSocial}
              />
              <InfoTile
                icon={FileText}
                label={t('suppliers:form.fields.cnpj')}
                value={<span className="font-mono">{formatCNPJ(supplier.cnpj)}</span>}
              />
              <InfoTile
                icon={FileText}
                label={t('suppliers:form.fields.inscricaoEstadual')}
                value={supplier.inscricaoEstadual ?? '—'}
              />
              <InfoTile
                icon={User}
                label={t('suppliers:form.fields.responsavel')}
                value={supplier.responsavel}
              />
              <InfoTile
                icon={MapPin}
                label={t('suppliers:detail.location')}
                value={`${supplier.cidade} / ${supplier.estado}`}
              />
              <InfoTile
                icon={Clock}
                label={t('suppliers:detail.createdAt')}
                value={formatDate(supplier.createdAt) ?? '—'}
              />
            </div>
          </TabsContent>

          <TabsContent value="contacts">
            {supplier.contacts.length === 0 ? (
              <EmptyState
                icon={<Phone className="h-6 w-6" />}
                title={t('suppliers:detail.noContacts')}
              />
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {supplier.contacts.map((contact) => {
                  const Icon = CONTACT_ICONS[contact.type];
                  const href =
                    contact.type === ContactType.EMAIL
                      ? `mailto:${contact.value}`
                      : `tel:${contact.value.replace(/[^\d+]/g, '')}`;
                  return (
                    <InfoTile
                      key={contact.id}
                      icon={Icon}
                      label={contact.label}
                      value={
                        <a href={href} className="hover:text-brand-gold-700 hover:underline">
                          {contact.value}
                        </a>
                      }
                    />
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="evaluations" className="space-y-4">
            <Can permission={PERMISSIONS.SUPPLIER_EVALUATE}>
              <div className="flex justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={<Star className="h-3.5 w-3.5" />}
                  onClick={() => setEvaluationOpen(true)}
                >
                  {t('suppliers:actions.evaluate')}
                </Button>
              </div>
            </Can>
            {supplier.evaluations.length === 0 ? (
              <EmptyState
                icon={<Star className="h-6 w-6" />}
                title={t('suppliers:evaluations.emptyTitle')}
                description={t('suppliers:evaluations.emptyDescription')}
              />
            ) : (
              <ul className="space-y-3">
                {supplier.evaluations.map((evaluation, idx) => (
                  <li
                    key={evaluation.id}
                    className="animate-slide-up"
                    style={{ animationDelay: `${idx * 40}ms`, animationFillMode: 'backwards' }}
                  >
                    <Card>
                      <CardContent className="space-y-2">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <ScoreStars score={evaluation.score} />
                          <span className="text-xs text-ink-soft">
                            {formatDateTime(evaluation.createdAt)}
                          </span>
                        </div>
                        {evaluation.comment && (
                          <p className="text-sm text-ink">{evaluation.comment}</p>
                        )}
                        <p className="text-xs text-ink-soft">
                          {t('suppliers:evaluations.by', { name: evaluation.authorName })}
                        </p>
                      </CardContent>
                    </Card>
                  </li>
                ))}
              </ul>
            )}
          </TabsContent>

          <TabsContent value="documents" className="space-y-4">
            <Can permission={PERMISSIONS.SUPPLIER_WRITE}>
              <div className="flex justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={<Upload className="h-3.5 w-3.5" />}
                  onClick={() => setUploadOpen(true)}
                >
                  {t('suppliers:actions.uploadDocument')}
                </Button>
              </div>
            </Can>
            {documents.length === 0 ? (
              <EmptyState
                icon={<FileStack className="h-6 w-6" />}
                title={t('suppliers:documents.emptyTitle')}
                description={t('suppliers:documents.emptyDescription')}
              />
            ) : (
              <FileList items={documents} onRemove={canWrite ? setDocumentToRemove : undefined} />
            )}
          </TabsContent>

          <TabsContent value="contracts">
            <EmptyState
              icon={<FileText className="h-6 w-6" />}
              title={t('suppliers:detail.contractsSoonTitle')}
              description={t('suppliers:detail.contractsSoonDescription')}
            />
          </TabsContent>
        </Tabs>
      </div>

      <ConfirmDialog
        open={confirmToggle}
        onOpenChange={setConfirmToggle}
        title={
          supplier.isActive
            ? t('suppliers:confirm.deactivateTitle')
            : t('suppliers:confirm.reactivateTitle')
        }
        description={
          <Trans
            i18nKey={
              supplier.isActive
                ? 'suppliers:confirm.deactivateDescription'
                : 'suppliers:confirm.reactivateDescription'
            }
            values={{ name: supplier.nomeFantasia }}
            components={{ strong: <strong className="text-ink" /> }}
          />
        }
        destructive={supplier.isActive}
        confirmLabel={
          supplier.isActive ? t('suppliers:actions.deactivate') : t('suppliers:actions.reactivate')
        }
        isSubmitting={setActive.isPending}
        onConfirm={() =>
          setActive.mutate(!supplier.isActive, { onSuccess: () => setConfirmToggle(false) })
        }
      />

      <ConfirmDialog
        open={documentToRemove !== null}
        onOpenChange={(open) => !open && setDocumentToRemove(null)}
        title={t('suppliers:confirm.removeDocumentTitle')}
        description={
          <Trans
            i18nKey="suppliers:confirm.removeDocumentDescription"
            values={{ name: documentToRemove?.fileName ?? '' }}
            components={{ strong: <strong className="text-ink" /> }}
          />
        }
        destructive
        confirmLabel={t('common:actions.remove')}
        isSubmitting={removeDocument.isPending}
        onConfirm={() =>
          documentToRemove &&
          removeDocument.mutate(documentToRemove.id, {
            onSuccess: () => setDocumentToRemove(null),
          })
        }
      />

      <EvaluationDialog
        open={evaluationOpen}
        onOpenChange={setEvaluationOpen}
        isSubmitting={addEvaluation.isPending}
        onSubmit={(input) =>
          addEvaluation.mutate(input, { onSuccess: () => setEvaluationOpen(false) })
        }
      />

      <UploadDocumentDialog
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        isSubmitting={uploadDocument.isPending}
        onSubmit={(input) =>
          uploadDocument.mutate(input, { onSuccess: () => setUploadOpen(false) })
        }
      />
    </>
  );
}

export default SupplierDetailPage;
