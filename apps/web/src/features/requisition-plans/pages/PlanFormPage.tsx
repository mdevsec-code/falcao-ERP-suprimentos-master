import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Layers, Save, Search } from 'lucide-react';
import { addDays, consolidatePlanItems, toDateOnly } from '@falcao-erp/shared-types';

import { PageHeader } from '@/components/layout/PageHeader';
import { EmptyState } from '@/components/feedback/EmptyState';
import { PageSkeleton } from '@/components/feedback/PageSkeleton';
import { Button } from '@/components/ui/Button';
import { Checkbox } from '@/components/ui/Checkbox';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { ROUTE_PATHS, routeTo } from '@/constants/routes';
import { PurchaseRequestStatusBadge } from '@/features/purchase-requests/components/PurchaseRequestBadges';
import { cn } from '@/utils/cn';
import { formatDate } from '@/utils/format';
import { useCreatePlan, usePlan, usePlanCandidates, useUpdatePlan } from '../hooks/usePlans';

/**
 * Monta (ou ajusta, enquanto rascunho) o plano: escolhe as solicitações
 * aprovadas — por obra, normalmente — e confere a lista consolidada que os
 * fornecedores vão ver.
 */
export function PlanFormPage() {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();
  const { t } = useTranslation('plans');
  const existing = usePlan(id);
  const candidates = usePlanCandidates(id);
  const create = useCreatePlan();
  const update = useUpdatePlan(id ?? '');

  const [titulo, setTitulo] = useState('');
  const [obra, setObra] = useState('');
  const [prazo, setPrazo] = useState(addDays(toDateOnly(), 7));
  const [observacoes, setObservacoes] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState('');
  const [loaded, setLoaded] = useState(!isEdit);

  useEffect(() => {
    if (!isEdit || loaded || !existing.data) return;
    const plan = existing.data;
    setTitulo(plan.titulo);
    setObra(plan.obra ?? '');
    setPrazo(plan.prazoResposta);
    setObservacoes(plan.observacoes ?? '');
    setSelected(new Set(plan.requests.map((request) => request.id)));
    setLoaded(true);
  }, [existing.data, isEdit, loaded]);

  const available = useMemo(() => candidates.data ?? [], [candidates.data]);
  const visible = useMemo(() => {
    const term = filter.trim().toLowerCase();
    if (!term) return available;
    return available.filter(
      (request) =>
        request.title.toLowerCase().includes(term) ||
        (request.costCenter ?? '').toLowerCase().includes(term) ||
        request.requesterName.toLowerCase().includes(term),
    );
  }, [available, filter]);
  const obras = useMemo(
    () => [...new Set(available.map((r) => r.costCenter).filter((c): c is string => !!c))].sort(),
    [available],
  );

  const chosen = useMemo(
    () => available.filter((request) => selected.has(request.id)),
    [available, selected],
  );
  const items = useMemo(
    () =>
      consolidatePlanItems(
        chosen.map((request) => ({
          purchaseRequestId: request.id,
          purchaseRequestTitle: request.title,
          items: request.items,
        })),
      ),
    [chosen],
  );
  const totalLines = chosen.reduce((sum, request) => sum + request.items.length, 0);

  function toggle(requestId: string) {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(requestId)) next.delete(requestId);
      else next.add(requestId);
      return next;
    });
  }

  /** Atalho: marca as solicitações da obra e usa o nome dela no plano. */
  function pickObra(name: string) {
    setSelected(new Set(available.filter((r) => r.costCenter === name).map((r) => r.id)));
    if (!obra) setObra(name);
    if (!titulo) setTitulo(t('plans:form.defaultTitle', { obra: name }));
  }

  const prazoInvalid = !prazo || prazo < toDateOnly();
  const canSave = titulo.trim().length >= 3 && selected.size > 0 && !prazoInvalid;
  const saving = create.isPending || update.isPending;

  function save() {
    if (!canSave) return;
    const payload = {
      titulo: titulo.trim(),
      obra: obra.trim() || undefined,
      prazoResposta: prazo,
      observacoes: observacoes.trim() || undefined,
      purchaseRequestIds: [...selected],
    };
    const onSuccess = (plan: { id: string }) => navigate(routeTo.plan(plan.id));
    if (isEdit) update.mutate(payload, { onSuccess });
    else create.mutate(payload, { onSuccess });
  }

  if (isEdit && (existing.isLoading || !loaded)) return <PageSkeleton tiles={2} />;

  return (
    <>
      <PageHeader
        eyebrow={t('plans:page.eyebrow')}
        title={isEdit ? t('plans:form.editTitle') : t('plans:form.newTitle')}
        description={t('plans:form.description')}
        actions={
          <>
            <Button
              variant="ghost"
              leftIcon={<ArrowLeft className="h-4 w-4" />}
              onClick={() => navigate(id ? routeTo.plan(id) : ROUTE_PATHS.PLANOS)}
            >
              {t('common:actions.cancel')}
            </Button>
            <Button
              variant="primary"
              leftIcon={<Save className="h-4 w-4" />}
              onClick={save}
              disabled={!canSave}
              isLoading={saving}
            >
              {t('plans:form.save')}
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-8 px-6 py-8 sm:px-8 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        <div className="space-y-6">
          <section className="space-y-4 rounded-lg border border-border bg-surface p-5 shadow-sm">
            <Input
              label={t('plans:form.fields.title')}
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              maxLength={180}
              name="plan-title"
              required
            />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input
                label={t('plans:form.fields.workSite')}
                hint={t('plans:form.hints.workSite')}
                value={obra}
                onChange={(e) => setObra(e.target.value)}
                maxLength={120}
                name="plan-work-site"
                list="plan-work-sites"
              />
              <datalist id="plan-work-sites">
                {obras.map((name) => (
                  <option key={name} value={name} />
                ))}
              </datalist>
              <Input
                type="date"
                label={t('plans:form.fields.deadline')}
                value={prazo}
                min={toDateOnly()}
                onChange={(e) => setPrazo(e.target.value)}
                error={prazoInvalid ? t('plans:form.errors.deadline') : undefined}
                name="plan-deadline"
                required
              />
            </div>
            <Textarea
              label={t('plans:form.fields.notes')}
              hint={t('plans:form.hints.notes')}
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              maxLength={2000}
              rows={3}
              name="plan-notes"
            />
          </section>

          <section aria-labelledby="plan-requests" className="space-y-3">
            <div className="flex flex-wrap items-end justify-between gap-2">
              <h2 id="plan-requests" className="text-base font-semibold text-ink">
                {t('plans:form.requestsTitle', { count: selected.size })}
              </h2>
              <Input
                aria-label={t('plans:form.filter')}
                placeholder={t('plans:form.filter')}
                leftIcon={<Search className="h-4 w-4" />}
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                name="plan-request-filter"
                className="w-64"
              />
            </div>
            {obras.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="text-ink-soft">{t('plans:form.byWorkSite')}</span>
                {obras.map((name) => (
                  <Button key={name} size="sm" variant="outline" onClick={() => pickObra(name)}>
                    {name}
                  </Button>
                ))}
              </div>
            )}

            {candidates.isLoading && (
              <p className="text-sm text-ink-soft">{t('plans:form.loading')}</p>
            )}
            {candidates.data && available.length === 0 && (
              <EmptyState
                icon={<Layers className="h-6 w-6" />}
                title={t('plans:form.noCandidatesTitle')}
                description={t('plans:form.noCandidatesDescription')}
              />
            )}
            {visible.length > 0 && (
              <ul className="max-h-[52vh] divide-y divide-border overflow-y-auto rounded-md border border-border bg-surface">
                {visible.map((request) => {
                  const checked = selected.has(request.id);
                  return (
                    <li
                      key={request.id}
                      className={cn(
                        'flex items-start gap-3 px-3 py-2.5 hover:bg-hover',
                        checked && 'bg-brand-gold-50/60',
                      )}
                    >
                      <Checkbox
                        id={`plan-request-${request.id}`}
                        checked={checked}
                        onCheckedChange={() => toggle(request.id)}
                        className="mt-0.5"
                      />
                      <label
                        htmlFor={`plan-request-${request.id}`}
                        className="min-w-0 flex-1 cursor-pointer text-sm"
                      >
                        <span className="flex flex-wrap items-center gap-2">
                          <span className="font-medium text-ink">{request.title}</span>
                          <PurchaseRequestStatusBadge status={request.status} />
                        </span>
                        <span className="text-xs text-ink-soft">
                          {[
                            request.costCenter,
                            request.requesterName,
                            t('plans:form.itemCount', { count: request.itemCount }),
                            formatDate(request.createdAt),
                          ]
                            .filter(Boolean)
                            .join(' · ')}
                        </span>
                      </label>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>

        <section aria-labelledby="plan-preview" className="space-y-3">
          <h2 id="plan-preview" className="text-base font-semibold text-ink">
            {t('plans:form.previewTitle', { count: items.length })}
          </h2>
          <p className="text-sm text-ink-soft">
            {selected.size === 0
              ? t('plans:form.previewEmpty')
              : t('plans:form.previewHint', { lines: totalLines, items: items.length })}
          </p>
          {items.length > 0 && <PlanItemsTable items={items} />}
        </section>
      </div>
    </>
  );
}

/** Itens consolidados — usado na prévia do formulário e no detalhe do plano. */
export function PlanItemsTable({ items }: { items: ReturnType<typeof consolidatePlanItems> }) {
  const { t } = useTranslation('plans');
  return (
    <div className="overflow-x-auto rounded-md border border-border bg-surface">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-border bg-bg text-xs text-ink-soft">
          <tr>
            <th className="w-10 px-3 py-2">{t('plans:items.number')}</th>
            <th className="px-3 py-2">{t('plans:items.description')}</th>
            <th className="px-3 py-2 text-right">{t('plans:items.quantity')}</th>
            <th className="px-3 py-2">{t('plans:items.origin')}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {items.map((item, index) => {
            const extra = [item.marca, item.referencia].filter(Boolean).join(' · ');
            return (
              <tr key={item.chave} className="align-top">
                <td className="px-3 py-2 font-mono text-ink-soft">{index + 1}</td>
                <td className="px-3 py-2">
                  <span className="text-ink">{item.descricao}</span>
                  {(extra || item.productCodigo) && (
                    <span className="block text-xs text-ink-soft">
                      {[item.productCodigo, extra].filter(Boolean).join(' · ')}
                    </span>
                  )}
                </td>
                <td className="whitespace-nowrap px-3 py-2 text-right font-medium tabular-nums text-ink">
                  {Number(item.quantidade).toLocaleString()} {item.unidade}
                </td>
                <td className="px-3 py-2 text-xs text-ink-soft">
                  {item.origens.length === 1
                    ? item.origens[0]?.purchaseRequestTitle
                    : t('plans:items.fromRequests', { count: item.origens.length })}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default PlanFormPage;
