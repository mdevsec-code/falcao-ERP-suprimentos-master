import { Boxes, ChevronLeft, ChevronRight, Plus, Search } from "lucide-react";
import * as React from "react";
import { useNavigate } from "react-router-dom";
import { PRODUCT_CATEGORY_LABELS, ProductCategory } from "@falcao-erp/shared-types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { RequireRole } from "@/components/shared/require-role";
import { useDebounce } from "@/hooks/use-debounce";
import { formatCurrencyBRL, ProductCategoryBadge, ProductStatusBadge, ProductUnitLabel } from "../components/product-badges";
import { useProducts } from "../hooks/use-products";

const ALL = "all";

export function ProductsListPage() {
  const navigate = useNavigate();
  const [search, setSearch] = React.useState("");
  const [categoria, setCategoria] = React.useState<string>(ALL);
  const [page, setPage] = React.useState(1);
  const debouncedSearch = useDebounce(search, 300);

  React.useEffect(() => setPage(1), [debouncedSearch, categoria]);

  const { data, isLoading, isFetching } = useProducts({
    page,
    pageSize: 10,
    search: debouncedSearch || undefined,
    categoria: categoria === ALL ? undefined : categoria,
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Banco de Produtos"
        description="Catálogo de produtos e materiais, com fornecedores e histórico de preços."
        actions={
          <RequireRole roles={["ADMIN", "MANAGER", "BUYER"]}>
            <Button onClick={() => navigate("/produtos/novo")}>
              <Plus className="h-4 w-4" /> Novo Produto
            </Button>
          </RequireRole>
        }
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por código, nome ou marca..."
            className="pl-9"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
        <Select value={categoria} onValueChange={setCategoria}>
          <SelectTrigger className="w-full sm:w-56">
            <SelectValue placeholder="Categoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Todas as categorias</SelectItem>
            {Object.values(ProductCategory).map((value) => (
              <SelectItem key={value} value={value}>
                {PRODUCT_CATEGORY_LABELS[value]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-14 w-full" />
          ))}
        </div>
      ) : !data || data.data.length === 0 ? (
        <EmptyState
          icon={Boxes}
          title="Nenhum produto encontrado"
          description="Ajuste os filtros ou cadastre um novo produto."
          action={
            <RequireRole roles={["ADMIN", "MANAGER", "BUYER"]}>
              <Button size="sm" onClick={() => navigate("/produtos/novo")}>
                <Plus className="h-4 w-4" /> Novo Produto
              </Button>
            </RequireRole>
          }
        />
      ) : (
        <div className={`rounded-xl border border-border bg-card transition-opacity ${isFetching ? "opacity-60" : ""}`}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produto</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Unidade</TableHead>
                <TableHead>Fornecedor Principal</TableHead>
                <TableHead>Último Preço</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.data.map((product) => (
                <TableRow
                  key={product.id}
                  className="cursor-pointer"
                  onClick={() => navigate(`/produtos/${product.id}`)}
                >
                  <TableCell>
                    <p className="font-medium text-foreground">{product.nome}</p>
                    <p className="text-xs text-muted-foreground">
                      {product.codigo}
                      {product.marca ? ` · ${product.marca}` : ""}
                    </p>
                  </TableCell>
                  <TableCell>
                    <ProductCategoryBadge categoria={product.categoria} />
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    <ProductUnitLabel unidade={product.unidade} />
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {product.primarySupplier?.nomeFantasia ?? "—"}
                  </TableCell>
                  <TableCell className="text-sm font-medium text-foreground">
                    {formatCurrencyBRL(product.lastPrice)}
                  </TableCell>
                  <TableCell>
                    <ProductStatusBadge isActive={product.isActive} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <div className="flex items-center justify-between border-t border-border px-4 py-3">
            <p className="text-xs text-muted-foreground">
              {data.meta.total} produto{data.meta.total === 1 ? "" : "s"} · página {data.meta.page} de{" "}
              {data.meta.totalPages}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="icon"
                disabled={page <= 1}
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                disabled={page >= data.meta.totalPages}
                onClick={() => setPage((prev) => prev + 1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
