import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from "@nestjs/core";
import { ServeStaticModule } from "@nestjs/serve-static";
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";
import { resolve } from "node:path";
import { validateEnv } from "./config/env.validation";
import { HttpExceptionFilter } from "./common/filters/http-exception.filter";
import { JwtAuthGuard } from "./common/guards/jwt-auth.guard";
import { RolesGuard } from "./common/guards/roles.guard";
import { AuditLogInterceptor } from "./common/interceptors/audit-log.interceptor";
import { PrismaModule } from "./database/prisma.module";
import { AgendaModule } from "./modules/agenda/agenda.module";
import { AuditModule } from "./modules/audit/audit.module";
import { AuthModule } from "./modules/auth/auth.module";
import { CompaniesModule } from "./modules/companies/companies.module";
import { ContractsModule } from "./modules/contracts/contracts.module";
import { DisciplinesModule } from "./modules/disciplines/disciplines.module";
import { DocumentsModule } from "./modules/documents/documents.module";
import { FinanceModule } from "./modules/finance/finance.module";
import { HealthModule } from "./modules/health/health.module";
import { MailModule } from "./modules/mail/mail.module";
import { ProductsModule } from "./modules/products/products.module";
import { PurchaseRequestsModule } from "./modules/purchase-requests/purchase-requests.module";
import { QuotationsModule } from "./modules/quotations/quotations.module";
import { ReimbursementsModule } from "./modules/reimbursements/reimbursements.module";
import { RequisitionPlansModule } from "./modules/requisition-plans/requisition-plans.module";
import { StorageModule } from "./modules/storage/storage.module";
import { SupplierCatalogsModule } from "./modules/supplier-catalogs/supplier-catalogs.module";
import { SuppliersModule } from "./modules/suppliers/suppliers.module";
import { INLINE_UPLOAD_EXTENSIONS, uploadExtension } from "./modules/storage/upload-policy";
import { UsersModule } from "./modules/users/users.module";

@Module({
  imports: [
    // `.env` do app primeiro; depois o da raiz do monorepo (onde o README manda criar).
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [".env", "../../.env"],
      validate: validateEnv,
    }),
    ServeStaticModule.forRoot({
      // `resolve` (e não `join`): UPLOADS_DIR absoluto em produção (/var/lib/...) tem de
      // apontar para a mesma pasta em que o LocalStorageProvider grava.
      rootPath: resolve(process.env.UPLOADS_DIR ?? "uploads"),
      serveRoot: "/uploads",
      serveStaticOptions: {
        index: false,
        dotfiles: "deny",
        // Arquivos enviados por usuários: nunca deixe o navegador "adivinhar" o
        // tipo nem executar conteúdo; o que não é PDF/imagem/texto vira download.
        setHeaders: (res, filePath) => {
          res.setHeader("X-Content-Type-Options", "nosniff");
          if (!INLINE_UPLOAD_EXTENSIONS.has(uploadExtension(filePath))) {
            res.setHeader("Content-Disposition", "attachment");
            res.setHeader("Content-Security-Policy", "sandbox");
          }
        },
      },
    }),
    // Limite geral generoso; rotas sensíveis (login) usam @Throttle mais restrito.
    ThrottlerModule.forRoot([{ name: "default", ttl: 60_000, limit: 600 }]),
    PrismaModule,
    MailModule,
    AuthModule,
    UsersModule,
    CompaniesModule,
    StorageModule,
    SuppliersModule,
    DisciplinesModule,
    ProductsModule,
    PurchaseRequestsModule,
    QuotationsModule,
    RequisitionPlansModule,
    SupplierCatalogsModule,
    ContractsModule,
    FinanceModule,
    ReimbursementsModule,
    DocumentsModule,
    AgendaModule,
    AuditModule,
    HealthModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_FILTER, useClass: HttpExceptionFilter },
    { provide: APP_INTERCEPTOR, useClass: AuditLogInterceptor },
  ],
})
export class AppModule {}
