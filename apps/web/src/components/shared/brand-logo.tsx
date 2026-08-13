import { cn } from "@/lib/utils";

export function BrandLogo({ collapsed = false, className }: { collapsed?: boolean; className?: string }) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <img src="/falcao-icon.svg" alt="Falcão" className="h-8 w-8 shrink-0 rounded-lg" />
      {!collapsed && (
        <div className="leading-tight">
          <p className="text-sm font-bold tracking-wide text-sidebar-foreground">FALCÃO ERP</p>
          <p className="text-[11px] text-sidebar-foreground/60">Suprimentos &amp; Contratos</p>
        </div>
      )}
    </div>
  );
}
