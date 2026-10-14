import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Scale, Search } from 'lucide-react';
import { addDays, toDateOnly, type PurchaseRequestDetailDto } from '@falcao-erp/shared-types';

import { Button } from '@/components/ui/Button';
import { Checkbox } from '@/components/ui/Checkbox';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/Dialog';
import { routeTo } from '@/constants/routes';
import { SUPPLIER_CATEGORY_LABELS } from '@/constants/enums';
import { useActiveSupplierOptions } from '@/features/suppliers/hooks/useSuppliers';
import { cn } from '@/utils/cn';
import { useCreateQuotation } from '../hooks/useQuotations';

const MAX_SUPPLIERS = 20;

interface CreateQuotationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  purchaseRequest: PurchaseRequestDetailDto;
}

/** Abre a cotação a partir da solicitação aprovada: itens, fornecedores e prazo. */
export function CreateQuotationDialog({
  open,
  onOpenChange,
  purchaseRequest,
}: CreateQuotationDialogProps) {
  const { t } = useTranslation('quotations');
  const navigate = useNavigate();
  const create = useCreateQuotation();
  const { data: suppliersPage } = useActiveSupplierOptions();
  const suppliers = useMemo(() => suppliersPage?.data ?? [], [suppliersPage]);

  const [titulo, setTitulo] = useState(purchaseRequest.title);
  const [prazo, setPrazo] = useState(addDays(toDateOnly(), 5));
  const [observacoes, setObservacoes] = useState('');
  const [itemIds, setItemIds] = useState<Set<string>>(new Set());
  const [supplierIds, setSupplierIds] = useState<Set<string>>(new Set());
  const [supplierSearch, setSupplierSearch] = useState('');

  useEffect(() => {
    if (!open) return;
    setTitulo(purchaseRequest.title);
    setPrazo(addDays(toDateOnly(), 5));
    setObservacoes('');
    setItemIds(new Set(purchaseRequest.items.map((item) => item.id)));
    setSupplierIds(new Set());
    setSupplierSearch('');
  }, [open, purchaseRequest]);

  const visibleSuppliers = useMemo(() => {
    const term = supplierSearch.trim().toLowerCase();
    if (!term) return suppliers;
    return suppliers.filter(
      (s) =>
        s.nomeFantasia.toLowerCase().includes(term) ||
        s.razaoSocial.toLowerCase().includes(term) ||
        SUPPLIER_CATEGORY_LABELS[s.categoria].toLowerCase().includes(term),
    );
  }, [suppliers, supplierSearch]);

  function toggle(set: Set<string>, id: string, update: (next: Set<string>) => void) {
    const next = new Set(set);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    update(next);
  }

  const prazoInvalid = !prazo || prazo < toDateOnly();
  const canSubmit =
    itemIds.size > 0 &&
    supplierIds.size > 0 &&
    supplierIds.size <= MAX_SUPPLIERS &&
    !prazoInvalid &&
    titulo.trim().length >= 3;

  function submit() {
    if (!canSubmit) return;
    create.mutate(
      {
        purchaseRequestId: purchaseRequest.id,
        titulo: titulo.trim(),
        prazoResposta: prazo,
        observacoes: observacoes.trim() || undefined,
        supplierIds: [...supplierIds],
        itemIds: itemIds.size === purchaseRequest.items.length ? undefined : [...itemIds],
      },
      {
        onSuccess: (quotation) => {
          onOpenChange(false);
          navigate(routeTo.quotation(quotation.id));
        },
      },
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{t('quotations:create.title')}</DialogTitle>
          <DialogDescription>{t('quotations:create.description')}</DialogDescription>
        </DialogHeader>

        <div className="grid max-h-[65vh] grid-cols-1 gap-5 overflow-y-auto pr-1 lg:grid-cols-2">
          <div className="space-y-4">
            <Input
              label={t('quotations:create.fields.title')}
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              maxLength={180}
              name="quotation-title"
              required
            />
            <Input
              type="date"
              label={t('quotations:create.fields.deadline')}
              hint={t('quotations:create.hints.deadline')}
              value={prazo}
              min={toDateOnly()}
              onChange={(e) => setPrazo(e.target.value)}
              error={prazoInvalid ? t('quotations:create.errors.deadline') : undefined}
              name="quotation-deadline"
              required
            />
            <Textarea
              label={t('quotations:create.fields.notes')}
              hint={t('quotations:create.hints.notes')}
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              maxLength={2000}
              rows={3}
              name="quotation-notes"
            />

            <fieldset className="space-y-2">
              <legend className="text-xs font-semibold text-ink-soft">
                {t('quotations:create.fields.items', { count: itemIds.size })}
              </legend>
              <ul className="divide-y divide-border rounded-md border border-border">
                {purchaseRequest.items.map((item) => (
                  <li key={item.id} className="flex items-start gap-3 px-3 py-2 hover:bg-hover">
                    <Checkbox
                      id={`quote-item-${item.id}`}
                      checked={itemIds.has(item.id)}
                      onCheckedChange={() => toggle(itemIds, item.id, setItemIds)}
                      className="mt-0.5"
                    />
                    <label
                      htmlFor={`quote-item-${item.id}`}
                      className="min-w-0 flex-1 cursor-pointer text-sm"
                    >
                      <span className="block text-ink">{item.description}</span>
                      <span className="text-xs text-ink-soft">
                        {Number(item.quantity).toLocaleString()} {item.unit}
                        {item.marca ? ` · ${item.marca}` : ''}
                        {item.referencia ? ` · ${item.referencia}` : ''}
                      </span>
                    </label>
                  </li>
                ))}
              </ul>
            </fieldset>
          </div>

          <fieldset className="space-y-2">
            <legend className="text-xs font-semibold text-ink-soft">
              {t('quotations:create.fields.suppliers', {
                count: supplierIds.size,
                max: MAX_SUPPLIERS,
              })}
            </legend>
            <Input
              aria-label={t('quotations:create.supplierSearch')}
              placeholder={t('quotations:create.supplierSearch')}
              leftIcon={<Search className="h-4 w-4" />}
              value={supplierSearch}
              onChange={(e) => setSupplierSearch(e.target.value)}
              name="quotation-supplier-search"
            />
            <ul className="max-h-[42vh] divide-y divide-border overflow-y-auto rounded-md border border-border">
              {visibleSuppliers.map((supplier) => {
                const checked = supplierIds.has(supplier.id);
                return (
                  <li
                    key={supplier.id}
                    className={cn(
                      'flex items-start gap-3 px-3 py-2 hover:bg-hover',
                      checked && 'bg-brand-gold-50/60',
                    )}
                  >
                    <Checkbox
                      id={`quote-supplier-${supplier.id}`}
                      checked={checked}
                      onCheckedChange={() => toggle(supplierIds, supplier.id, setSupplierIds)}
                      className="mt-0.5"
                    />
                    <label
                      htmlFor={`quote-supplier-${supplier.id}`}
                      className="min-w-0 flex-1 cursor-pointer text-sm"
                    >
                      <span className="block font-medium text-ink">{supplier.nomeFantasia}</span>
                      <span className="text-xs text-ink-soft">
                        {SUPPLIER_CATEGORY_LABELS[supplier.categoria]} · {supplier.cidade}/
                        {supplier.estado}
                      </span>
                    </label>
                  </li>
                );
              })}
              {visibleSuppliers.length === 0 && (
                <li className="px-3 py-6 text-center text-sm text-ink-soft">
                  {t('quotations:create.noSuppliers')}
                </li>
              )}
            </ul>
            {supplierIds.size > MAX_SUPPLIERS && (
              <p className="text-xs text-danger">
                {t('quotations:create.errors.tooManySuppliers', { max: MAX_SUPPLIERS })}
              </p>
            )}
          </fieldset>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={create.isPending}>
            {t('common:actions.cancel')}
          </Button>
          <Button
            variant="primary"
            leftIcon={<Scale className="h-4 w-4" />}
            onClick={submit}
            disabled={!canSubmit}
            isLoading={create.isPending}
          >
            {t('quotations:create.submit')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
