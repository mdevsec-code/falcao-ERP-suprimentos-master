import { Module } from "@nestjs/common";
import { QuotationsModule } from "../quotations/quotations.module";
import { RequisitionPlansController } from "./requisition-plans.controller";
import { RequisitionPlansService } from "./requisition-plans.service";

@Module({
  imports: [QuotationsModule],
  controllers: [RequisitionPlansController],
  providers: [RequisitionPlansService],
})
export class RequisitionPlansModule {}
