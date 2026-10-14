import { Module } from "@nestjs/common";
import { StorageModule } from "../storage/storage.module";
import { InvoiceFilesService } from "./invoice-files.service";
import { PayablesController } from "./payables.controller";
import { PayablesRepository } from "./payables.repository";
import { PayablesService } from "./payables.service";

@Module({
  imports: [StorageModule],
  controllers: [PayablesController],
  providers: [PayablesService, PayablesRepository, InvoiceFilesService],
})
export class FinanceModule {}
