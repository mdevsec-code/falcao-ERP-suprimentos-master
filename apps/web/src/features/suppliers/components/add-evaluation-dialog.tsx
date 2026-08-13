import { Star } from "lucide-react";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useAddEvaluation } from "../hooks/use-supplier-mutations";

export function AddEvaluationDialog({ supplierId }: { supplierId: string }) {
  const [open, setOpen] = React.useState(false);
  const [score, setScore] = React.useState(0);
  const [comment, setComment] = React.useState("");
  const addEvaluation = useAddEvaluation(supplierId);

  function handleSubmit() {
    if (score === 0) return;
    addEvaluation.mutate(
      { score, comment: comment || undefined },
      {
        onSuccess: () => {
          setOpen(false);
          setScore(0);
          setComment("");
        },
      },
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Star className="h-3.5 w-3.5" /> Avaliar fornecedor
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nova avaliação</DialogTitle>
          <DialogDescription>Registre uma avaliação de desempenho para este fornecedor.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Nota</Label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((value) => (
                <button key={value} type="button" onClick={() => setScore(value)}>
                  <Star
                    className={cn(
                      "h-7 w-7 transition-colors",
                      value <= score ? "fill-warning text-warning" : "text-muted-foreground/40",
                    )}
                  />
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="comment">Comentário (opcional)</Label>
            <Textarea
              id="comment"
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              placeholder="Descreva o histórico de entregas, qualidade, prazos..."
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={score === 0 || addEvaluation.isPending}>
            Registrar avaliação
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
