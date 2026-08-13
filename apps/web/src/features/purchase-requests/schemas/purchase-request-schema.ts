import { z } from "zod";

export const purchaseRequestItemSchema = z.object({
  productId: z.string().optional().or(z.literal("")),
  description: z.string().min(2, "Descreva o item.").max(200),
  quantity: z.coerce.number().min(0.01, "Informe uma quantidade válida."),
  unit: z.string().min(1, "Informe a unidade.").max(20),
  estimatedPrice: z.union([z.coerce.number().min(0), z.literal("")]).optional(),
});

export const purchaseRequestFormSchema = z.object({
  title: z.string().min(3, "Informe um título.").max(180),
  justification: z.string().max(2000).optional().or(z.literal("")),
  costCenter: z.string().max(60).optional().or(z.literal("")),
  items: z.array(purchaseRequestItemSchema).min(1, "Informe ao menos um item."),
});

export type PurchaseRequestFormValues = z.infer<typeof purchaseRequestFormSchema>;
