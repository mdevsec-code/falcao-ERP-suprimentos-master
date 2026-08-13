import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { useFieldArray, useForm } from "react-hook-form";
import { BRAZILIAN_STATES, SUPPLIER_CATEGORY_LABELS, SupplierCategory } from "@falcao-erp/shared-types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { supplierFormSchema, type SupplierFormValues } from "../schemas/supplier-schema";

interface SupplierFormProps {
  defaultValues?: Partial<SupplierFormValues>;
  onSubmit: (values: SupplierFormValues) => void;
  isSubmitting?: boolean;
  submitLabel?: string;
}

const EMPTY_CONTACT = { type: "PHONE" as const, label: "Comercial", value: "" };

export function SupplierForm({ defaultValues, onSubmit, isSubmitting, submitLabel = "Salvar" }: SupplierFormProps) {
  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<SupplierFormValues>({
    resolver: zodResolver(supplierFormSchema),
    defaultValues: {
      razaoSocial: "",
      nomeFantasia: "",
      cnpj: "",
      inscricaoEstadual: "",
      categoria: "",
      cidade: "",
      estado: undefined,
      responsavel: "",
      contacts: [EMPTY_CONTACT],
      ...defaultValues,
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "contacts" });
  const categoria = watch("categoria");
  const estado = watch("estado");

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      <section className="space-y-4">
        <h3 className="text-sm font-semibold text-foreground">Dados Gerais</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="razaoSocial">Razão Social</Label>
            <Input id="razaoSocial" {...register("razaoSocial")} />
            {errors.razaoSocial && <p className="text-xs text-destructive">{errors.razaoSocial.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="nomeFantasia">Nome Fantasia</Label>
            <Input id="nomeFantasia" {...register("nomeFantasia")} />
            {errors.nomeFantasia && <p className="text-xs text-destructive">{errors.nomeFantasia.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cnpj">CNPJ</Label>
            <Input id="cnpj" placeholder="00.000.000/0000-00" {...register("cnpj")} />
            {errors.cnpj && <p className="text-xs text-destructive">{errors.cnpj.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="inscricaoEstadual">Inscrição Estadual</Label>
            <Input id="inscricaoEstadual" {...register("inscricaoEstadual")} />
          </div>
          <div className="space-y-1.5">
            <Label>Categoria</Label>
            <Select value={categoria} onValueChange={(value) => setValue("categoria", value, { shouldValidate: true })}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a categoria" />
              </SelectTrigger>
              <SelectContent>
                {Object.values(SupplierCategory).map((value) => (
                  <SelectItem key={value} value={value}>
                    {SUPPLIER_CATEGORY_LABELS[value]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.categoria && <p className="text-xs text-destructive">{errors.categoria.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="responsavel">Responsável</Label>
            <Input id="responsavel" {...register("responsavel")} />
            {errors.responsavel && <p className="text-xs text-destructive">{errors.responsavel.message}</p>}
          </div>
        </div>
      </section>

      <Separator />

      <section className="space-y-4">
        <h3 className="text-sm font-semibold text-foreground">Endereço</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="cidade">Cidade</Label>
            <Input id="cidade" {...register("cidade")} />
            {errors.cidade && <p className="text-xs text-destructive">{errors.cidade.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label>Estado</Label>
            <Select value={estado} onValueChange={(value) => setValue("estado", value as never, { shouldValidate: true })}>
              <SelectTrigger>
                <SelectValue placeholder="UF" />
              </SelectTrigger>
              <SelectContent>
                {BRAZILIAN_STATES.map((uf) => (
                  <SelectItem key={uf} value={uf}>
                    {uf}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.estado && <p className="text-xs text-destructive">{errors.estado.message}</p>}
          </div>
        </div>
      </section>

      <Separator />

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">Contatos</h3>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => append({ type: "PHONE", label: "", value: "" })}
          >
            <Plus className="h-3.5 w-3.5" /> Adicionar contato
          </Button>
        </div>
        {errors.contacts?.message && <p className="text-xs text-destructive">{errors.contacts.message}</p>}
        <div className="space-y-3">
          {fields.map((field, index) => (
            <div key={field.id} className="grid grid-cols-1 gap-3 rounded-lg border border-border p-3 sm:grid-cols-[120px_1fr_1fr_auto]">
              <div className="space-y-1">
                <Label className="text-xs">Tipo</Label>
                <Select
                  value={watch(`contacts.${index}.type`)}
                  onValueChange={(value) => setValue(`contacts.${index}.type`, value as "PHONE" | "EMAIL")}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PHONE">Telefone</SelectItem>
                    <SelectItem value="EMAIL">E-mail</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Rótulo</Label>
                <Input placeholder="Comercial, Vendas..." {...register(`contacts.${index}.label`)} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Valor</Label>
                <Input placeholder="(31) 99999-9999" {...register(`contacts.${index}.value`)} />
              </div>
              <div className="flex items-end">
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
            </div>
          ))}
        </div>
      </section>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
