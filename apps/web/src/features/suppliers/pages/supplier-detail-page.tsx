import {
  ArrowLeft,
  Building2,
  Clock,
  FileStack,
  FileText,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Power,
  Star,
  Trash2,
  User,
} from "lucide-react";
import * as React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { API_ORIGIN } from "@/api/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { RequireRole } from "@/components/shared/require-role";
import { AddEvaluationDialog } from "../components/add-evaluation-dialog";
import { SupplierCategoryBadge, SupplierScore, SupplierStatusBadge } from "../components/supplier-badges";
import { UploadDocumentDialog } from "../components/upload-document-dialog";
import { useRemoveDocument, useSetSupplierActive } from "../hooks/use-supplier-mutations";
import { useSupplier } from "../hooks/use-suppliers";

const CONTACT_ICONS = { PHONE: Phone, EMAIL: Mail } as const;

export function SupplierDetailPage() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const { data: supplier, isLoading } = useSupplier(id);
  const setActive = useSetSupplierActive(id);
  const removeDocument = useRemoveDocument(id);
  const [confirmToggle, setConfirmToggle] = React.useState(false);
  const [documentToRemove, setDocumentToRemove] = React.useState<string | null>(null);

  if (isLoading || !supplier) {
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
        title={supplier.nomeFantasia}
        description={supplier.razaoSocial}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => navigate("/fornecedores")}>
              <ArrowLeft className="h-4 w-4" /> Voltar
            </Button>
            <RequireRole roles={["ADMIN", "MANAGER", "BUYER"]}>
              <Button variant="outline" onClick={() => navigate(`/fornecedores/${id}/editar`)}>
                <Pencil className="h-4 w-4" /> Editar
              </Button>
              <Button
                variant={supplier.isActive ? "destructive" : "default"}
                onClick={() => setConfirmToggle(true)}
              >
                <Power className="h-4 w-4" /> {supplier.isActive ? "Desativar" : "Reativar"}
              </Button>
            </RequireRole>
          </div>
        }
      />

      <div className="flex flex-wrap items-center gap-3">
        <SupplierStatusBadge isActive={supplier.isActive} />
        <SupplierCategoryBadge categoria={supplier.categoria} />
        <SupplierScore score={supplier.averageScore} />
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="contacts">Contatos</TabsTrigger>
          <TabsTrigger value="evaluations">Avaliações</TabsTrigger>
          <TabsTrigger value="documents">Documentos</TabsTrigger>
          <TabsTrigger value="contracts">Contratos</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <InfoRow icon={Building2} label="Razão Social" value={supplier.razaoSocial} />
            <InfoRow icon={FileText} label="CNPJ" value={supplier.cnpj} />
            <InfoRow icon={FileText} label="Inscrição Estadual" value={supplier.inscricaoEstadual ?? "—"} />
            <InfoRow icon={User} label="Responsável" value={supplier.responsavel} />
            <InfoRow icon={MapPin} label="Localização" value={`${supplier.cidade} / ${supplier.estado}`} />
            <InfoRow
              icon={Clock}
              label="Cadastrado em"
              value={new Date(supplier.createdAt).toLocaleDateString("pt-BR")}
            />
          </div>
        </TabsContent>

        <TabsContent value="contacts">
          {supplier.contacts.length === 0 ? (
            <EmptyState icon={Phone} title="Nenhum contato cadastrado" />
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {supplier.contacts.map((contact) => {
                const Icon = CONTACT_ICONS[contact.type];
                return (
                  <Card key={contact.id}>
                    <CardContent className="flex items-center gap-3 p-4">
                      <div className="rounded-lg bg-primary/10 p-2 text-primary">
                        <Icon className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{contact.label}</p>
                        <p className="text-sm text-muted-foreground">{contact.value}</p>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="evaluations" className="space-y-4">
          <div className="flex justify-end">
            <AddEvaluationDialog supplierId={id} />
          </div>
          {supplier.evaluations.length === 0 ? (
            <EmptyState icon={Star} title="Nenhuma avaliação registrada" />
          ) : (
            <div className="space-y-3">
              {supplier.evaluations.map((evaluation) => (
                <Card key={evaluation.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        {Array.from({ length: 5 }).map((_, index) => (
                          <Star
                            key={index}
                            className={`h-4 w-4 ${
                              index < evaluation.score ? "fill-warning text-warning" : "text-muted-foreground/30"
                            }`}
                          />
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {new Date(evaluation.createdAt).toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                    {evaluation.comment && <p className="mt-2 text-sm text-foreground">{evaluation.comment}</p>}
                    <p className="mt-2 text-xs text-muted-foreground">por {evaluation.authorName}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="documents" className="space-y-4">
          <div className="flex justify-end">
            <RequireRole roles={["ADMIN", "MANAGER", "BUYER"]}>
              <UploadDocumentDialog supplierId={id} />
            </RequireRole>
          </div>
          {supplier.documents.length === 0 ? (
            <EmptyState icon={FileStack} title="Nenhum documento anexado" />
          ) : (
            <div className="space-y-2">
              {supplier.documents.map((document) => (
                <div
                  key={document.id}
                  className="flex items-center justify-between rounded-lg border border-border bg-card p-3"
                >
                  <a
                    href={`${API_ORIGIN}${document.url}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-3 hover:underline"
                  >
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium text-foreground">{document.fileName}</p>
                      <p className="text-xs text-muted-foreground">
                        {document.category} · {(document.size / 1024).toFixed(0)} KB · enviado por{" "}
                        {document.uploadedByName}
                      </p>
                    </div>
                  </a>
                  <RequireRole roles={["ADMIN", "MANAGER", "BUYER"]}>
                    <Button variant="ghost" size="icon" onClick={() => setDocumentToRemove(document.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </RequireRole>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="contracts">
          <EmptyState
            icon={FileText}
            title="Módulo de Contratos em desenvolvimento"
            description="Em breve você poderá visualizar aqui todos os contratos vinculados a este fornecedor."
          />
        </TabsContent>
      </Tabs>

      <ConfirmDialog
        open={confirmToggle}
        onOpenChange={setConfirmToggle}
        title={supplier.isActive ? "Desativar fornecedor" : "Reativar fornecedor"}
        description={
          supplier.isActive
            ? "O fornecedor será marcado como inativo e deixará de aparecer em novas solicitações."
            : "O fornecedor voltará a ficar disponível para novas solicitações de compra."
        }
        destructive={supplier.isActive}
        confirmLabel={supplier.isActive ? "Desativar" : "Reativar"}
        isLoading={setActive.isPending}
        onConfirm={() =>
          setActive.mutate(!supplier.isActive, { onSuccess: () => setConfirmToggle(false) })
        }
      />

      <ConfirmDialog
        open={!!documentToRemove}
        onOpenChange={(open) => !open && setDocumentToRemove(null)}
        title="Remover documento"
        description="Esta ação não pode ser desfeita. O arquivo será removido permanentemente."
        destructive
        confirmLabel="Remover"
        isLoading={removeDocument.isPending}
        onConfirm={() => {
          if (documentToRemove) {
            removeDocument.mutate(documentToRemove, { onSuccess: () => setDocumentToRemove(null) });
          }
        }}
      />
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }: { icon: typeof Building2; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-border bg-card p-4">
      <div className="rounded-lg bg-muted p-2 text-muted-foreground">
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className="text-sm font-medium text-foreground">{value}</p>
      </div>
    </div>
  );
}
