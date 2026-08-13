import {
  CalendarClock,
  ClipboardCheck,
  FileWarning,
  ShoppingCart,
  Truck,
  Wallet,
} from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { SUPPLIER_CATEGORY_LABELS } from "@falcao-erp/shared-types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { usePurchaseRequestStats } from "@/features/purchase-requests/hooks/use-purchase-requests";
import { useSupplierStats } from "@/features/suppliers/hooks/use-suppliers";
import { useAuth } from "@/hooks/use-auth";

export function DashboardPage() {
  const { user } = useAuth();
  const { data: stats, isLoading } = useSupplierStats();
  const { data: purchaseStats } = usePurchaseRequestStats();

  const categoryData = (stats?.byCategory ?? [])
    .map((row) => ({
      name: SUPPLIER_CATEGORY_LABELS[row.categoria],
      total: row.count,
    }))
    .sort((a, b) => b.total - a.total);

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Bem-vindo, ${user?.name?.split(" ")[0] ?? ""}`}
        description="Visão geral de Suprimentos & Contratos da Falcão Engenharia."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Fornecedores cadastrados"
          value={stats?.total ?? 0}
          icon={Truck}
          tone="primary"
        />
        <StatCard label="Fornecedores ativos" value={stats?.active ?? 0} icon={ClipboardCheck} tone="success" />
        <StatCard
          label="Solicitações de Compra"
          value={purchaseStats?.total ?? 0}
          icon={ShoppingCart}
          tone="default"
        />
        <StatCard
          label="Aprovações pendentes"
          value={purchaseStats?.pendingMyApproval ?? 0}
          icon={FileWarning}
          tone="warning"
        />
        <StatCard label="Contratos vencendo" value="—" icon={Wallet} tone="default" comingSoon />
        <StatCard label="Agenda de hoje" value="—" icon={CalendarClock} tone="default" comingSoon />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Fornecedores por categoria</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            {isLoading ? (
              <Skeleton className="h-full w-full" />
            ) : categoryData.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                Nenhum fornecedor cadastrado ainda.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryData} layout="vertical" margin={{ left: 24 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
                  <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={160}
                    tick={{ fontSize: 12 }}
                    stroke="hsl(var(--muted-foreground))"
                  />
                  <Tooltip
                    cursor={{ fill: "hsl(var(--muted))" }}
                    contentStyle={{
                      background: "hsl(var(--popover))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                  />
                  <Bar dataKey="total" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} barSize={18} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Próximos módulos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>
              O Dashboard Executivo completo (compras do mês, aprovações, contratos e financeiro) será
              preenchido conforme os próximos módulos do Falcão ERP entrarem em produção.
            </p>
            <ul className="list-inside list-disc space-y-1">
              <li>Contratos e renovações</li>
              <li>Financeiro e Reembolsos</li>
              <li>Agenda corporativa</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
