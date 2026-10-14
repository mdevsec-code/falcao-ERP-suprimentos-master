import { Module } from "@nestjs/common";
import { PublicQuotationsController } from "./public-quotations.controller";
import { QuotationsController } from "./quotations.controller";
import { QuotationsService } from "./quotations.service";

@Module({
  controllers: [QuotationsController, PublicQuotationsController],
  providers: [QuotationsService],
})
export class QuotationsModule {}
