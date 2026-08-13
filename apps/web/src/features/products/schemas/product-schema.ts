import { z } from "zod";

export const productFormSchema = z.object({
  codigo: z.string().min(2, "Informe o código.").max(40),
  nome: z.string().min(2, "Informe o nome.").max(180),
  categoria: z.string().min(1, "Selecione uma categoria."),
  marca: z.string().max(80).optional().or(z.literal("")),
  unidade: z.string().min(1, "Selecione a unidade."),
  leadTimeDays: z
    .union([z.coerce.number().int().min(0, "Informe um valor válido."), z.literal("")])
    .optional(),
  observacoes: z.string().max(1000).optional().or(z.literal("")),
  primarySupplierId: z.string().optional().or(z.literal("")),
  alternativeSupplierIds: z.array(z.string()).default([]),
  initialPrice: z
    .union([z.coerce.number().min(0, "Informe um valor válido."), z.literal("")])
    .optional(),
});

export type ProductFormValues = z.infer<typeof productFormSchema>;
