import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { BookPlus } from 'lucide-react';
import {
  ProductCategory,
  UnitOfMeasure,
  type PurchaseRequestItemDto,
} from '@falcao-erp/shared-types';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
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
import { PRODUCT_CATEGORY_LABELS, UNIT_LABELS } from '@/constants/enums';
import { useDisciplines } from '@/features/disciplines/hooks/useDisciplines';
import { useCreateProductFromRequestItem } from '@/features/products/hooks/useProductMutations';

const NONE = '__none';

interface AddToCatalogDialogProps {
  item: PurchaseRequestItemDto | null;
  onOpenChange: (open: boolean) => void;
}

/** Item que o solicitante digitou à mão vira produto do catálogo (e fica ligado a ele). */
export function AddToCatalogDialog({ item, onOpenChange }: AddToCatalogDialogProps) {
  const { t } = useTranslation('purchaseRequests');
  const create = useCreateProductFromRequestItem();
  const { data: disciplines = [] } = useDisciplines();
  const [codigo, setCodigo] = useState('');
  const [nome, setNome] = useState('');
  const [categoria, setCategoria] = useState<ProductCategory | ''>('');
  const [unidade, setUnidade] = useState<UnitOfMeasure | ''>('');
  const [disciplineId, setDisciplineId] = useState(NONE);
  const [marca, setMarca] = useState('');
  const [referencia, setReferencia] = useState('');

  useEffect(() => {
    if (!item) return;
    setCodigo('');
    setNome(item.description);
    setCategoria('');
    const unit = item.unit.toUpperCase();
    setUnidade(
      (Object.values(UnitOfMeasure) as string[]).includes(unit) ? (unit as UnitOfMeasure) : '',
    );
    setDisciplineId(NONE);
    setMarca(item.marca ?? '');
    setReferencia(item.referencia ?? '');
  }, [item]);

  const valid =
    codigo.trim().length >= 2 && nome.trim().length >= 2 && categoria !== '' && unidade !== '';

  function submit() {
    if (!item || !valid) return;
    create.mutate(
      {
        purchaseRequestItemId: item.id,
        codigo: codigo.trim(),
        nome: nome.trim(),
        categoria,
        unidade,
        disciplineId: disciplineId === NONE ? undefined : disciplineId,
        marca: marca.trim() || undefined,
        referencia: referencia.trim() || undefined,
      },
      { onSuccess: () => onOpenChange(false) },
    );
  }

  return (
    <Dialog open={item !== null} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{t('purchaseRequests:toCatalog.title')}</DialogTitle>
          <DialogDescription>{t('purchaseRequests:toCatalog.description')}</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_2fr]">
          <Input
            label={t('purchaseRequests:toCatalog.code')}
            value={codigo}
            onChange={(e) => setCodigo(e.target.value)}
            maxLength={40}
            inputClassName="font-mono"
            name="catalog-code"
            required
          />
          <Input
            label={t('purchaseRequests:toCatalog.name')}
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            maxLength={180}
            name="catalog-name"
            required
          />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="catalog-category-new" required>
              {t('purchaseRequests:toCatalog.category')}
            </Label>
            <Select value={categoria} onValueChange={(v) => setCategoria(v as ProductCategory)}>
              <SelectTrigger id="catalog-category-new">
                <SelectValue placeholder={t('purchaseRequests:toCatalog.select')} />
              </SelectTrigger>
              <SelectContent>
                {Object.values(ProductCategory).map((value) => (
                  <SelectItem key={value} value={value}>
                    {PRODUCT_CATEGORY_LABELS[value]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="catalog-unit-new" required>
              {t('purchaseRequests:toCatalog.unit')}
            </Label>
            <Select value={unidade} onValueChange={(v) => setUnidade(v as UnitOfMeasure)}>
              <SelectTrigger id="catalog-unit-new">
                <SelectValue placeholder={t('purchaseRequests:toCatalog.select')} />
              </SelectTrigger>
              <SelectContent>
                {Object.values(UnitOfMeasure).map((value) => (
                  <SelectItem key={value} value={value}>
                    {UNIT_LABELS[value]} ({value})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="catalog-discipline-new">
              {t('purchaseRequests:toCatalog.discipline')}
            </Label>
            <Select value={disciplineId} onValueChange={setDisciplineId}>
              <SelectTrigger id="catalog-discipline-new">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>{t('purchaseRequests:toCatalog.noDiscipline')}</SelectItem>
                {disciplines.map((d) => (
                  <SelectItem key={d.id} value={d.id}>
                    {d.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Input
            label={t('purchaseRequests:form.fields.marca')}
            value={marca}
            onChange={(e) => setMarca(e.target.value)}
            maxLength={80}
            name="catalog-brand"
          />
          <Input
            label={t('purchaseRequests:form.fields.referencia')}
            value={referencia}
            onChange={(e) => setReferencia(e.target.value)}
            maxLength={80}
            inputClassName="font-mono"
            name="catalog-reference"
            className="sm:col-span-2"
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={create.isPending}>
            {t('common:actions.cancel')}
          </Button>
          <Button
            variant="primary"
            leftIcon={<BookPlus className="h-4 w-4" />}
            disabled={!valid}
            isLoading={create.isPending}
            onClick={submit}
          >
            {t('purchaseRequests:toCatalog.submit')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
