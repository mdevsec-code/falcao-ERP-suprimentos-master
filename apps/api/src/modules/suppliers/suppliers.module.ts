import { Module } from "@nestjs/common";
import { StorageModule } from "../storage/storage.module";
import { SupplierSelfServiceService } from "./supplier-self-service.service";
import { PublicSupplierSignupController, SuppliersController } from "./suppliers.controller";
import { SupplierSignupService } from "./supplier-signup.service";
import { SuppliersRepository } from "./suppliers.repository";
import { SuppliersService } from "./suppliers.service";

@Module({
  imports: [StorageModule],
  controllers: [SuppliersController, PublicSupplierSignupController],
  providers: [SuppliersService, SuppliersRepository, SupplierSelfServiceService, SupplierSignupService],
  exports: [SupplierSelfServiceService],
})
export class SuppliersModule {}
