import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { PRODUCT_CATEGORY_LABELS, ProductCategory, UNIT_OF_MEASURE_LABELS, UnitOfMeasure } from "@falcao-erp/shared-types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { useSuppliers } from "@/features/suppliers/hooks/use-suppliers";
import { productFormSchema, type ProductFormValues } from "../schemas/product-schema";

interface ProductFormProps {
  defaultValues?: Partial<ProductFormValues>;
  onSubmit: (values: ProductFormValues) => void;
  isSubmitting?: boolean;
  submitLabel?: string;
  showInitialPrice?: boolean;
}

const NONE = "none";

export function ProductForm({
  defaultValues,
  onSubmit,
  isSubmitting,
  submitLabel = "Salvar",
  showInitialPrice = false,
}: ProductFormProps) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      codigo: "",
      nome: "",
      categoria: "",
      marca: "",
      unidade: "",
      observacoes: "",
      primarySupplierId: "",
      alternativeSupplierIds: [],
      ...defaultValues,
    },
  });

  const { data: suppliersPage } = useSuppliers({ page: 1, pageSize: 100, isActive: true });
  const suppliers = suppliersPage?.data ?? [];

  const categoria = watch("categoria");
  const unidade = watch("unidade");
  const primarySupplierId = watch("primarySupplierId");
  const alternativeSupplierIds = watch("alternativeSupplierIds") ?? [];

  function toggleAlternative(supplierId: string) {
    const current = alternativeSupplierIds;
    setValue(
      "alternativeSupplierIds",
      current.includes(supplierId)
        ? current.filter((id) => id !== supplierId)
        : [...current, supplierId],
      { shouldValidate: true },
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      <section className="space-y-4">
        <h3 className="text-sm font-semibold text-foreground">Dados Gerais</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="codigo">Código</Label>
            <Input id="codigo" {...register("codigo")} />
            {errors.codigo && <p className="text-xs text-destructive">{errors.codigo.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="marca">Marca</Label>
            <Input id="marca" {...register("marca")} />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="nome">Nome</Label>
            <Input id="nome" {...register("nome")} />
            {errors.nome && <p className="text-xs text-destructive">{errors.nome.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label>Categoria</Label>
            <Select value={categoria} onValueChange={(value) => setValue("categoria", value, { shouldValidate: true })}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a categoria" />
              </SelectTrigger>
              <SelectContent>
                {Object.values(ProductCategory).map((value) => (
                  <SelectItem key={value} value={value}>
                    {PRODUCT_CATEGORY_LABELS[value]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.categoria && <p className="text-xs text-destructive">{errors.categoria.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label>Unidade</Label>
            <Select value={unidade} onValueChange={(value) => setValue("unidade", value, { shouldValidate: true })}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a unidade" />
              </SelectTrigger>
              <SelectContent>
                {Object.values(UnitOfMeasure).map((value) => (
                  <SelectItem key={value} value={value}>
                    {UNIT_OF_MEASURE_LABELS[value]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.unidade && <p className="text-xs text-destructive">{errors.unidade.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="leadTimeDays">Lead Time (dias)</Label>
            <Input id="leadTimeDays" type="number" min={0} {...register("leadTimeDays")} />
          </div>
          {showInitialPrice && (
            <div className="space-y-1.5">
              <Label htmlFor="initialPrice">Preço inicial (R$)</Label>
              <Input id="initialPrice" type="number" min={0} step="0.01" {...register("initialPrice")} />
            </div>
          )}
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="observacoes">Observações</Label>
            <Textarea id="observacoes" rows={3} {...register("observacoes")} />
          </div>
        </div>
      </section>

      <Separator />

      <section className="space-y-4">
        <h3 className="text-sm font-semibold text-foreground">Fornecedores</h3>
        <div className="space-y-1.5">
          <Label>Fornecedor Principal</Label>
          <Select
            value={primarySupplierId || NONE}
            onValueChange={(value) =>
              setValue("primarySupplierId", value === NONE ? "" : value, { shouldValidate: true })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione o fornecedor principal" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NONE}>Nenhum</SelectItem>
              {suppliers.map((supplier) => (
                <SelectItem key={supplier.id} value={supplier.id}>
                  {supplier.nomeFantasia}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label>Fornecedores Alternativos</Label>
          <div className="grid grid-cols-1 gap-2 rounded-lg border border-border p-3 sm:grid-cols-2">
            {suppliers
              .filter((supplier) => supplier.id !== primarySupplierId)
              .map((supplier) => (
                <label key={supplier.id} className="flex items-center gap-2 text-sm text-foreground">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-input"
                    checked={alternativeSupplierIds.includes(supplier.id)}
                    onChange={() => toggleAlternative(supplier.id)}
                  />
                  {supplier.nomeFantasia}
                </label>
              ))}
            {suppliers.length === 0 && (
              <p className="text-sm text-muted-foreground">Nenhum fornecedor cadastrado ainda.</p>
            )}
          </div>
        </div>
      </section>

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
        {submitLabel}
      </Button>
    </form>
  );
}
