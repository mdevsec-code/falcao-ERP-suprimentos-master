import { AnimatePresence, motion } from "framer-motion";
import { Lock, X } from "lucide-react";
import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";
import { BrandLogo } from "@/components/shared/brand-logo";
import { useVisibleNavigation } from "./use-visible-navigation";

export function MobileNav({ open, onClose }: { open: boolean; onClose: () => void }) {
  const navigation = useVisibleNavigation();

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-40 bg-background/70 backdrop-blur-sm md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.aside
            className="fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-sidebar text-sidebar-foreground md:hidden"
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "tween", duration: 0.2 }}
          >
            <div className="flex h-16 items-center justify-between border-b border-sidebar-border px-4">
              <BrandLogo />
              <button onClick={onClose} className="text-sidebar-foreground/70">
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-5">
              {navigation.map((section) => (
                <div key={section.title}>
                  <p className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-wider text-sidebar-foreground/40">
                    {section.title}
                  </p>
                  <div className="space-y-1">
                    {section.items.map((item) => {
                      const Icon = item.icon;
                      if (item.comingSoon) {
                        return (
                          <div
                            key={item.href}
                            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-sidebar-foreground/35"
                          >
                            <Icon className="h-4 w-4" />
                            <span className="flex flex-1 items-center justify-between">
                              {item.label}
                              <Lock className="h-3 w-3" />
                            </span>
                          </div>
                        );
                      }
                      return (
                        <NavLink
                          key={item.href}
                          to={item.href}
                          end={item.href === "/"}
                          onClick={onClose}
                          className={({ isActive }) =>
                            cn(
                              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-sidebar-foreground/80 hover:bg-white/5 hover:text-sidebar-foreground",
                              isActive && "bg-primary/15 text-white",
                            )
                          }
                        >
                          <Icon className="h-4 w-4" />
                          <span>{item.label}</span>
                        </NavLink>
                      );
                    })}
                  </div>
                </div>
              ))}
            </nav>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
