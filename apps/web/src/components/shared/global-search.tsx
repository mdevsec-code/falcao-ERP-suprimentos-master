import { Boxes, Loader2, Search, Truck } from "lucide-react";
import * as React from "react";
import { useNavigate } from "react-router-dom";
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { useDebounce } from "@/hooks/use-debounce";
import { useProducts } from "@/features/products/hooks/use-products";
import { useSuppliers } from "@/features/suppliers/hooks/use-suppliers";

export function GlobalSearch() {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const debouncedQuery = useDebounce(query, 250);
  const navigate = useNavigate();

  React.useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((prev) => !prev);
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  const { data: supplierData, isFetching: isFetchingSuppliers } = useSuppliers({
    search: debouncedQuery || undefined,
    page: 1,
    pageSize: 6,
  });
  const { data: productData, isFetching: isFetchingProducts } = useProducts({
    search: debouncedQuery || undefined,
    page: 1,
    pageSize: 6,
  });

  const isFetching = isFetchingSuppliers || isFetchingProducts;
  const supplierResults = debouncedQuery ? (supplierData?.data ?? []) : [];
  const productResults = debouncedQuery ? (productData?.data ?? []) : [];
  const hasResults = supplierResults.length > 0 || productResults.length > 0;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex h-9 w-full max-w-sm items-center gap-2 rounded-md border border-input bg-background px-3 text-sm text-muted-foreground shadow-subtle transition-colors hover:bg-accent"
      >
        <Search className="h-4 w-4" />
        <span className="flex-1 text-left">Buscar fornecedores, produtos...</span>
        <kbd className="pointer-events-none hidden rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] font-medium sm:inline-block">
          Ctrl K
        </kbd>
      </button>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput
          placeholder="Pesquisar fornecedores ou produtos..."
          value={query}
          onValueChange={setQuery}
        />
        <CommandList>
          {isFetching && debouncedQuery && (
            <div className="flex items-center justify-center py-6 text-sm text-muted-foreground">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Buscando...
            </div>
          )}
          {!isFetching && debouncedQuery && !hasResults && (
            <CommandEmpty>Nenhum resultado encontrado para "{debouncedQuery}".</CommandEmpty>
          )}
          {!debouncedQuery && (
            <CommandEmpty>Digite para buscar fornecedores ou produtos.</CommandEmpty>
          )}
          {supplierResults.length > 0 && (
            <CommandGroup heading="Fornecedores">
              {supplierResults.map((supplier) => (
                <CommandItem
                  key={supplier.id}
                  value={`supplier-${supplier.id}`}
                  onSelect={() => {
                    setOpen(false);
                    setQuery("");
                    navigate(`/fornecedores/${supplier.id}`);
                  }}
                >
                  <Truck className="mr-2 h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">{supplier.nomeFantasia}</p>
                    <p className="text-xs text-muted-foreground">{supplier.cnpj}</p>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
          {productResults.length > 0 && (
            <CommandGroup heading="Produtos">
              {productResults.map((product) => (
                <CommandItem
                  key={product.id}
                  value={`product-${product.id}`}
                  onSelect={() => {
                    setOpen(false);
                    setQuery("");
                    navigate(`/produtos/${product.id}`);
                  }}
                >
                  <Boxes className="mr-2 h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">{product.nome}</p>
                    <p className="text-xs text-muted-foreground">{product.codigo}</p>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
}
