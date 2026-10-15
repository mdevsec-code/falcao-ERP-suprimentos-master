import { Module } from "@nestjs/common";
import { StorageModule } from "../storage/storage.module";
import { SuppliersModule } from "../suppliers/suppliers.module";
import { PublicCatalogsController, SupplierCatalogsController } from "./supplier-catalogs.controller";
import { SupplierCatalogsService } from "./supplier-catalogs.service";

@Module({
  imports: [StorageModule, SuppliersModule],
  controllers: [SupplierCatalogsController, PublicCatalogsController],
  providers: [SupplierCatalogsService],
})
export class SupplierCatalogsModule {}
