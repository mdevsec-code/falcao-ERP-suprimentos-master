import { ChevronLeft, ChevronRight, ClipboardList, Plus, Search } from "lucide-react";
import * as React from "react";
import { useNavigate } from "react-router-dom";
import {
  PURCHASE_REQUEST_STATUS_LABELS,
  PurchaseRequestStatus,
  type PurchaseRequestSummaryDto,
} from "@falcao-erp/shared-types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { useDebounce } from "@/hooks/use-debounce";
import { formatCurrencyBRL, PurchaseRequestStatusBadge } from "../components/purchase-request-badges";
import { usePurchaseRequests } from "../hooks/use-purchase-requests";

const ALL = "all";
const PAGE_SIZE = 10;

interface PurchaseRequestsListPageProps {
  title?: string;
  description?: string;
  /** When set, the queue is restricted to these statuses and filtering/paging happens client-side. */
  queueStatuses?: PurchaseRequestStatus[];
  showCreateAction?: boolean;
}

export function PurchaseRequestsListPage({
  title = "Solicitações de Compras",
  description = "Acompanhe todas as solicitações de compra, do pedido à finalização.",
  queueStatuses,
  showCreateAction = true,
}: PurchaseRequestsListPageProps) {
  const navigate = useNavigate();
  const [search, setSearch] = React.useState("");
  const [status, setStatus] = React.useState<string>(ALL);
  const [page, setPage] = React.useState(1);
  const debouncedSearch = useDebounce(search, 300);

  React.useEffect(() => setPage(1), [debouncedSearch, status]);

  const isQueueMode = !!queueStatuses;
  const { data, isLoading, isFetching } = usePurchaseRequests(
    isQueueMode
      ? { page: 1, pageSize: 200, search: debouncedSearch || undefined }
      : { page, pageSize: PAGE_SIZE, search: debouncedSearch || undefined, status: status === ALL ? undefined : status },
  );

  let rows: PurchaseRequestSummaryDto[] = data?.data ?? [];
  let total = data?.meta.total ?? 0;
  let totalPages = data?.meta.totalPages ?? 1;

  if (isQueueMode && data) {
    const filtered = data.data.filter((request) => queueStatuses.includes(request.status));
    total = filtered.length;
    totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
    rows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={title}
        description={description}
        actions={
          showCreateAction ? (
            <Button onClick={() => navigate("/solicitacoes/novo")}>
              <Plus className="h-4 w-4" /> Nova Solicitação
            </Button>
          ) : undefined
        }
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por título..."
            className="pl-9"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
        {!isQueueMode && (
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-full sm:w-56">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Todos os status</SelectItem>
              {Object.values(PurchaseRequestStatus).map((value) => (
                <SelectItem key={value} value={value}>
                  {PURCHASE_REQUEST_STATUS_LABELS[value]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-14 w-full" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title={isQueueMode ? "Nenhuma solicitação pendente" : "Nenhuma solicitação encontrada"}
          description={
            isQueueMode
              ? "Não há solicitações aguardando sua ação no momento."
              : "Ajuste os filtros ou crie uma nova solicitação de compra."
          }
          action={
            showCreateAction && !isQueueMode ? (
              <Button size="sm" onClick={() => navigate("/solicitacoes/novo")}>
                <Plus className="h-4 w-4" /> Nova Solicitação
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className={`rounded-xl border border-border bg-card transition-opacity ${isFetching ? "opacity-60" : ""}`}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Título</TableHead>
                <TableHead>Solicitante</TableHead>
                <TableHead>Itens</TableHead>
                <TableHead>Total Estimado</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((request) => (
                <TableRow
                  key={request.id}
                  className="cursor-pointer"
                  onClick={() => navigate(`/solicitacoes/${request.id}`)}
                >
                  <TableCell>
                    <p className="font-medium text-foreground">{request.title}</p>
                    {request.costCenter && (
                      <p className="text-xs text-muted-foreground">C. Custo: {request.costCenter}</p>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{request.requesterName}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{request.itemCount}</TableCell>
                  <TableCell className="text-sm font-medium text-foreground">
                    {formatCurrencyBRL(request.estimatedTotal)}
                  </TableCell>
                  <TableCell>
                    <PurchaseRequestStatusBadge status={request.status} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <div className="flex items-center justify-between border-t border-border px-4 py-3">
            <p className="text-xs text-muted-foreground">
              {total} solicitaç{total === 1 ? "ão" : "ões"} · página {page} de {totalPages}
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
                disabled={page >= totalPages}
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
