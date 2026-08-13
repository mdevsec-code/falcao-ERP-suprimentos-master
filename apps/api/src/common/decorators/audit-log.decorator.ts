import { SetMetadata } from "@nestjs/common";
import type { AuditAction } from "@falcao-erp/shared-types";

export interface AuditLogMetadata {
  entityType: string;
  action: AuditAction;
}

export const AUDIT_LOG_KEY = "auditLog";

export const AuditLog = (entityType: string, action: AuditAction) =>
  SetMetadata(AUDIT_LOG_KEY, { entityType, action } satisfies AuditLogMetadata);
