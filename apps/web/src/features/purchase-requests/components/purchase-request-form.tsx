import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { useFieldArray, useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { useProducts } from "@/features/products/hooks/use-products";
import {
  purchaseRequestFormSchema,
  type PurchaseRequestFormValues,
} from "../schemas/purchase-request-schema";

interface PurchaseRequestFormProps {
  onSubmit: (values: PurchaseRequestFormValues) => void;
  isSubmitting?: boolean;
  submitLabel?: string;
}

const EMPTY_ITEM: PurchaseRequestFormValues["items"][number] = {
  productId: "",
  description: "",
  quantity: 1,
  unit: "UN",
  estimatedPrice: "",
};
const NONE = "none";

export function PurchaseRequestForm({ onSubmit, isSubmitting, submitLabel = "Salvar" }: PurchaseRequestFormProps) {
  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors },
  } = useForm<PurchaseRequestFormValues>({
    resolver: zodResolver(purchaseRequestFormSchema),
    defaultValues: {
      title: "",
      justification: "",
      costCenter: "",
      items: [EMPTY_ITEM],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "items" });
  const { data: productsPage } = useProducts({ page: 1, pageSize: 100, isActive: true });
  const products = productsPage?.data ?? [];

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      <section className="space-y-4">
        <h3 className="text-sm font-semibold text-foreground">Dados Gerais</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="title">Título</Label>
            <Input id="title" placeholder="Ex.: Materiais para obra do Setor B" {...register("title")} />
            {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="costCenter">Centro de Custo</Label>
            <Input id="costCenter" {...register("costCenter")} />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="justification">Justificativa</Label>
            <Textarea id="justification" rows={3} {...register("justification")} />
          </div>
        </div>
      </section>

      <Separator />

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">Itens</h3>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => append(EMPTY_ITEM)}
          >
            <Plus className="h-3.5 w-3.5" /> Adicionar item
          </Button>
        </div>
        {errors.items?.root && <p className="text-xs text-destructive">{errors.items.root.message}</p>}

        <div className="space-y-3">
          {fields.map((field, index) => (
            <div key={field.id} className="grid grid-cols-1 gap-3 rounded-lg border border-border p-3 sm:grid-cols-12">
              <div className="sm:col-span-4">
                <Label className="text-xs">Produto do catálogo (opcional)</Label>
                <Select
                  value={field.productId || NONE}
                  onValueChange={(value) =>
                    setValue(
                      `items.${index}.productId`,
                      value === NONE ? "" : value,
                      { shouldValidate: true },
                    )
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecionar produto" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE}>Nenhum (item avulso)</SelectItem>
                    {products.map((product) => (
                      <SelectItem key={product.id} value={product.id}>
                        {product.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="sm:col-span-3">
                <Label className="text-xs">Descrição</Label>
                <Input {...register(`items.${index}.description`)} />
              </div>
              <div className="sm:col-span-1">
                <Label className="text-xs">Qtd.</Label>
                <Input type="number" min={0.01} step="0.01" {...register(`items.${index}.quantity`)} />
              </div>
              <div className="sm:col-span-1">
                <Label className="text-xs">Unid.</Label>
                <Input {...register(`items.${index}.unit`)} />
              </div>
              <div className="sm:col-span-2">
                <Label className="text-xs">Preço estimado (R$)</Label>
                <Input type="number" min={0} step="0.01" {...register(`items.${index}.estimatedPrice`)} />
              </div>
              <div className="flex items-end sm:col-span-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  disabled={fields.length === 1}
                  onClick={() => remove(index)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
              {errors.items?.[index]?.description && (
                <p className="text-xs text-destructive sm:col-span-12">
                  {errors.items[index]?.description?.message}
                </p>
              )}
            </div>
          ))}
        </div>
      </section>

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
        {submitLabel}
      </Button>
    </form>
  );
}
