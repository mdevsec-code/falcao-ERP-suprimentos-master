import { PRODUCT_CATEGORY_LABELS, UNIT_OF_MEASURE_LABELS, type ProductCategory, type UnitOfMeasure } from "@falcao-erp/shared-types";
import { Badge } from "@/components/ui/badge";

export function ProductStatusBadge({ isActive }: { isActive: boolean }) {
  return <Badge variant={isActive ? "success" : "secondary"}>{isActive ? "Ativo" : "Inativo"}</Badge>;
}

export function ProductCategoryBadge({ categoria }: { categoria: ProductCategory }) {
  return <Badge variant="outline">{PRODUCT_CATEGORY_LABELS[categoria]}</Badge>;
}

export function ProductUnitLabel({ unidade }: { unidade: UnitOfMeasure }) {
  return <span>{UNIT_OF_MEASURE_LABELS[unidade]}</span>;
}

export function formatCurrencyBRL(value: string | number | null): string {
  if (value === null) return "—";
  const numeric = typeof value === "string" ? Number(value) : value;
  if (Number.isNaN(numeric)) return "—";
  return numeric.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
