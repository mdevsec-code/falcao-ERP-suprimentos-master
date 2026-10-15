import { Module } from "@nestjs/common";
import { StorageModule } from "../storage/storage.module";
import { SupplierSelfServiceService } from "./supplier-self-service.service";
import { SuppliersController } from "./suppliers.controller";
import { SuppliersRepository } from "./suppliers.repository";
import { SuppliersService } from "./suppliers.service";

@Module({
  imports: [StorageModule],
  controllers: [SuppliersController],
  providers: [SuppliersService, SuppliersRepository, SupplierSelfServiceService],
  exports: [SupplierSelfServiceService],
})
export class SuppliersModule {}
