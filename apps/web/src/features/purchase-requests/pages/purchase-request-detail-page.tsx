import { ArrowLeft, FileStack, Package, Paperclip, Trash2 } from "lucide-react";
import * as React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { API_ORIGIN } from "@/api/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { CommentBox } from "../components/comment-box";
import { formatCurrencyBRL, PurchaseRequestStatusBadge } from "../components/purchase-request-badges";
import { PurchaseRequestTimeline } from "../components/purchase-request-timeline";
import { StatusActionButtons } from "../components/status-action-buttons";
import { UploadAttachmentDialog } from "../components/upload-attachment-dialog";
import { useRemovePurchaseRequestAttachment } from "../hooks/use-purchase-request-mutations";
import { usePurchaseRequest, usePurchaseRequestTimeline } from "../hooks/use-purchase-requests";

export function PurchaseRequestDetailPage() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const { data: request, isLoading } = usePurchaseRequest(id);
  const { data: timeline } = usePurchaseRequestTimeline(id);
  const removeAttachment = useRemovePurchaseRequestAttachment(id);
  const [attachmentToRemove, setAttachmentToRemove] = React.useState<string | null>(null);

  if (isLoading || !request) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={request.title}
        description={`Solicitado por ${request.requesterName}${request.costCenter ? ` · C. Custo: ${request.costCenter}` : ""}`}
        actions={
          <Button variant="outline" onClick={() => navigate("/solicitacoes")}>
            <ArrowLeft className="h-4 w-4" /> Voltar
          </Button>
        }
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <PurchaseRequestStatusBadge status={request.status} />
        <StatusActionButtons purchaseRequestId={id} status={request.status} />
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="comments">Comentários</TabsTrigger>
          <TabsTrigger value="attachments">Arquivos</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {request.justification && (
            <div className="rounded-lg border border-border bg-card p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Justificativa</p>
              <p className="mt-1 text-sm text-foreground">{request.justification}</p>
            </div>
          )}

          {request.items.length === 0 ? (
            <EmptyState icon={Package} title="Nenhum item nesta solicitação" />
          ) : (
            <div className="rounded-xl border border-border bg-card">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Qtd.</TableHead>
                    <TableHead>Unid.</TableHead>
                    <TableHead>Preço Estimado</TableHead>
                    <TableHead>Subtotal</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {request.items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <p className="font-medium text-foreground">{item.description}</p>
                        {item.productName && (
                          <p className="text-xs text-muted-foreground">Catálogo: {item.productName}</p>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{item.quantity}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{item.unit}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatCurrencyBRL(item.estimatedPrice)}
                      </TableCell>
                      <TableCell className="text-sm font-medium text-foreground">
                        {item.estimatedPrice
                          ? formatCurrencyBRL(Number(item.estimatedPrice) * Number(item.quantity))
                          : "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="flex justify-end border-t border-border px-4 py-3">
                <p className="text-sm font-semibold text-foreground">
                  Total estimado: {formatCurrencyBRL(request.estimatedTotal)}
                </p>
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="timeline">
          <PurchaseRequestTimeline entries={timeline ?? []} />
        </TabsContent>

        <TabsContent value="comments" className="space-y-4">
          <CommentBox purchaseRequestId={id} />
          {request.comments.length === 0 ? (
            <EmptyState icon={FileStack} title="Nenhum comentário ainda" />
          ) : (
            <div className="space-y-3">
              {request.comments.map((comment) => (
                <Card key={comment.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-foreground">{comment.authorName}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(comment.createdAt).toLocaleString("pt-BR")}
                      </p>
                    </div>
                    <p className="mt-2 text-sm text-foreground">{comment.message}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="attachments" className="space-y-4">
          <div className="flex justify-end">
            <UploadAttachmentDialog purchaseRequestId={id} />
          </div>
          {request.attachments.length === 0 ? (
            <EmptyState icon={Paperclip} title="Nenhum arquivo anexado" />
          ) : (
            <div className="space-y-2">
              {request.attachments.map((attachment) => (
                <div
                  key={attachment.id}
                  className="flex items-center justify-between rounded-lg border border-border bg-card p-3"
                >
                  <a
                    href={`${API_ORIGIN}${attachment.url}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-3 hover:underline"
                  >
                    <Paperclip className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium text-foreground">{attachment.fileName}</p>
                      <p className="text-xs text-muted-foreground">
                        {(attachment.size / 1024).toFixed(0)} KB · enviado por {attachment.uploadedByName}
                      </p>
                    </div>
                  </a>
                  <Button variant="ghost" size="icon" onClick={() => setAttachmentToRemove(attachment.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <ConfirmDialog
        open={!!attachmentToRemove}
        onOpenChange={(open) => !open && setAttachmentToRemove(null)}
        title="Remover arquivo"
        description="Esta ação não pode ser desfeita. O arquivo será removido permanentemente."
        destructive
        confirmLabel="Remover"
        isLoading={removeAttachment.isPending}
        onConfirm={() => {
          if (attachmentToRemove) {
            removeAttachment.mutate(attachmentToRemove, { onSuccess: () => setAttachmentToRemove(null) });
          }
        }}
      />
    </div>
  );
}
