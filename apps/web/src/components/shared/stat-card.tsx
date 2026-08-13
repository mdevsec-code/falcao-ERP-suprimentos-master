import type { LucideIcon } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  trend?: { value: string; positive?: boolean };
  tone?: "default" | "primary" | "warning" | "success";
  comingSoon?: boolean;
}

const TONE_STYLES: Record<NonNullable<StatCardProps["tone"]>, string> = {
  default: "bg-muted text-muted-foreground",
  primary: "bg-primary/10 text-primary",
  warning: "bg-warning/10 text-warning",
  success: "bg-success/10 text-success",
};

export function StatCard({ label, value, icon: Icon, trend, tone = "default", comingSoon }: StatCardProps) {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
      <Card className={cn("relative overflow-hidden", comingSoon && "opacity-60")}>
        <CardContent className="flex items-start justify-between p-5">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
            <p className="mt-2 text-2xl font-semibold text-foreground">{comingSoon ? "—" : value}</p>
            {trend && !comingSoon && (
              <p className={cn("mt-1 text-xs font-medium", trend.positive ? "text-success" : "text-destructive")}>
                {trend.value}
              </p>
            )}
            {comingSoon && <p className="mt-1 text-xs text-muted-foreground">Em breve</p>}
          </div>
          <div className={cn("rounded-lg p-2.5", TONE_STYLES[tone])}>
            <Icon className="h-5 w-5" />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
