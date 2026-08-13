import { Upload } from "lucide-react";
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
import { useUploadPurchaseRequestAttachment } from "../hooks/use-purchase-request-mutations";

export function UploadAttachmentDialog({ purchaseRequestId }: { purchaseRequestId: string }) {
  const [open, setOpen] = React.useState(false);
  const [file, setFile] = React.useState<File | null>(null);
  const uploadAttachment = useUploadPurchaseRequestAttachment(purchaseRequestId);

  function handleSubmit() {
    if (!file) return;
    uploadAttachment.mutate(file, {
      onSuccess: () => {
        setOpen(false);
        setFile(null);
      },
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Upload className="h-3.5 w-3.5" /> Enviar arquivo
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Enviar arquivo</DialogTitle>
          <DialogDescription>Anexe cotações, orçamentos ou outros documentos desta solicitação.</DialogDescription>
        </DialogHeader>

        <div className="space-y-1.5">
          <Label htmlFor="file">Arquivo</Label>
          <Input id="file" type="file" onChange={(event) => setFile(event.target.files?.[0] ?? null)} />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={!file || uploadAttachment.isPending}>
            Enviar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
