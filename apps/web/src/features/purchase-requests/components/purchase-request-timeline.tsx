import { CheckCircle2, MessageSquare, PlusCircle, XCircle } from "lucide-react";
import type { PurchaseRequestTimelineEntryDto } from "@falcao-erp/shared-types";
import { APPROVAL_ACTION_LABELS, PURCHASE_REQUEST_STATUS_LABELS } from "@falcao-erp/shared-types";

const ICONS = {
  CREATED: PlusCircle,
  APPROVAL: CheckCircle2,
  COMMENT: MessageSquare,
  UPDATED: CheckCircle2,
} as const;

function describe(entry: PurchaseRequestTimelineEntryDto): string {
  if (entry.type === "CREATED") return "criou a solicitação";
  if (entry.type === "COMMENT") return "comentou";
  if (entry.type === "APPROVAL" && entry.action && entry.toStatus) {
    const actionLabel = APPROVAL_ACTION_LABELS[entry.action];
    if (entry.action === "REQUEST_CHANGES") return "solicitou ajustes";
    return `${actionLabel.toLowerCase()} — mudou para "${PURCHASE_REQUEST_STATUS_LABELS[entry.toStatus]}"`;
  }
  return "atualizou a solicitação";
}

export function PurchaseRequestTimeline({ entries }: { entries: PurchaseRequestTimelineEntryDto[] }) {
  if (entries.length === 0) {
    return <p className="text-sm text-muted-foreground">Nenhum evento registrado ainda.</p>;
  }

  return (
    <ol className="space-y-4">
      {entries.map((entry) => {
        const Icon =
          entry.type === "APPROVAL" && entry.action === "REJECT" ? XCircle : ICONS[entry.type];
        return (
          <li key={`${entry.type}-${entry.id}`} className="flex gap-3">
            <div
              className={`mt-0.5 rounded-full p-1.5 ${
                entry.type === "APPROVAL" && entry.action === "REJECT"
                  ? "bg-destructive/10 text-destructive"
                  : entry.type === "APPROVAL" && entry.action === "APPROVE"
                    ? "bg-success/10 text-success"
                    : "bg-muted text-muted-foreground"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
            </div>
            <div className="flex-1 space-y-0.5">
              <p className="text-sm text-foreground">
                <span className="font-medium">{entry.authorName}</span> {describe(entry)}
              </p>
              {entry.message && <p className="text-sm text-muted-foreground">{entry.message}</p>}
              <p className="text-xs text-muted-foreground">
                {new Date(entry.createdAt).toLocaleString("pt-BR")}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
