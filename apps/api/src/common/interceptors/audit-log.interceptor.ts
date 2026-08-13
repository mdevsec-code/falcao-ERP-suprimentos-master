import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import type { Prisma } from "../../../generated/prisma";
import { Observable, tap } from "rxjs";
import { PrismaService } from "../../database/prisma.service";
import { AUDIT_LOG_KEY, AuditLogMetadata } from "../decorators/audit-log.decorator";
import type { AuthenticatedRequest } from "../types/auth-request";

/**
 * Records a snapshot of the resulting entity (not a full before/after diff)
 * whenever a route is annotated with @AuditLog(). Same mechanism will be
 * reused by every future module — nothing here is Suppliers-specific.
 */
@Injectable()
export class AuditLogInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditLogInterceptor.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const metadata = this.reflector.get<AuditLogMetadata | undefined>(
      AUDIT_LOG_KEY,
      context.getHandler(),
    );

    if (!metadata) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();

    return next.handle().pipe(
      tap((result) => {
        const user = request.user;
        if (!user) return;

        const paramId = request.params?.id;
        const entityId =
          (result as { id?: string })?.id ?? (typeof paramId === "string" ? paramId : "unknown");

        this.prisma.auditLog
          .create({
            data: {
              companyId: user.companyId,
              userId: user.userId,
              action: metadata.action,
              entityType: metadata.entityType,
              entityId,
              changes:
                metadata.action === "DELETE"
                  ? undefined
                  : ({ after: result } as unknown as Prisma.InputJsonValue),
            },
          })
          .catch((error: unknown) => this.logger.error("Falha ao gravar audit log", error));
      }),
    );
  }
}
