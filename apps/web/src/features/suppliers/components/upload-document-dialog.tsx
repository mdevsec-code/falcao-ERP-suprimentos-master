import { Upload } from "lucide-react";
import * as React from "react";
import { SupplierDocumentCategory } from "@falcao-erp/shared-types";
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
import { useUploadDocument } from "../hooks/use-supplier-mutations";

const CATEGORY_LABELS: Record<string, string> = {
  CERTIFICADO: "Certificado",
  CONTRATO: "Contrato",
  COTACAO: "Cotação",
  COMPROVANTE: "Comprovante",
  OUTRO: "Outro",
};

export function UploadDocumentDialog({ supplierId }: { supplierId: string }) {
  const [open, setOpen] = React.useState(false);
  const [file, setFile] = React.useState<File | null>(null);
  const [category, setCategory] = React.useState<string>(SupplierDocumentCategory.OUTRO);
  const uploadDocument = useUploadDocument(supplierId);

  function handleSubmit() {
    if (!file) return;
    uploadDocument.mutate(
      { file, category },
      {
        onSuccess: () => {
          setOpen(false);
          setFile(null);
        },
      },
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Upload className="h-3.5 w-3.5" /> Enviar documento
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Enviar documento</DialogTitle>
          <DialogDescription>Anexe certificados, contratos ou outros arquivos deste fornecedor.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="file">Arquivo</Label>
            <Input
              id="file"
              type="file"
              onChange={(event) => setFile(event.target.files?.[0] ?? null)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Categoria</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.values(SupplierDocumentCategory).map((value) => (
                  <SelectItem key={value} value={value}>
                    {CATEGORY_LABELS[value]}
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
          <Button onClick={handleSubmit} disabled={!file || uploadDocument.isPending}>
            Enviar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
