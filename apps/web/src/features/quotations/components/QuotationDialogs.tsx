import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type {
  PublicQuotationDto,
  QuotationDetailDto,
  QuotationSupplierDto,
} from '@falcao-erp/shared-types';

import { Button } from '@/components/ui/Button';
import { Label } from '@/components/ui/Label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/Dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select';
import { useActiveSupplierOptions } from '@/features/suppliers/hooks/useSuppliers';
import { useAddQuotationSupplier, useSubmitQuotationPrices } from '../hooks/useQuotations';
import { PriceResponseForm } from './PriceResponseForm';

/** Itens e resposta atual no formato do formulário compartilhado com o link público. */
function toFormData(quotation: QuotationDetailDto, supplier: QuotationSupplierDto) {
  const items: PublicQuotationDto['itens'] = quotation.items.map((item) => ({
    id: item.id,
    descricao: item.descricao,
    quantidade: item.quantidade,
    unidade: item.unidade,
    marca: item.marca,
    referencia: item.referencia,
  }));
  const answer: PublicQuotationDto['resposta'] = {
    status: supplier.status,
    respondidoEm: supplier.respondidoEm,
    respondidoPor: supplier.respondidoPor,
    prazoEntregaDias: supplier.prazoEntregaDias,
    condicaoPagamento: supplier.condicaoPagamento,
    validadeProposta: supplier.validadeProposta,
    frete: supplier.frete,
    observacoes: supplier.status === 'RECUSOU' ? null : supplier.observacoes,
    precos: quotation.prices
      .filter((p) => p.quotationSupplierId === supplier.id)
      .map((p) => ({
        itemId: p.quotationItemId,
        precoUnitario: p.precoUnitario,
        marca: p.marca,
        referencia: p.referencia,
        disponivel: p.disponivel,
        observacao: p.observacao,
      })),
  };
  return { items, answer };
}

interface ManualPricesDialogProps {
  quotation: QuotationDetailDto;
  supplier: QuotationSupplierDto | null;
  onOpenChange: (open: boolean) => void;
}

/** Compras lança a proposta que chegou por e-mail, telefone ou PDF. */
export function ManualPricesDialog({ quotation, supplier, onOpenChange }: ManualPricesDialogProps) {
  const { t } = useTranslation('quotations');
  const submit = useSubmitQuotationPrices(quotation.id);
  // Fotografia ao abrir: a cotação é recarregada a cada minuto e não pode apagar o que está sendo digitado.
  const [snapshot, setSnapshot] = useState<ReturnType<typeof toFormData> | null>(null);
  useEffect(() => {
    setSnapshot(supplier ? toFormData(quotation, supplier) : null);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- só ao trocar de fornecedor
  }, [supplier?.id]);

  return (
    <Dialog open={supplier !== null} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>
            {t('quotations:manual.title', { name: supplier?.supplierName ?? '' })}
          </DialogTitle>
          <DialogDescription>{t('quotations:manual.description')}</DialogDescription>
        </DialogHeader>
        <div className="max-h-[70vh] overflow-y-auto pr-1">
          {supplier && snapshot && (
            <PriceResponseForm
              items={snapshot.items}
              answer={snapshot.answer}
              requireName={false}
              submitLabel={t('quotations:manual.submit')}
              isSubmitting={submit.isPending}
              onSubmit={({ nomeResponsavel: _ignored, ...payload }) =>
                submit.mutate(
                  { quotationSupplierId: supplier.id, payload },
                  { onSuccess: () => onOpenChange(false) },
                )
              }
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface AddSupplierDialogProps {
  quotation: QuotationDetailDto;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddSupplierDialog({ quotation, open, onOpenChange }: AddSupplierDialogProps) {
  const { t } = useTranslation('quotations');
  const add = useAddQuotationSupplier(quotation.id);
  const { data: suppliersPage } = useActiveSupplierOptions();
  const [supplierId, setSupplierId] = useState('');
  const available = useMemo(() => {
    const invited = new Set(quotation.suppliers.map((s) => s.supplierId));
    return (suppliersPage?.data ?? []).filter((s) => !invited.has(s.id));
  }, [suppliersPage, quotation.suppliers]);

  useEffect(() => {
    if (open) setSupplierId('');
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t('quotations:addSupplier.title')}</DialogTitle>
          <DialogDescription>{t('quotations:addSupplier.description')}</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="add-quotation-supplier">{t('quotations:addSupplier.label')}</Label>
          <Select value={supplierId} onValueChange={setSupplierId}>
            <SelectTrigger id="add-quotation-supplier">
              <SelectValue placeholder={t('quotations:addSupplier.placeholder')} />
            </SelectTrigger>
            <SelectContent>
              {available.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.nomeFantasia}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {available.length === 0 && (
            <p className="text-xs text-ink-soft">{t('quotations:addSupplier.none')}</p>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={add.isPending}>
            {t('common:actions.cancel')}
          </Button>
          <Button
            variant="primary"
            disabled={!supplierId}
            isLoading={add.isPending}
            onClick={() => add.mutate(supplierId, { onSuccess: () => onOpenChange(false) })}
          >
            {t('quotations:addSupplier.submit')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
