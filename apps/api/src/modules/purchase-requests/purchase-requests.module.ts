import { Module } from "@nestjs/common";
import { StorageModule } from "../storage/storage.module";
import { PurchaseRequestApprovalsService } from "./purchase-request-approvals.service";
import { PurchaseRequestsController } from "./purchase-requests.controller";
import { PurchaseRequestsRepository } from "./purchase-requests.repository";
import { PurchaseRequestsService } from "./purchase-requests.service";

@Module({
  imports: [StorageModule],
  controllers: [PurchaseRequestsController],
  providers: [PurchaseRequestsService, PurchaseRequestsRepository, PurchaseRequestApprovalsService],
})
export class PurchaseRequestsModule {}
