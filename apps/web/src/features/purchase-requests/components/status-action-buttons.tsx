import { ALLOWED_TRANSITIONS, ROLES_BY_CURRENT_STATUS, resolveApprovalAction } from "@falcao-erp/shared-types";
import type { PurchaseRequestStatus } from "@falcao-erp/shared-types";
import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/use-auth";
import { useChangeStatus } from "../hooks/use-purchase-request-mutations";

interface TransitionOption {
  target: PurchaseRequestStatus;
  label: string;
  variant: "default" | "destructive" | "outline";
  requiresComment: boolean;
}

const TRANSITION_OPTIONS: Record<PurchaseRequestStatus, TransitionOption[]> = {
  AGUARDANDO_APROVACAO: [
    { target: "EM_COMPRAS", label: "Aprovar", variant: "default", requiresComment: false },
    {
      target: "AGUARDANDO_APROVACAO",
      label: "Solicitar Ajustes",
      variant: "outline",
      requiresComment: true,
    },
    { target: "REJEITADO", label: "Reprovar", variant: "destructive", requiresComment: true },
  ],
  EM_COMPRAS: [
    { target: "EM_COTACAO", label: "Iniciar Cotação", variant: "default", requiresComment: false },
    { target: "REJEITADO", label: "Cancelar", variant: "destructive", requiresComment: true },
  ],
  EM_COTACAO: [
    { target: "PEDIDO_REALIZADO", label: "Registrar Pedido", variant: "default", requiresComment: false },
    { target: "REJEITADO", label: "Cancelar", variant: "destructive", requiresComment: true },
  ],
  PEDIDO_REALIZADO: [
    {
      target: "AGUARDANDO_RECEBIMENTO",
      label: "Confirmar Envio do Pedido",
      variant: "default",
      requiresComment: false,
    },
    { target: "REJEITADO", label: "Cancelar", variant: "destructive", requiresComment: true },
  ],
  AGUARDANDO_RECEBIMENTO: [
    { target: "FINALIZADO", label: "Confirmar Recebimento", variant: "default", requiresComment: false },
    { target: "REJEITADO", label: "Cancelar", variant: "destructive", requiresComment: true },
  ],
  FINALIZADO: [],
  REJEITADO: [],
};

export function StatusActionButtons({
  purchaseRequestId,
  status,
}: {
  purchaseRequestId: string;
  status: PurchaseRequestStatus;
}) {
  const { user, hasRole } = useAuth();
  const changeStatus = useChangeStatus(purchaseRequestId);
  const [pending, setPending] = React.useState<TransitionOption | null>(null);
  const [comment, setComment] = React.useState("");

  const allowedRoles = ROLES_BY_CURRENT_STATUS[status];
  const canAct = user && (hasRole("ADMIN") || allowedRoles.includes(user.role));
  const options = TRANSITION_OPTIONS[status].filter((option) =>
    ALLOWED_TRANSITIONS[status].includes(option.target),
  );

  if (!canAct || options.length === 0) return null;

  function handleConfirm() {
    if (!pending) return;
    changeStatus.mutate(
      { status: pending.target, comment: comment || undefined },
      { onSuccess: () => setPending(null) },
    );
  }

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <Button
            key={option.target + resolveApprovalAction(status, option.target)}
            variant={option.variant}
            size="sm"
            onClick={() => {
              setComment("");
              setPending(option);
            }}
          >
            {option.label}
          </Button>
        ))}
      </div>

      <Dialog open={!!pending} onOpenChange={(open) => !open && setPending(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{pending?.label}</DialogTitle>
            <DialogDescription>
              {pending?.requiresComment
                ? "Adicione um comentário explicando o motivo."
                : "Confirme a ação. Você pode adicionar um comentário opcional."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="status-comment">Comentário {pending?.requiresComment ? "" : "(opcional)"}</Label>
            <Textarea
              id="status-comment"
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPending(null)}>
              Cancelar
            </Button>
            <Button
              variant={pending?.variant === "destructive" ? "destructive" : "default"}
              onClick={handleConfirm}
              disabled={(pending?.requiresComment && !comment) || changeStatus.isPending}
            >
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
