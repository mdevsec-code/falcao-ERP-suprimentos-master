import { ChevronsLeft, ChevronsRight, Lock } from "lucide-react";
import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";
import { BrandLogo } from "@/components/shared/brand-logo";
import { useVisibleNavigation } from "./use-visible-navigation";

export function Sidebar({
  collapsed,
  onToggle,
}: {
  collapsed: boolean;
  onToggle: () => void;
}) {
  const navigation = useVisibleNavigation();

  return (
    <aside
      className={cn(
        "hidden shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-all duration-200 md:flex",
        collapsed ? "w-[76px]" : "w-64",
      )}
    >
      <div className="flex h-16 items-center border-b border-sidebar-border px-4">
        <BrandLogo collapsed={collapsed} />
      </div>

      <nav className="scrollbar-thin flex-1 space-y-6 overflow-y-auto px-3 py-5">
        {navigation.map((section) => (
          <div key={section.title}>
            {!collapsed && (
              <p className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-wider text-sidebar-foreground/40">
                {section.title}
              </p>
            )}
            <div className="space-y-1">
              {section.items.map((item) => {
                const Icon = item.icon;
                if (item.comingSoon) {
                  return (
                    <div
                      key={item.href}
                      title="Módulo em desenvolvimento"
                      className={cn(
                        "flex cursor-not-allowed items-center gap-3 rounded-lg px-3 py-2 text-sm text-sidebar-foreground/35",
                        collapsed && "justify-center px-0",
                      )}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      {!collapsed && (
                        <span className="flex flex-1 items-center justify-between">
                          {item.label}
                          <Lock className="h-3 w-3" />
                        </span>
                      )}
                    </div>
                  );
                }
                return (
                  <NavLink
                    key={item.href}
                    to={item.href}
                    end={item.href === "/"}
                    className={({ isActive }) =>
                      cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-sidebar-foreground/80 transition-colors hover:bg-white/5 hover:text-sidebar-foreground",
                        isActive && "bg-primary/15 text-primary-foreground text-white",
                        collapsed && "justify-center px-0",
                      )
                    }
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    {!collapsed && <span>{item.label}</span>}
                  </NavLink>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <button
        onClick={onToggle}
        className="flex h-12 items-center justify-center border-t border-sidebar-border text-sidebar-foreground/60 transition-colors hover:bg-white/5 hover:text-sidebar-foreground"
      >
        {collapsed ? <ChevronsRight className="h-4 w-4" /> : <ChevronsLeft className="h-4 w-4" />}
      </button>
    </aside>
  );
}
