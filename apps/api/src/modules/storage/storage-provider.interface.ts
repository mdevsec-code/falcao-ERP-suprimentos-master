export interface StoredFile {
  path: string;
  url: string;
  size: number;
}

export const STORAGE_PROVIDER = "STORAGE_PROVIDER";

/**
 * Strategy boundary between the app and where files physically live.
 * Fase 1 ships LocalStorageProvider; swapping in an AzureBlobStorageProvider
 * later means implementing this interface only — no controller/service changes.
 */
export interface IStorageProvider {
  save(buffer: Buffer, options: { folder: string; fileName: string }): Promise<StoredFile>;
  delete(path: string): Promise<void>;
}
