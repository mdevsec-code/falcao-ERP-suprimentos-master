import { Module } from "@nestjs/common";
import { StorageModule } from "../storage/storage.module";
import { ProductsController } from "./products.controller";
import { ProductsRepository } from "./products.repository";
import { ProductsService } from "./products.service";

@Module({
  imports: [StorageModule],
  controllers: [ProductsController],
  providers: [ProductsService, ProductsRepository],
})
export class ProductsModule {}
