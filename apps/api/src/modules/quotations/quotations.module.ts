import { Module } from "@nestjs/common";
import { SuppliersModule } from "../suppliers/suppliers.module";
import { PublicOpenQuotationsController, PublicQuotationsController } from "./public-quotations.controller";
import { QuotationsController } from "./quotations.controller";
import { QuotationsService } from "./quotations.service";

@Module({
  imports: [SuppliersModule],
  controllers: [QuotationsController, PublicQuotationsController, PublicOpenQuotationsController],
  providers: [QuotationsService],
  exports: [QuotationsService],
})
export class QuotationsModule {}
