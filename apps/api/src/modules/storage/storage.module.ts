import { Module } from "@nestjs/common";
import { LocalStorageProvider } from "./local-storage.provider";
import { STORAGE_PROVIDER } from "./storage-provider.interface";

@Module({
  providers: [{ provide: STORAGE_PROVIDER, useClass: LocalStorageProvider }],
  exports: [STORAGE_PROVIDER],
})
export class StorageModule {}
