import { ChevronLeft, ChevronRight, Plus, Search, Truck } from "lucide-react";
import * as React from "react";
import { useNavigate } from "react-router-dom";
import { BRAZILIAN_STATES, SUPPLIER_CATEGORY_LABELS, SupplierCategory } from "@falcao-erp/shared-types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { RequireRole } from "@/components/shared/require-role";
import { useDebounce } from "@/hooks/use-debounce";
import { useSuppliers } from "../hooks/use-suppliers";
import { SupplierCategoryBadge, SupplierScore, SupplierStatusBadge } from "../components/supplier-badges";

const ALL = "all";

export function SuppliersListPage() {
  const navigate = useNavigate();
  const [search, setSearch] = React.useState("");
  const [categoria, setCategoria] = React.useState<string>(ALL);
  const [estado, setEstado] = React.useState<string>(ALL);
  const [page, setPage] = React.useState(1);
  const debouncedSearch = useDebounce(search, 300);

  React.useEffect(() => setPage(1), [debouncedSearch, categoria, estado]);

  const { data, isLoading, isFetching } = useSuppliers({
    page,
    pageSize: 10,
    search: debouncedSearch || undefined,
    categoria: categoria === ALL ? undefined : categoria,
    estado: estado === ALL ? undefined : estado,
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Fornecedores"
        description="Cadastro completo de fornecedores, contatos, avaliações e documentos."
        actions={
          <RequireRole roles={["ADMIN", "MANAGER", "BUYER"]}>
            <Button onClick={() => navigate("/fornecedores/novo")}>
              <Plus className="h-4 w-4" /> Novo Fornecedor
            </Button>
          </RequireRole>
        }
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por razão social, nome fantasia ou CNPJ..."
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
            {Object.values(SupplierCategory).map((value) => (
              <SelectItem key={value} value={value}>
                {SUPPLIER_CATEGORY_LABELS[value]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={estado} onValueChange={setEstado}>
          <SelectTrigger className="w-full sm:w-32">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Todos</SelectItem>
            {BRAZILIAN_STATES.map((uf) => (
              <SelectItem key={uf} value={uf}>
                {uf}
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
          icon={Truck}
          title="Nenhum fornecedor encontrado"
          description="Ajuste os filtros ou cadastre um novo fornecedor."
          action={
            <RequireRole roles={["ADMIN", "MANAGER", "BUYER"]}>
              <Button size="sm" onClick={() => navigate("/fornecedores/novo")}>
                <Plus className="h-4 w-4" /> Novo Fornecedor
              </Button>
            </RequireRole>
          }
        />
      ) : (
        <div className={`rounded-xl border border-border bg-card transition-opacity ${isFetching ? "opacity-60" : ""}`}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fornecedor</TableHead>
                <TableHead>CNPJ</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Localização</TableHead>
                <TableHead>Avaliação</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.data.map((supplier) => (
                <TableRow
                  key={supplier.id}
                  className="cursor-pointer"
                  onClick={() => navigate(`/fornecedores/${supplier.id}`)}
                >
                  <TableCell>
                    <p className="font-medium text-foreground">{supplier.nomeFantasia}</p>
                    <p className="text-xs text-muted-foreground">{supplier.razaoSocial}</p>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{supplier.cnpj}</TableCell>
                  <TableCell>
                    <SupplierCategoryBadge categoria={supplier.categoria} />
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {supplier.cidade}/{supplier.estado}
                  </TableCell>
                  <TableCell>
                    <SupplierScore score={supplier.averageScore} />
                  </TableCell>
                  <TableCell>
                    <SupplierStatusBadge isActive={supplier.isActive} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <div className="flex items-center justify-between border-t border-border px-4 py-3">
            <p className="text-xs text-muted-foreground">
              {data.meta.total} fornecedor{data.meta.total === 1 ? "" : "es"} · página {data.meta.page} de{" "}
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
