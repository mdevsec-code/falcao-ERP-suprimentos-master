import { Module } from "@nestjs/common";
import { StorageModule } from "../storage/storage.module";
import { ReimbursementsController } from "./reimbursements.controller";
import { ReimbursementsRepository } from "./reimbursements.repository";
import { ReimbursementsService } from "./reimbursements.service";

@Module({
  imports: [StorageModule],
  controllers: [ReimbursementsController],
  providers: [ReimbursementsService, ReimbursementsRepository],
})
export class ReimbursementsModule {}
