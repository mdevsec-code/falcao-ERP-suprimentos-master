import { z } from "zod";
import { BRAZILIAN_STATES } from "@falcao-erp/shared-types";

export const supplierContactSchema = z.object({
  type: z.enum(["PHONE", "EMAIL"]),
  label: z.string().min(1, "Informe um rótulo.").max(60),
  value: z.string().min(3, "Informe um valor válido.").max(120),
});

export const supplierFormSchema = z.object({
  razaoSocial: z.string().min(3, "Informe a razão social.").max(180),
  nomeFantasia: z.string().min(2, "Informe o nome fantasia.").max(180),
  cnpj: z
    .string()
    .min(14, "CNPJ inválido.")
    .max(18, "CNPJ inválido.")
    .regex(/^[\d./-]+$/, "Use apenas números e pontuação de CNPJ."),
  inscricaoEstadual: z.string().max(30).optional().or(z.literal("")),
  categoria: z.string().min(1, "Selecione uma categoria."),
  cidade: z.string().min(2, "Informe a cidade.").max(120),
  estado: z.enum(BRAZILIAN_STATES, { errorMap: () => ({ message: "Selecione um estado." }) }),
  responsavel: z.string().min(2, "Informe o responsável.").max(120),
  contacts: z.array(supplierContactSchema).min(1, "Informe ao menos um contato."),
});

export type SupplierFormValues = z.infer<typeof supplierFormSchema>;
