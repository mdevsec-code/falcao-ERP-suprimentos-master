import { useAuth } from "@/hooks/use-auth";
import { NAVIGATION, type NavSection } from "./navigation";

export function useVisibleNavigation(): NavSection[] {
  const { hasRole } = useAuth();

  return NAVIGATION.map((section) => ({
    ...section,
    items: section.items.filter((item) => !item.roles || hasRole(...item.roles)),
  })).filter((section) => section.items.length > 0);
}
