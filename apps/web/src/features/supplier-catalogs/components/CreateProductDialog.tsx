import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ProductCategory,
  UnitOfMeasure,
  type SupplierCatalogItemDto,
} from '@falcao-erp/shared-types';

import { SelectField } from '@/components/common/SelectField';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/Dialog';
import { PRODUCT_CATEGORY_LABELS, UNIT_LABELS } from '@/constants/enums';
import { useDisciplines } from '@/features/disciplines/hooks/useDisciplines';
import type { CreateProductFromItemPayload } from '../services/catalogs.api';

interface CreateProductDialogProps {
  item: SupplierCatalogItemDto | null;
  onOpenChange: (open: boolean) => void;
  onSubmit: (payload: CreateProductFromItemPayload) => void;
  isSubmitting: boolean;
}

const UNITS = Object.values(UnitOfMeasure) as string[];

/** Produto novo no catálogo vivo a partir de uma linha do catálogo do fornecedor. */
export function CreateProductDialog({
  item,
  onOpenChange,
  onSubmit,
  isSubmitting,
}: CreateProductDialogProps) {
  const { t } = useTranslation('catalogs');
  const { data: disciplines = [] } = useDisciplines();
  const [codigo, setCodigo] = useState('');
  const [nome, setNome] = useState('');
  const [categoria, setCategoria] = useState<string>('OUTROS');
  const [unidade, setUnidade] = useState<string>('UN');
  const [disciplineId, setDisciplineId] = useState('');

  useEffect(() => {
    if (!item) return;
    setCodigo(item.codigoFornecedor ?? '');
    setNome(item.descricao.slice(0, 180));
    setCategoria('OUTROS');
    setUnidade(UNITS.includes(item.unidade.toUpperCase()) ? item.unidade.toUpperCase() : 'UN');
    setDisciplineId('');
  }, [item]);

  const valid = codigo.trim().length >= 2 && nome.trim().length >= 2;

  return (
    <Dialog open={item !== null} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{t('catalogs:createProduct.title')}</DialogTitle>
          <DialogDescription>{t('catalogs:createProduct.description')}</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label={t('catalogs:createProduct.code')}
            hint={t('catalogs:createProduct.codeHint')}
            value={codigo}
            onChange={(e) => setCodigo(e.target.value)}
            maxLength={40}
            name="new-product-code"
            required
          />
          <SelectField
            id="new-product-unit"
            label={t('catalogs:createProduct.unit')}
            value={unidade}
            onChange={setUnidade}
            options={UNITS.map((value) => ({
              value,
              label: `${value} — ${UNIT_LABELS[value as UnitOfMeasure]}`,
            }))}
          />
          <div className="sm:col-span-2">
            <Input
              label={t('catalogs:createProduct.name')}
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              maxLength={180}
              name="new-product-name"
              required
            />
          </div>
          <SelectField
            id="new-product-category"
            label={t('catalogs:createProduct.category')}
            value={categoria}
            onChange={setCategoria}
            options={Object.values(ProductCategory).map((value) => ({
              value,
              label: PRODUCT_CATEGORY_LABELS[value],
            }))}
          />
          <SelectField
            id="new-product-discipline"
            label={t('catalogs:createProduct.discipline')}
            value={disciplineId}
            onChange={setDisciplineId}
            noneLabel={t('catalogs:createProduct.noDiscipline')}
            options={disciplines.map((d) => ({ value: d.id, label: d.nome }))}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            {t('common:actions.cancel')}
          </Button>
          <Button
            variant="primary"
            disabled={!valid}
            isLoading={isSubmitting}
            onClick={() =>
              onSubmit({
                codigo: codigo.trim(),
                nome: nome.trim(),
                categoria,
                unidade,
                disciplineId: disciplineId || undefined,
              })
            }
          >
            {t('catalogs:createProduct.submit')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
