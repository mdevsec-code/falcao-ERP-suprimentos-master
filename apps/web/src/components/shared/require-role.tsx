import type * as React from "react";
import type { Role } from "@falcao-erp/shared-types";
import { useAuth } from "@/hooks/use-auth";

export function RequireRole({ roles, children }: { roles: Role[]; children: React.ReactNode }) {
  const { hasRole } = useAuth();
  if (!hasRole(...roles)) return null;
  return <>{children}</>;
}
