import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from "@nestjs/core";
import { ServeStaticModule } from "@nestjs/serve-static";
import { join } from "node:path";
import { validateEnv } from "./config/env.validation";
import { HttpExceptionFilter } from "./common/filters/http-exception.filter";
import { JwtAuthGuard } from "./common/guards/jwt-auth.guard";
import { RolesGuard } from "./common/guards/roles.guard";
import { AuditLogInterceptor } from "./common/interceptors/audit-log.interceptor";
import { PrismaModule } from "./database/prisma.module";
import { AuthModule } from "./modules/auth/auth.module";
import { CompaniesModule } from "./modules/companies/companies.module";
import { ProductsModule } from "./modules/products/products.module";
import { PurchaseRequestsModule } from "./modules/purchase-requests/purchase-requests.module";
import { StorageModule } from "./modules/storage/storage.module";
import { SuppliersModule } from "./modules/suppliers/suppliers.module";
import { UsersModule } from "./modules/users/users.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validateEnv }),
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), process.env.UPLOADS_DIR ?? "uploads"),
      serveRoot: "/uploads",
    }),
    PrismaModule,
    AuthModule,
    UsersModule,
    CompaniesModule,
    StorageModule,
    SuppliersModule,
    ProductsModule,
    PurchaseRequestsModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_FILTER, useClass: HttpExceptionFilter },
    { provide: APP_INTERCEPTOR, useClass: AuditLogInterceptor },
  ],
})
export class AppModule {}
