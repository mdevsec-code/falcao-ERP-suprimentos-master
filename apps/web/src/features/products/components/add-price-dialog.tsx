import { DollarSign } from "lucide-react";
import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useSuppliers } from "@/features/suppliers/hooks/use-suppliers";
import { useAddPriceEntry } from "../hooks/use-product-mutations";

const NONE = "none";

export function AddPriceDialog({ productId }: { productId: string }) {
  const [open, setOpen] = React.useState(false);
  const [price, setPrice] = React.useState("");
  const [supplierId, setSupplierId] = React.useState(NONE);
  const addPriceEntry = useAddPriceEntry(productId);
  const { data: suppliersPage } = useSuppliers({ page: 1, pageSize: 100, isActive: true });

  function handleSubmit() {
    const numericPrice = Number(price);
    if (!price || Number.isNaN(numericPrice) || numericPrice < 0) return;
    addPriceEntry.mutate(
      { price: numericPrice, supplierId: supplierId === NONE ? undefined : supplierId },
      {
        onSuccess: () => {
          setOpen(false);
          setPrice("");
          setSupplierId(NONE);
        },
      },
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <DollarSign className="h-3.5 w-3.5" /> Registrar preço
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Novo preço</DialogTitle>
          <DialogDescription>Registre um novo ponto no histórico de preços deste produto.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="price">Preço (R$)</Label>
            <Input
              id="price"
              type="number"
              min={0}
              step="0.01"
              value={price}
              onChange={(event) => setPrice(event.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Fornecedor (opcional)</Label>
            <Select value={supplierId} onValueChange={setSupplierId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o fornecedor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>Nenhum</SelectItem>
                {(suppliersPage?.data ?? []).map((supplier) => (
                  <SelectItem key={supplier.id} value={supplier.id}>
                    {supplier.nomeFantasia}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={!price || addPriceEntry.isPending}>
            Registrar preço
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
