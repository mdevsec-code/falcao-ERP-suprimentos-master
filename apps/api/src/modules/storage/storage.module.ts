import { Module } from "@nestjs/common";
import { FilesController } from "./files.controller";
import { LocalStorageProvider } from "./local-storage.provider";
import { STORAGE_PROVIDER } from "./storage-provider.interface";

@Module({
  controllers: [FilesController],
  providers: [{ provide: STORAGE_PROVIDER, useClass: LocalStorageProvider }],
  exports: [STORAGE_PROVIDER],
})
export class StorageModule {}
