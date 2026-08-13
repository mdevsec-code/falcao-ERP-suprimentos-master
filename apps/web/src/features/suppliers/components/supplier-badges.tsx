import { Star } from "lucide-react";
import { SUPPLIER_CATEGORY_LABELS, type SupplierCategory } from "@falcao-erp/shared-types";
import { Badge } from "@/components/ui/badge";

export function SupplierStatusBadge({ isActive }: { isActive: boolean }) {
  return (
    <Badge variant={isActive ? "success" : "secondary"}>{isActive ? "Ativo" : "Inativo"}</Badge>
  );
}

export function SupplierCategoryBadge({ categoria }: { categoria: SupplierCategory }) {
  return <Badge variant="outline">{SUPPLIER_CATEGORY_LABELS[categoria]}</Badge>;
}

export function SupplierScore({ score }: { score: number | null }) {
  if (score === null) {
    return <span className="text-xs text-muted-foreground">Sem avaliações</span>;
  }
  return (
    <span className="inline-flex items-center gap-1 text-sm font-medium text-foreground">
      <Star className="h-3.5 w-3.5 fill-warning text-warning" />
      {score.toFixed(1)}
    </span>
  );
}
